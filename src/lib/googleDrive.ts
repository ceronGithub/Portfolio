// lib/googleDrive.ts
// Helper functions for Google Drive API interactions.
// Tokens are stored in the DB (GoogleToken table) — permanent until revoked.

import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// ── Save tokens to DB (upsert) ─────────────────────────────────────────
// Called after OAuth callback. Stores refresh token permanently.

export async function saveGoogleTokens(refreshToken: string, accessToken: string): Promise<void> {
  const accessExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now
  await prisma.googleToken.upsert({
    where:  { id: "singleton" },
    update: { refreshToken, accessToken, accessExpiry },
    create: { id: "singleton", refreshToken, accessToken, accessExpiry },
  });
}

// ── Get valid access token ─────────────────────────────────────────────
// Reads from DB. Uses cached access token if still valid.
// Auto-refreshes using refresh token when expired.

export async function getValidAccessToken(): Promise<string | null> {
  const record = await prisma.googleToken.findUnique({ where: { id: "singleton" } });
  if (!record) return null; // Never connected

  // Use cached access token if not expired (with 2-minute buffer)
  if (record.accessToken && record.accessExpiry) {
    const buffer = new Date(Date.now() + 2 * 60 * 1000);
    if (record.accessExpiry > buffer) return record.accessToken;
  }

  // Refresh using stored refresh token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: record.refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  const data = await res.json();
  if (!data.access_token) return null;

  // Cache the new access token in DB
  const accessExpiry = new Date(Date.now() + 3600 * 1000);
  await prisma.googleToken.update({
    where:  { id: "singleton" },
    data:   { accessToken: data.access_token, accessExpiry },
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
// Uses the resumable upload protocol for all files to prevent binary corruption.
// Multipart upload encodes the body as UTF-8 strings which corrupts large
// binary files (MP4, OBJ, FBX). Resumable upload sends the raw binary buffer
// in a separate step, preserving byte integrity for all file types.

export async function uploadFileToDrive(
  accessToken: string,
  fileName:    string,
  mimeType:    string,
  fileBuffer:  Buffer,
  folderId:    string
): Promise<{ id: string; name: string; webViewLink: string }> {
  // Step 1 — Initiate the resumable session, metadata only (JSON, no binary)
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });

  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization:   `Bearer ${accessToken}`,
        "Content-Type":  "application/json; charset=UTF-8",
        "X-Upload-Content-Type":   mimeType,
        "X-Upload-Content-Length": String(fileBuffer.length),
      },
      body: metadata,
    }
  );

  if (!initRes.ok) {
    const errBody = await initRes.json().catch(() => ({}));
    throw new Error(errBody?.error?.message ?? `Drive initiate upload failed: ${initRes.status}`);
  }

  // Step 2 — The Location header contains the resumable session URI
  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("Drive did not return a resumable upload URL.");

  // Step 3 — Upload the raw binary buffer in one PUT request
  const uploadRes = await fetch(uploadUrl, {
    method:  "PUT",
    headers: {
      "Content-Type":   mimeType,
      "Content-Length": String(fileBuffer.length),
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const errBody = await uploadRes.json().catch(() => ({}));
    throw new Error(errBody?.error?.message ?? `Drive upload failed: ${uploadRes.status}`);
  }

  return uploadRes.json();
}