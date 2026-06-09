import { redirect } from "next/navigation";

// Queue types are now managed inline in Admin → Content → Services. This old
// route just redirects there so any saved links keep working.
export default function ServicesRedirect() {
  redirect("/admin/content");
}
