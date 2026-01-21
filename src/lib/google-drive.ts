import { join, tempDir } from "@tauri-apps/api/path";
import { readFile, remove } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { Store } from "@tauri-apps/plugin-store";
import { getDb } from "./db";

// Placeholder for Client ID - You will need to replace this
const CLIENT_ID = "588153825793-rbj4mjgeghq52jsjpm624rpt0mgv9lj2.apps.googleusercontent.com";
const REDIRECT_URI = "sgmc://auth/callback";
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

  async getAuthUrl(): Promise<string>
  {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<void>
  {
    const body = new URLSearchParams({
      code: code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
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
    const store = await this.getStore();

    await store.set("access_token", data.access_token);
    if (data.refresh_token)
    {
      await store.set("refresh_token", data.refresh_token);
    }
    await store.set("token_expiry", Date.now() + (data.expires_in * 1000));
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

  async uploadBackup(): Promise<void>
  {
    const token = await this.getAccessToken();
    const folderId = await this.getOrCreateFolder();

    const db = await getDb();
    const tempName = `sgmc_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.db`;

    // Get SYSTEM temp dir as requested
    const tempDirectory = await tempDir();
    const tempPath = await join(tempDirectory, tempName);

    // Create snapshot using VACUUM INTO
    await db.execute(`VACUUM INTO '${tempPath}'`);

    try
    {
      const fileData = await readFile(tempPath);

      const metadata = {
        name: tempName,
        parents: [folderId],
      };

      const formData = new FormData();
      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      formData.append("file", new Blob([fileData], { type: "application/octet-stream" }));

      const uploadResponse = await fetch(`${UPLOAD_API_URL}?uploadType=multipart`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadResponse.ok)
      {
        throw new Error("Drive upload failed");
      }
    } finally
    {
      // Clean up temp file
      await remove(tempPath);
    }
  }

  async listBackups(): Promise<BackupFile[]>
  {
    const token = await this.getAccessToken();
    const folderId = await this.getOrCreateFolder();
    const query = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, createdTime)",
      orderBy: "createdTime desc",
    });

    const response = await fetch(`${DRIVE_API_URL}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return data.files || [];
  }

  async downloadBackup(fileId: string): Promise<Uint8Array>
  {
    const token = await this.getAccessToken();
    const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Download failed");
    return new Uint8Array(await response.arrayBuffer());
  }
}

export const googleDrive = new GoogleDriveClient();
