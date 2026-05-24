-- AlterTable
ALTER TABLE "Ownership" ADD COLUMN     "grantedTier" "PackageTier" NOT NULL DEFAULT 'mesh_only';
