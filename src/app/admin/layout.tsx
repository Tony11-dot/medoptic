// Admin follows the selected site language/direction (Hebrew + RTL by default),
// set on <html> by the LanguageProvider — same as the public site.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface text-ink">{children}</div>;
}
