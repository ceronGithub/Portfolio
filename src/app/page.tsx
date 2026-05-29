// Root route redirects to /visitor — all visitor logic lives in src/app/visitor/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/visitor");
}