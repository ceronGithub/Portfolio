// lib/googleDrive.ts
// Helper functions for Google Drive API interactions.
// Handles token refresh, folder listing, folder creation, and file uploads.
//
// HOW IT WORKS:
//   1. getValidAccessToken() — checks if access token is still valid, refreshes if not.
//   2. listDriveFolders()    — lists all top-level Drive folders the admin owns.
//   3. createDriveFolder()   — creates a subfolder inside a parent folder.
//   4. uploadFileToDrive()   — uploads a file buffer to a specific Drive folder.

import { cookies } from "next/headers";

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// ── Refresh the access token using the stored refresh token ───────────

export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken  = cookieStore.get("google_access_token")?.value;
  const refreshToken = cookieStore.get("google_refresh_token")?.value;

  if (accessToken) return accessToken;
  if (!refreshToken) return null;

  // Access token expired — use refresh token to get a new one
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  const data = await res.json();
  return data.access_token ?? null;
}

// ── List all folders in Google Drive ─────────────────────────────────
// Returns all folders the authenticated user owns, sorted by name.

export async function listDriveFolders(accessToken: string): Promise<{ id: string; name: string }[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&orderBy=name&pageSize=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const data = await res.json();
  return data.files ?? [];
}

// ── Create a subfolder inside a parent Drive folder ───────────────────

export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId: string
): Promise<string> {
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name:     folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents:  [parentFolderId],
    }),
  });

  const data = await res.json();
  return data.id;
}

// ── Upload a file to a Google Drive folder ────────────────────────────
// Uses multipart upload: metadata + file binary in one request.

export async function uploadFileToDrive(
  accessToken: string,
  fileName:    string,
  mimeType:    string,
  fileBuffer:  Buffer,
  folderId:    string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });

  const boundary = "-------matthew_studio_boundary";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`;
  const filePart = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const metaBuffer  = Buffer.from(metaPart, "utf-8");
  const fileHeader  = Buffer.from(filePart, "utf-8");
  const closeBuffer = Buffer.from(closeDelimiter, "utf-8");
  const body        = Buffer.concat([metaBuffer, fileHeader, fileBuffer, closeBuffer]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary="${boundary}"`,
        "Content-Length": String(body.length),
      },
      body,
    }
  );

  return res.json();
}
