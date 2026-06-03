// admin/uploads/UploadsClient.tsx — Admin file upload UI.
// Features:
//   1. Google Drive connect button (if not connected).
//   2. Drive folder selector (fetched live from Google Drive).
//   3. Product type selector (also Drive folders — admin picks the category).
//   4. Multi-file picker: MP4, .obj, .fbx, .glb, png/jpeg/webp.
//   5. Upload button — sends all files to Google Drive.
//   6. Upload progress + results list.
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./uploads.css";
import { useToast }  from "@/app/buyer/shared/useToast";
import ToastStack    from "@/app/buyer/shared/ToastStack";

interface DriveFolder {
  id:   string;
  name: string;
}

interface UploadResult {
  fileName: string;
  drive?:   string;
  error?:   string;
}

interface UploadsClientProps {
  isConnected:  boolean;
  googleAuthUrl: string;
}

// ── File type helpers ─────────────────────────────────────────────────

const ACCEPTED_TYPES = ".mp4,.obj,.fbx,.glb,.png,.jpg,.jpeg,.webp";

function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "mp4")                               return "🎬";
  if (ext === "fbx")                               return "🦴";
  if (ext === "glb")                               return "🌐";
  if (ext === "obj")                               return "🧊";
  if (["png","jpg","jpeg","webp"].includes(ext ?? "")) return "🖼️";
  return "📄";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Main Component ────────────────────────────────────────────────────

export default function UploadsClient({ isConnected, googleAuthUrl }: UploadsClientProps) {
  const { toasts, showToast, dismissToast } = useToast();
  // Drive folder state
  const [driveFolders,     setDriveFolders]     = useState<DriveFolder[]>([]);
  const [foldersLoading,   setFoldersLoading]   = useState(false);
  const [foldersError,     setFoldersError]     = useState<string | null>(null);
  const [needsReconnect,   setNeedsReconnect]   = useState(false);

  // Form state
  const [selectedDriveFolder,  setSelectedDriveFolder]  = useState<DriveFolder | null>(null);
  const [selectedProductType,  setSelectedProductType]  = useState<DriveFolder | null>(null);
  const [selectedFiles,        setSelectedFiles]        = useState<File[]>([]);

  // Upload state
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results,        setResults]        = useState<UploadResult[]>([]);
  const [uploadError,    setUploadError]    = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch Drive folders on mount (if connected) ───────────────────
  const fetchDriveFolders = useCallback(async () => {
    setFoldersLoading(true);
    setFoldersError(null);
    setNeedsReconnect(false);
    try {
      const res  = await fetch("/api/admin/drive/folders");
      const data = await res.json();
      if (res.status === 401) {
        setNeedsReconnect(true);
        setFoldersError(`Session expired (${data.error ?? "401"}): ${data.message ?? "Please reconnect Google Drive."}`);
        return;
      }
      if (!res.ok) {
        setFoldersError(`Error ${res.status} — ${data.error ?? ""}: ${data.message ?? "Could not load folders."}`);
        return;
      }
      setDriveFolders(data.folders ?? []);
    } catch {
      setFoldersError("Network error loading folders.");
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) fetchDriveFolders();
  }, [isConnected, fetchDriveFolders]);

  // ── Handle file selection ─────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const newFiles = files.filter(f => !existingNames.has(f.name));
      return [...prev, ...newFiles];
    });
    // Reset input so same files can be re-added after removal
    e.target.value = "";
  }

  function removeFile(fileName: string) {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
  }

  const mp4Files = selectedFiles.filter(f => f.name.endsWith(".mp4"));

  // ── Upload handler ────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedDriveFolder || !selectedProductType || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setResults([]);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("driveFolderId",  selectedDriveFolder.id);
    formData.append("productType",    selectedProductType.name);

    selectedFiles.forEach(file => formData.append("files", file));

    // Simulate progress while uploading (real progress requires XHR)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 2, 90));
    }, 300);

    try {
      const res  = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const data = await res.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const msg = data.error ?? "Upload failed.";
        setUploadError(msg);
        showToast(`✕ Upload failed — ${msg}`, "error");
      } else {
        const successCount = (data.results ?? []).filter((r: UploadResult) => !r.error).length;
        const failCount    = (data.results ?? []).filter((r: UploadResult) =>  r.error).length;
        setResults(data.results ?? []);
        setSelectedFiles([]);
        if (failCount === 0) {
          showToast(`✓ ${successCount} file${successCount !== 1 ? "s" : ""} uploaded to Google Drive.`, "success");
        } else {
          showToast(`⚠ ${successCount} uploaded, ${failCount} failed. Check results below.`, "warning");
        }
      }
    } catch (err) {
      clearInterval(progressInterval);
      setUploadError("Network error — please try again.");
      showToast("✕ Network error — upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  }

  const canUpload =
    isConnected &&
    selectedDriveFolder &&
    selectedProductType &&
    selectedFiles.length > 0 &&
    !uploading;

  // ── Render: not connected ─────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="uploadsPage">
        <div className="uploadsHeader">
          <h1 className="uploadsTitle">Upload Assets</h1>
          <p className="uploadsSubtitle">Connect Google Drive to start uploading</p>
        </div>
        <div className="uploadsConnectCard">
          <div className="uploadsConnectIcon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h2 className="uploadsConnectTitle">Google Drive not connected</h2>
          <p className="uploadsConnectDesc">
            Connect your Google Drive account to upload MP4s, 3D objects, and images directly from this panel.
          </p>
          <a href={googleAuthUrl} className="uploadsConnectBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Connect Google Drive
          </a>
        </div>
      </div>
    );
  }

  // ── Render: connected ─────────────────────────────────────────────
  return (
    <div className="uploadsPage">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="uploadsHeader">
        <div>
          <h1 className="uploadsTitle">Upload Assets</h1>
          <p className="uploadsSubtitle">Upload MP4s, 3D objects, and images to Google Drive</p>
        </div>
        <div className="uploadsDriveStatus">
          <span className="uploadsDriveStatusDot" />
          Google Drive connected
        </div>
      </div>

      {/* ── Reconnect banner — shown when token expired ── */}
      {needsReconnect && (
        <div className="uploadsReconnectBanner">
          <p className="uploadsReconnectText">
            ⚠️ Google Drive session expired. Reconnect to load your folders.
          </p>
          <a href={googleAuthUrl} className="uploadsConnectBtn" style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}>
            Reconnect Drive
          </a>
        </div>
      )}

      <div className="uploadsLayout">

        {/* ── Left: Configuration panel ── */}
        <div className="uploadsConfigPanel">

          {/* Step 1: Select Drive destination folder */}
          <div className="uploadsStep">
            <div className="uploadsStepHeader">
              <span className="uploadsStepNumber">1</span>
              <span className="uploadsStepLabel">Select Drive destination folder</span>
            </div>
            {foldersLoading ? (
              <p className="uploadsFolderLoading">Loading Drive folders…</p>
            ) : foldersError ? (
              <p className="uploadsFolderError">Could not load folders. <button onClick={fetchDriveFolders} className="uploadsRetryBtn">Retry</button></p>
            ) : (
              <div className="uploadsFolderGrid">
                {driveFolders.map(folder => (
                  <button
                    key={folder.id}
                    className={`uploadsFolderChip${selectedDriveFolder?.id === folder.id ? " uploadsFolderChipActive" : ""}`}
                    onClick={() => setSelectedDriveFolder(folder)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    {folder.name}
                  </button>
                ))}
                {driveFolders.length === 0 && (
                  <p className="uploadsEmptyFolders">No folders found in your Drive.</p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Select product type (also a Drive folder) */}
          <div className="uploadsStep">
            <div className="uploadsStepHeader">
              <span className="uploadsStepNumber">2</span>
              <span className="uploadsStepLabel">Select product type (category)</span>
            </div>
            <div className="uploadsFolderGrid">
              {driveFolders.map(folder => (
                <button
                  key={folder.id}
                  className={`uploadsFolderChip uploadsTypeChip${selectedProductType?.id === folder.id ? " uploadsFolderChipActive" : ""}`}
                  onClick={() => setSelectedProductType(folder)}
                >
                  {folder.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Pick files */}
          <div className="uploadsStep">
            <div className="uploadsStepHeader">
              <span className="uploadsStepNumber">3</span>
              <span className="uploadsStepLabel">Add files</span>
            </div>
            <div
              className="uploadsDropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                setSelectedFiles(prev => {
                  const existingNames = new Set(prev.map(f => f.name));
                  return [...prev, ...files.filter(f => !existingNames.has(f.name))];
                });
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              <p className="uploadsDropzoneText">Drag & drop or <span>click to browse</span></p>
              <p className="uploadsDropzoneHint">MP4 · OBJ · FBX · GLB · PNG · JPG · WEBP — multiple files allowed</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                className="uploadsHiddenInput"
                onChange={handleFileChange}
              />
            </div>
          </div>

        </div>

        {/* ── Right: Files panel ── */}
        <div className="uploadsFilesPanel">

          {selectedFiles.length === 0 ? (
            <div className="uploadsFilesEmpty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>No files selected yet</p>
            </div>
          ) : (
            <>
                <div className="uploadsFilesHeader">
                <span className="uploadsFilesCount">{selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected</span>
                <button className="uploadsClearBtn" onClick={() => { setSelectedFiles([]); }}>
                  Clear all
                </button>
              </div>

              <div className="uploadsFilesList">
                {selectedFiles.map(file => {
                  return (
                    <div key={file.name} className="uploadsFileRow">
                      <span className="uploadsFileIcon">{getFileIcon(file.name)}</span>
                      <div className="uploadsFileInfo">
                        <span className="uploadsFileName">{file.name}</span>
                        <span className="uploadsFileSize">{formatBytes(file.size)}</span>
                      </div>
                      <div className="uploadsFileActions">
                        <button className="uploadsRemoveBtn" onClick={() => removeFile(file.name)} title="Remove">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upload button */}
              <button
                className={`uploadsSubmitBtn${!canUpload ? " uploadsSubmitBtnDisabled" : ""}`}
                onClick={handleUpload}
                disabled={!canUpload}
              >
                {uploading ? (
                  <>
                    <span className="uploadsSpinner" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                    Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}
                  </>
                )}
              </button>

              {/* Progress bar */}
              {uploading && (
                <div className="uploadsProgressBar">
                  <div className="uploadsProgressFill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </>
          )}

          {/* ── Upload error ── */}
          {uploadError && (
            <div className="uploadsErrorBanner">{uploadError}</div>
          )}

          {/* ── Results ── */}
          {results.length > 0 && (
            <div className="uploadsResults">
              <p className="uploadsResultsTitle">Upload complete</p>
              {results.map(r => (
                <div key={r.fileName} className={`uploadsResultRow${r.error ? " uploadsResultRowError" : ""}`}>
                  <span className="uploadsResultIcon">{r.error ? "❌" : "✅"}</span>
                  <div className="uploadsResultInfo">
                    <span className="uploadsResultName">{r.fileName}</span>
                    {r.drive    && <span className="uploadsResultBadge uploadsResultBadgeDrive">Drive ✓</span>}
                    {r.error    && <span className="uploadsResultError">{r.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}