/** Shared vocabulary for The Commons: categories, statuses, poll rules. Used by server and client. */

export const CATEGORIES = [
  ["ai", "AI"], ["security", "Security"], ["devtools", "Developer tools"], ["infrastructure", "Infrastructure"],
  ["privacy", "Privacy"], ["data", "Data"], ["education", "Education"], ["research", "Research"], ["design", "Design"],
  ["documentation", "Documentation"], ["hardware", "Hardware"], ["other", "Other"],
] as const;
export type Category = (typeof CATEGORIES)[number][0];

export const PROJECT_TYPES = [
  ["library", "Library"], ["application", "Application"], ["research", "Research"], ["tool", "Tool"],
  ["framework", "Framework"], ["dataset", "Dataset"], ["documentation", "Documentation"], ["other", "Other"],
] as const;

export const STATUS: Record<string, { label: string; tone: "" | "ok" | "warn"; stage: "idea" | "vote" | "incubating" | "project" | "closed" }> = {
  draft: { label: "Draft", tone: "", stage: "idea" },
  submitted: { label: "Submitted", tone: "", stage: "idea" },
  discussion: { label: "In discussion", tone: "", stage: "idea" },
  revision_requested: { label: "Revision requested", tone: "warn", stage: "idea" },
  voting_scheduled: { label: "Vote scheduled", tone: "warn", stage: "vote" },
  voting_open: { label: "Voting open", tone: "warn", stage: "vote" },
  passed: { label: "Passed", tone: "ok", stage: "incubating" },
  not_passed: { label: "Not passed", tone: "", stage: "closed" },
  withdrawn: { label: "Withdrawn", tone: "", stage: "closed" },
  incubation: { label: "Incubating", tone: "ok", stage: "incubating" },
  recruiting: { label: "Recruiting", tone: "ok", stage: "incubating" },
  approved_to_launch: { label: "Approved to launch", tone: "ok", stage: "incubating" },
  active: { label: "Active project", tone: "ok", stage: "project" },
  completed: { label: "Completed", tone: "", stage: "closed" },
  paused: { label: "Paused", tone: "", stage: "closed" },
  archived: { label: "Archived", tone: "", stage: "closed" },
};

/** The §13 long-form fields, in the order the form and the page show them. */
export const FIELDS: { key: string; label: string; hint: string; required?: boolean; long?: boolean }[] = [
  { key: "problem", label: "Problem", hint: "What is missing or broken, and for whom?", required: true, long: true },
  { key: "audience", label: "Intended audience", hint: "Who would use or benefit from this?" },
  { key: "solution", label: "Proposed solution", hint: "What would we build?", required: true, long: true },
  { key: "why", label: "Why it matters", hint: "Why this, why now, why open source?", long: true },
  { key: "scope_mvp", label: "MVP scope", hint: "The smallest useful first version.", long: true },
  { key: "out_of_scope", label: "Out of scope", hint: "What this deliberately won't do." },
  { key: "stack", label: "Technology", hint: "Proposed stack, and alternatives considered." },
  { key: "roles_needed", label: "Skills and roles needed", hint: "Who would we need on the team?" },
  { key: "suggested_lead", label: "Suggested lead", hint: "Optional: who could lead or maintain it?" },
  { key: "repo_url", label: "Repository", hint: "Optional: an existing repository (https://…)." },
  { key: "license", label: "Licence", hint: "Proposed licence and any licensing considerations." },
  { key: "considerations", label: "Accessibility, privacy and security", hint: "Risks to people and how to address them.", long: true },
  { key: "milestones", label: "Milestones", hint: "A rough timeline." },
  { key: "risks", label: "Dependencies, risks and prior art", hint: "What already exists? What could go wrong?", long: true },
];

export const POLL_KINDS: Record<string, string> = {
  single: "Single choice",
  multi: "Multiple choice",
  yes_no_abstain: "Yes / No / Abstain",
  ranked: "Ranked choice (instant runoff)",
  interest: "Interest poll (advisory)",
};
export const ELIGIBILITY: Record<string, string> = {
  members: "Members who joined at least the stated number of days before the vote opened",
  contributors: "Approved contributors",
  followers: "Members following this proposal",
};
export const PASS_RULE: Record<string, string> = {
  simple_majority: "More Yes than No (abstentions count toward quorum only)",
  two_thirds: "At least two thirds of Yes + No votes are Yes",
  plurality: "The option with the most support wins",
};
export const OUTCOME: Record<string, string> = {
  passed: "Passed", not_passed: "Not passed", quorum_not_met: "Quorum not met", winner: "Decided",
  tie: "Tie: no single winner", no_votes: "No votes cast", advisory: "Advisory result",
};

export type Poll = {
  id: string; subject_type: "proposal" | "community"; subject_id: string | null; question: string; context: string | null;
  kind: keyof typeof POLL_KINDS; binding: boolean; eligibility: keyof typeof ELIGIBILITY; min_account_days: number;
  max_choices: number | null; opens_at: string; closes_at: string; quorum: number; pass_rule: string | null;
  vote_change: boolean; visibility: "anonymous" | "public"; decision_owner: string; next_action: string | null;
  status: "scheduled" | "open" | "closed" | "invalidated"; invalidated_reason: string | null; created_at: string;
};
export type PollOption = { id: string; position: number; label: string; description: string | null };
export type PollResult = { eligible: number; turnout: number; quorum_met: boolean; outcome: string; winner: string | null; tallies: Record<string, number>; rounds: { round: number; counts: Record<string, number> }[] | null; closed_at: string };

export type Proposal = {
  id: string; author_id: string; title: string; summary: string; category: Category; project_type: string; seeks_team: boolean;
  beginner_friendly: boolean; status: string; current_version: number; duplicate_of: string | null; active_poll: string | null;
  comment_count: number; created_at: string; updated_at: string;
};

export function proposalFieldsError(f: Record<string, string>) {
  for (const x of FIELDS) {
    const v = (f[x.key] ?? "").trim();
    if (x.required && v.length < 20) return `${x.label}: at least 20 characters.`;
    if (v.length > 4000) return `${x.label}: at most 4000 characters.`;
  }
  const repo = (f.repo_url ?? "").trim();
  if (repo && !/^https:\/\/\S{4,}$/.test(repo)) return "Repository must be an https:// link.";
  return "";
}

export const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
