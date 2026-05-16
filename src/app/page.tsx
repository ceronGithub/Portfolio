// Root page — redirects to cinematic visitor landing page.
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/visitor");
}