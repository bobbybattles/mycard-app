import { redirect } from "next/navigation";

// Legacy route. The dashboard is now the kit list at /app/kits, and editing
// happens at /app/kits/[kitId].
export default function DashboardRedirect() {
  redirect("/app/kits");
}
