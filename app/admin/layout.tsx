import type { Metadata } from "next";

// The queue is private: keep it out of search engines (the password in proxy.ts keeps it out of reach)
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
