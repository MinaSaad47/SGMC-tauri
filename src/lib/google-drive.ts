import { env } from "./config/env";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { join, tempDir } from "@tauri-apps/api/path";
import { readFile, remove } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Store } from "@tauri-apps/plugin-store";
import { getDb } from "./db";

const CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_PORT = 14200;

const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_API_URL = "https://www.googleapis.com/upload/drive/v3/files";
const STORE_PATH = "auth_store.bin";

export interface BackupFile
{
  id: string;
  name: string;
  createdTime: string;
  properties?: {
    appVersion?: string;
    patientCount?: string;
  };
}

// PKCE Helper Functions
async function generateCodeVerifier()
{
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string)
{
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(array: Uint8Array)
{
  let str = "";
  for (let i = 0; i < array.length; i++)
  {
    str += String.fromCharCode(array[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Compression Helpers
async function compressData(data: Uint8Array): Promise<Uint8Array>
{
  // @ts-ignore - CompressionStream might not be in all TS libs yet
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompressData(data: Uint8Array): Promise<Uint8Array>
{
  // @ts-ignore - DecompressionStream might not be in all TS libs yet
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

class GoogleDriveClient
{
  private _store: Store | null = null;

  private async getStore()
  {
    if (!this._store)
    {
      this._store = await Store.load(STORE_PATH);
    }
    return this._store;
  }

  async authenticate(): Promise<void>
  {
    // 1. Generate PKCE Verifier and Challenge
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store verifier temporarily
    const store = await this.getStore();
    await store.set("pkce_verifier", codeVerifier);
    await store.save();

    // 2. Start the local server listener
    const codePromise = invoke<string>("start_oauth_server", { port: REDIRECT_PORT });

    // 3. Open the browser to Google's Auth URL with PKCE params
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    await openUrl(`${AUTH_ENDPOINT}?${params.toString()}`);

    // 4. Wait for the code
    const code = await codePromise;

    // 5. Exchange code for tokens using verifier
    await this.exchangeCodeForToken(code, codeVerifier);
  }

  async exchangeCodeForToken(code: string, verifier?: string): Promise<void>
  {
    const store = await this.getStore();
    // Retrieve verifier from store if not passed
    const codeVerifier = verifier || await store.get<string>("pkce_verifier");

    if (!codeVerifier)
    {
      throw new Error("PKCE code verifier missing");
    }

    const body = new URLSearchParams({
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok)
    {
      const err = await response.text();
      throw new Error(`Token exchange failed: ${err}`);
    }

    const data = await response.json();

    await store.set("access_token", data.access_token);
    if (data.refresh_token)
    {
      await store.set("refresh_token", data.refresh_token);
    }
    await store.set("token_expiry", Date.now() + (data.expires_in * 1000));
    // Clean up verifier
    await store.delete("pkce_verifier");
    await store.save();
  }

  async getAccessToken(): Promise<string>
  {
    const store = await this.getStore();
    const expiry = await store.get<number>("token_expiry");
    const accessToken = await store.get<string>("access_token");

    if (accessToken && expiry && Date.now() < expiry - 60000)
    {
      return accessToken;
    }

    return this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<string>
  {
    const store = await this.getStore();
    const refreshToken = await store.get<string>("refresh_token");
    if (!refreshToken) throw new Error("No refresh token available");

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok)
    {
      await store.delete("access_token");
      await store.delete("refresh_token");
      await store.save();
      throw new Error("Refresh failed");
    }

    const data = await response.json();
    await store.set("access_token", data.access_token);
    await store.set("token_expiry", Date.now() + (data.expires_in * 1000));
    await store.save();

    return data.access_token;
  }

  async isAuthenticated(): Promise<boolean>
  {
    const store = await this.getStore();
    return !!(await store.get("refresh_token"));
  }

  async logout(): Promise<void>
  {
    const store = await this.getStore();
    await store.clear();
    await store.save();
  }

  private async getOrCreateFolder(): Promise<string>
  {
    const token = await this.getAccessToken();
    const query = new URLSearchParams({
      q: "name = 'SGMC Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id)",
    });

    const response = await fetch(`${DRIVE_API_URL}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.files && data.files.length > 0)
    {
      return data.files[0].id;
    }

    const createResponse = await fetch(DRIVE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "SGMC Backups",
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    const folder = await createResponse.json();
    return folder.id;
  }

  async uploadBackup(): Promise<string>
  {
    const token = await this.getAccessToken();
    const folderId = await this.getOrCreateFolder();

    const db = await getDb();
    const tempName = `sgmc_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.db.gz`;

    // Fetch Metadata
    const version = await getVersion();
    const patientCountResult = await db.select<any[]>("SELECT COUNT(*) as count FROM patients");
    const patientCount = patientCountResult?.[0]?.count?.toString() || "0";

    // Get SYSTEM temp dir
    const tempDirectory = await tempDir();
    const uniqueId = crypto.randomUUID().replace(/-/g, "");
    const tempDbPath = await join(tempDirectory, `temp_snapshot_${uniqueId}.db`);

    // Create snapshot using VACUUM INTO
    // Ensure path is absolute and correctly formatted for SQLite
    await db.execute(`VACUUM INTO '${tempDbPath}'`);

    try
    {
      const fileData = await readFile(tempDbPath);
      // Compress the data
      const compressedData = await compressData(fileData);

      const metadata = {
        name: tempName,
        parents: [folderId],
        properties: {
          appVersion: version,
          patientCount: patientCount,
        }
      };

      const formData = new FormData();
      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      // @ts-ignore - FormData.append might not be in all TS libs yet
      formData.append("file", new Blob([compressedData], { type: "application/octet-stream" }));

      const uploadResponse = await fetch(`${UPLOAD_API_URL}?uploadType=multipart`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadResponse.ok)
      {
        throw new Error("Drive upload failed");
      }

      const data = await uploadResponse.json();
      return data.id;
    } finally
    {
      // Clean up temp file
      await remove(tempDbPath);
    }
  }

  async listBackups(pageToken?: string, pageSize: number = 10): Promise<{ files: BackupFile[], nextPageToken?: string }>
  {
    const token = await this.getAccessToken();
    const folderId = await this.getOrCreateFolder();
    
    const params: Record<string, string> = {
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, createdTime, properties)",
      orderBy: "createdTime desc",
      pageSize: pageSize.toString(),
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const query = new URLSearchParams(params);

    const response = await fetch(`${DRIVE_API_URL}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
        throw new Error("Failed to list backups");
    }

    const data = await response.json();
    return { 
        files: data.files || [], 
        nextPageToken: data.nextPageToken 
    };
  }

  async downloadBackup(fileId: string): Promise<Uint8Array>
  {
    const token = await this.getAccessToken();

    // First get metadata to check filename for .gz extension
    const metaResponse = await fetch(`${DRIVE_API_URL}/${fileId}?fields=name`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meta = await metaResponse.json();
    const isCompressed = meta.name?.endsWith(".gz");

    const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Download failed");

    const data = new Uint8Array(await response.arrayBuffer());

    if (isCompressed)
    {
      return await decompressData(data);
    }
    return data;
  }
}

export const googleDrive = new GoogleDriveClient();
