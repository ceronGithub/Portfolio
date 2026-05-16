// lib/googleDrive.ts
// Helper functions for Google Drive API interactions.

import { cookies } from "next/headers";

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// ── Get valid access token ─────────────────────────────────────────────
// Tries access token first. If missing, uses refresh token to get a new one.
// Does NOT validate the token — Drive API will reject if invalid.

export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore  = await cookies();
  const accessToken  = cookieStore.get("google_access_token")?.value;
  const refreshToken = cookieStore.get("google_refresh_token")?.value;

  // Use stored access token directly — Drive API will tell us if expired
  if (accessToken) return accessToken;

  // No access token — try refreshing
  if (!refreshToken) return null;

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
  if (!data.access_token) return null;

  // Save new access token in cookie
  cookieStore.set("google_access_token", data.access_token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    maxAge:   3600,
    path:     "/",
  });

  return data.access_token;
}

// ── List all Drive folders ─────────────────────────────────────────────

export async function listDriveFolders(accessToken: string): Promise<{ id: string; name: string }[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false");
  const res   = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&orderBy=name&pageSize=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Drive API error ${res.status}`);
  }

  const data = await res.json();
  return data.files ?? [];
}

// ── Create subfolder inside a parent ──────────────────────────────────

export async function createDriveFolder(
  accessToken:    string,
  folderName:     string,
  parentFolderId: string
): Promise<string> {
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name:     folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents:  [parentFolderId],
    }),
  });
  const data = await res.json();
  return data.id;
}

// ── Upload file to Drive folder ────────────────────────────────────────

export async function uploadFileToDrive(
  accessToken: string,
  fileName:    string,
  mimeType:    string,
  fileBuffer:  Buffer,
  folderId:    string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const metadata    = JSON.stringify({ name: fileName, parents: [folderId] });
  const boundary    = "-------matthew_studio_boundary";
  const delimiter   = `\r\n--${boundary}\r\n`;
  const closeDelim  = `\r\n--${boundary}--`;

  const metaPart    = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`;
  const filePart    = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;
  const body        = Buffer.concat([
    Buffer.from(metaPart, "utf-8"),
    Buffer.from(filePart, "utf-8"),
    fileBuffer,
    Buffer.from(closeDelim, "utf-8"),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method:  "POST",
      headers: {
        Authorization:    `Bearer ${accessToken}`,
        "Content-Type":   `multipart/related; boundary="${boundary}"`,
        "Content-Length": String(body.length),
      },
      body,
    }
  );
  return res.json();
}