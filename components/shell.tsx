"use client";

import Link from "next/link";
import { DEMO_USERS } from "@/lib/demo-users";
import { useIdentity } from "./identity-provider";

export function Shell({ children }: { children: React.ReactNode }) {
  const { userId, ready, selectUser } = useIdentity();
  return <>
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Ajaia Docs dashboard"><span className="brand-mark">A</span><span>Ajaia Docs</span></Link>
        <div className="header-actions">
          <Link href="/" className="header-link">Dashboard</Link>
          <label className="identity-label" htmlFor="demo-identity">Demo identity</label>
          <select id="demo-identity" aria-label="Demo identity" value={userId ?? ""} disabled={!ready} onChange={(event) => void selectUser(event.target.value)}>
            {!ready && <option value="">Loading…</option>}
            {DEMO_USERS.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </div>
      </div>
    </header>
    {children}
  </>;
}
