-- Migration: add mediaDriveIds column to Product table
-- Stores a JSON map of { fieldName: driveFileId } for files uploaded to Google Drive.
-- Used to purge Drive files on product delete when only the R2 URL was saved to the media field.
ALTER TABLE "Product" ADD COLUMN "mediaDriveIds" TEXT;
