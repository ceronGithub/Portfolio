// admin/uploads/page.tsx — Admin file upload page.
// Protected: ADMIN only.
// Checks if Google Drive is connected (access token in cookies).
// Passes connection status to UploadsClient.

export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import { cookies }          from "next/headers";
import AdminShell           from "@/components/AdminShell";
import UploadsClient        from "./UploadsClient";
import "./uploads.css";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const REDIRECT_URI     = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google/callback";

// Builds the Google OAuth URL for Drive access
function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         "https://www.googleapis.com/auth/drive",
    access_type:   "offline",
    prompt:        "consent",
  });
  return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
}

export default async function AdminUploadsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName   = session.user?.name ?? session.user?.email ?? "Admin";
  const cookieStore = await cookies();
  const isConnected = !!(
    cookieStore.get("google_access_token")?.value ||
    cookieStore.get("google_refresh_token")?.value
  );
  const googleAuthUrl = buildGoogleAuthUrl();

  return (
    <AdminShell adminName={adminName}>
      <UploadsClient
        isConnected={isConnected}
        googleAuthUrl={googleAuthUrl}
      />
    </AdminShell>
  );
}