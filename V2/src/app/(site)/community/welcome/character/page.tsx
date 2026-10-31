import Link from "next/link";
import type { Metadata } from "next";

import { CharacterMaker } from "@/components/community/CharacterMaker";
import { requireMember } from "@/lib/community/member";

export const metadata: Metadata = { title: "Your character" };

export default async function CharacterStep() {
  const member = await requireMember("/community/welcome/character");
  return (
    <section className="cm-in cm-stack" aria-labelledby="char-title" style={{ maxWidth: "52rem" }}>
      <div>
        <p className="cm-eyebrow">Welcome to Northwind Cipher</p>
        <h1 id="char-title">Step 2 of 3: make your character.</h1>
        <p className="cm-lead">This is you in the office. Everyone sees you walk around live. You can change it any time from your profile.</p>
      </div>
      <div className="cm-panel"><CharacterMaker initial={member.profile?.avatar ?? null} next="/community/world?tour=1" /></div>
      <p className="cm-small"><Link className="cm-link" href="/community/world?tour=1">Skip for now and take the tour →</Link></p>
    </section>
  );
}
