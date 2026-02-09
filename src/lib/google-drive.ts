import { getAppConfig } from "@/lib/config/app";
import { getVersion } from "@tauri-apps/api/app";
import { listen } from "@tauri-apps/api/event";
import { join, tempDir } from "@tauri-apps/api/path";
import { exists, mkdir, readDir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Store } from "@tauri-apps/plugin-store";
import { env } from "./config/env";
import { getDb } from "./database";

const CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.VITE_GOOGLE_CLIENT_SECRET;

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

// Get Redirect URL
async function getRedirectUrl()
{
  const config = await getAppConfig();
  const REDIRECT_URI = `http://localhost:${config.port}/oauth/callback`;
  return REDIRECT_URI;
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

    // 2. Set up listener for the code BEFORE opening browser
    // This replaces the old blocking invoke("start_oauth_server")
    const codePromise = new Promise<string>((resolve) =>
    {
      listen<string>("oauth-code-received", (event) =>
      {
        resolve(event.payload);
      }).then((unlisten) =>
      {
        // Auto-unlisten after 5 minutes timeout to prevent leaks if user abandons
        setTimeout(() => unlisten(), 300000);
        // Also unlisten when resolved? Ideally yes, but promise resolves once.
        // For cleaner code, we assume the app lifecycle handles single auth attempts roughly.
      });
    });

    // 3. Open the browser to Google's Auth URL with PKCE params
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: await getRedirectUrl(),
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    await openUrl(`${AUTH_ENDPOINT}?${params.toString()}`);

    // 4. Wait for the code from the event
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
      redirect_uri: await getRedirectUrl(),
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

  private async getOrCreateFolder(folderName: string, parentId?: string): Promise<string>
  {
    const token = await this.getAccessToken();
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId)
    {
      query += ` and '${parentId}' in parents`;
    }

    const searchParams = new URLSearchParams({
      q: query,
      fields: "files(id)",
    });

    const response = await fetch(`${DRIVE_API_URL}?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.files && data.files.length > 0)
    {
      return data.files[0].id;
    }

    const body: any = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId)
    {
      body.parents = [parentId];
    }

    const createResponse = await fetch(DRIVE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const folder = await createResponse.json();
    return folder.id;
  }

  // List all files in a specific Drive folder to perform diff
  private async listRemoteFiles(folderId: string): Promise<Map<string, string>>
  {
    const token = await this.getAccessToken();
    const files = new Map<string, string>(); // Filename -> ID
    let pageToken: string | undefined = undefined;

    do
    {
      const params: Record<string, string> = {
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name)",
        pageSize: "1000", // Fetch max per page for speed
      };
      if (pageToken) params.pageToken = pageToken;

      const response = await fetch(`${DRIVE_API_URL}?${new URLSearchParams(params)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.files)
      {
        for (const file of data.files)
        {
          files.set(file.name, file.id);
        }
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return files;
  }

  // Upload a single file to Drive
  private async uploadFile(name: string, data: Uint8Array, parentId: string, mimeType: string = "application/octet-stream"): Promise<void>
  {
    const token = await this.getAccessToken();
    const metadata = {
      name,
      parents: [parentId],
    };

    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    // @ts-ignore
    formData.append("file", new Blob([data], { type: mimeType }));

    const response = await fetch(`${UPLOAD_API_URL}?uploadType=multipart`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok)
    {
      console.warn(`Failed to upload ${name}: ${await response.text()}`);
    }
  }

  async syncAttachments(rootFolderId: string): Promise<void>
  {
    try
    {
      // 1. Get/Create "attachments" folder inside "SGMC Backups"
      const attachmentsFolderId = await this.getOrCreateFolder("attachments", rootFolderId);

      // 2. List Remote Files
      const remoteFiles = await this.listRemoteFiles(attachmentsFolderId);

      // 3. List Local Files
      const config = await getAppConfig();
      const attachmentsDir = `${config.data_dir}/attachments`;
      
      if (!(await exists(attachmentsDir))) return;

      const localEntries = await readDir(attachmentsDir);
      const localFiles = localEntries.filter(e => e.isFile); // Only files

      // 4. Diff & Upload
      const uploads: Promise<void>[] = [];
      
      for (const file of localFiles)
      {
        if (!remoteFiles.has(file.name))
        {
          // New file! Upload it.
          const uploadTask = async () => {
             const filePath = await join(attachmentsDir, file.name);
             const data = await readFile(filePath);
             await this.uploadFile(file.name, data, attachmentsFolderId);
          };
          uploads.push(uploadTask());
        }
      }

      // 5. Execute concurrent uploads (simple batching)
      // For now, allow 3 parallel uploads to avoid choking network/drive API
      const BATCH_SIZE = 3;
      for (let i = 0; i < uploads.length; i += BATCH_SIZE) {
          await Promise.all(uploads.slice(i, i + BATCH_SIZE));
      }

    } catch (e)
    {
      console.error("Attachment sync failed:", e);
      // We don't fail the whole backup if attachments fail, just log it
    }
  }

  async restoreAttachments(rootFolderId: string): Promise<void>
  {
    try 
    {
       const config = await getAppConfig();
       const attachmentsDir = `${config.data_dir}/attachments`;
       if (!(await exists(attachmentsDir))) {
          await mkdir(attachmentsDir, { recursive: true });
       }

       // 1. Find remote attachments folder
       const attachmentsFolderId = await this.getOrCreateFolder("attachments", rootFolderId);
       
       // 2. List all remote attachments
       const remoteFiles = await this.listRemoteFiles(attachmentsFolderId);

       // 3. Download missing files
       const downloads: Promise<void>[] = [];
       for (const [name, id] of remoteFiles.entries()) {
          const localPath = await join(attachmentsDir, name);
          if (!(await exists(localPath))) {
             const task = async () => {
                const data = await this.downloadFile(id); // Use separate download method
                await writeFile(localPath, data);
             };
             downloads.push(task());
          }
       }

       // 4. Execute concurrent downloads
       const BATCH_SIZE = 5;
       for (let i = 0; i < downloads.length; i += BATCH_SIZE) {
          await Promise.all(downloads.slice(i, i + BATCH_SIZE));
       }

    } catch (e) {
       console.error("Attachment restore failed:", e);
    }
  }

  // Helper for generic file download (reused by backup download)
  async downloadFile(fileId: string): Promise<Uint8Array> {
      const token = await this.getAccessToken();
      const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Download failed");
      return new Uint8Array(await response.arrayBuffer());
  }

  async uploadBackup(): Promise<string>
  {
    const token = await this.getAccessToken();
    const folderId = await this.getOrCreateFolder("SGMC Backups");

    // 1. Trigger Attachment Sync (Incremental)
    // We await this so the backup is consistent, but UI might want to show separate progress?
    // For now, part of the same Promise.
    await this.syncAttachments(folderId);

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
    const folderId = await this.getOrCreateFolder("SGMC Backups");
    
    const params: Record<string, string> = {
      q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`, // Exclude the attachments folder itself
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

    // Trigger restore of attachments alongside DB
    // We need the root folder ID first.
    // Optimization: We could store root ID, but fetching it is safe.
    try {
       const rootFolderId = await this.getOrCreateFolder("SGMC Backups");
       await this.restoreAttachments(rootFolderId);
    } catch (e) {
       console.warn("Auto-restore of attachments failed, proceeding with DB only", e);
    }

    // First get metadata to check filename for .gz extension
    const metaResponse = await fetch(`${DRIVE_API_URL}/${fileId}?fields=name`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meta = await metaResponse.json();
    const isCompressed = meta.name?.endsWith(".gz");

    const data = await this.downloadFile(fileId);

    if (isCompressed)
    {
      return await decompressData(data);
    }
    return data;
  }
}

export const googleDrive = new GoogleDriveClient();