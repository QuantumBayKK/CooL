import type { Metadata } from "next";

import { AdminPanel } from "@/components/community/AdminPanel";
import { requireMember } from "@/lib/community/member";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  const member = await requireMember("/community/admin");
  if (!member.owner) {
    return (
      <section className="cm-in cm-stack" style={{ maxWidth: "40rem" }}>
        <p className="cm-eyebrow">Admin</p>
        <h1>Owners only.</h1>
        <p className="cm-lead">This page is for the Northwind Cipher team.</p>
      </section>
    );
  }
  return (
    <div className="cm-in cm-stack">
      <header className="cm-head">
        <p className="cm-eyebrow">Admin</p>
        <h1>Community admin.</h1>
        <p className="cm-lead">Members, contributor applications, permissions and features.</p>
      </header>
      <AdminPanel />
    </div>
  );
}
