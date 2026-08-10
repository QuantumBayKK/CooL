/**
 * Marketing copy that appears in more than one place, or that carries a
 * promise the company has to keep.
 *
 * Kept as data rather than inline JSX for two reasons. The FAQ has to exist
 * twice — once as visible copy and once as `FAQPage` structured data — and two
 * hand-maintained copies of the same answer will disagree within a month. And
 * the response-time promise is quoted on the contact page, in the FAQ, and on
 * the thank-you page; a promise that says "one working day" in one place and
 * "48 hours" in another is worse than not making it.
 */

/* ── the response-time promise ────────────────────────────────────────────── */

/**
 * Deliberately modest.
 *
 * This is a two-person company in Chennai and Bangalore. "We reply within the
 * hour" is the kind of promise that is easy to type and impossible to keep
 * through a bad week, and a missed promise on the first interaction is a worse
 * signal than a slower promise kept every time. One working day is honest, and
 * the timezone is stated because a reader in California should be able to work
 * out what that means for them.
 */
export const RESPONSE = {
  short: "We reply within one working day.",
  long: "Every enquiry reaches both founders directly — there is no queue and no support tier. We answer within one working day, IST (UTC+5:30). If your question is technical, the person who wrote the code is the person who replies.",
  window: "one working day",
} as const;

/* ── FAQ ──────────────────────────────────────────────────────────────────── */

export interface Faq {
  readonly q: string;
  /** Plain text. It is rendered as copy *and* emitted as JSON-LD, and
   *  structured data must not contain markup. */
  readonly a: string;
}

/**
 * Five questions, chosen by what a sceptical engineer actually asks in the
 * first five minutes — not by what is most flattering to answer.
 *
 * Two of them are hostile on purpose. "What can't it do yet" and "why should I
 * believe you" are the questions that decide whether the rest of the site gets
 * read, and burying them would be both dishonest and bad marketing: the answer
 * to each is a reason to trust the product, but only if the site is the thing
 * that raised them.
 */
export const FAQS: readonly Faq[] = [
  {
    q: "What does CooL actually record?",
    a: "Every change to the behaviour of your AI system: a prompt edit, a model or version swap, a temperature change, a permission grant, a tool being enabled. Each one becomes a signed record containing what changed, from what to what, who did it, under which policy, and when. The record is committed to an append-only transparency log, so its position in history is provable rather than asserted.",
  },
  {
    q: "Do I have to change my inference code?",
    a: "No. Capture is out-of-band and asynchronous — it never sits in the request path of a model call, adds no latency to inference, and fails open. If CooL is unreachable your AI keeps serving; what could not be queued is counted and written as a signed entry rather than silently dropped.",
  },
  {
    q: "What can CooL not prove yet?",
    a: "Two things, and both are enforced in the verifier rather than in the marketing. Hardware attestation reports as simulated: this build has no vendor-rooted TEE quote, so it cannot prove which machine produced a record. And there is no independent witness co-signing the log, so consistency rests on our log alone. Run the verifier with --require-hardware against a record sealed a minute ago and it refuses. A demo that could only go green would prove nothing.",
  },
  {
    q: "Why should I believe any of this?",
    a: "You should not, and the product is built so you do not have to. The verifier is published on npm as cool-nwc, it runs entirely offline, and it will reject a record we produced if that record is wrong. The demo on this site runs the real cryptography in your own browser — real ML-DSA-65 and Ed25519 signatures, a real RFC 6962 Merkle log — with no server involved, and it includes buttons that forge the receipt so you can watch the same verifier reject it.",
  },
  {
    q: "What does it cost, and what happens to my data?",
    a: "The receipt format, the verifier and the SDK are open and free — anyone can issue and check a CooL receipt without paying us or asking us. The commercial product is the compliance work around the record: a managed transparency log, witnessing and timestamping, compliance mapping, and enterprise or on-premise deployments. Your evidence, prompts and personal data stay inside your own boundary; that split between control plane and data plane is architectural, not a policy promise.",
  },
] as const;

/* ── worked example ───────────────────────────────────────────────────────── */

/**
 * A modelled scenario, and labelled as one everywhere it appears.
 *
 * This is NOT a customer deployment and must never be presented as one. CooL
 * is pre-launch with no production users, so a case study naming a bank and
 * quoting its recovered hours would be a fabrication — on a site whose entire
 * argument is that claims should be checkable, and whose CI fails the build if
 * it detects a phrase from a readiness rung above the one the product is on.
 *
 * What it can honestly be is a worked example: a realistic regulated workflow,
 * with the before/after derived from what the pipeline demonstrably produces.
 * Every number here is traceable to something the reader can check on this
 * site — the demo produces the receipt, the verifier checks it offline, the
 * export is one file. `basis` says so for each figure.
 */
export const CASE_STUDY = {
  label: "Worked example · not a customer deployment",
  sector: "Retail lending · RBI-regulated",
  title: "An adverse-action prompt changes on a Tuesday. In March, a regulator asks why.",
  scenario:
    "A credit-scoring assistant declines applicants and must explain why. In April an engineer edits the system prompt to return the top three contributing factors; in May the router is moved from GPT-4o to o3; in June a permission grant lets the agent read a new bureau feed. Each is routine. Together they mean the model that declined an applicant in April is not the model that would decline them in June — and the bank has to be able to say which one ran.",
  without: [
    "Three separate systems hold part of the answer: git history, a Slack thread, and a ticket nobody linked.",
    "The prompt change has no approver recorded anywhere durable — the reviewer approved it verbally in standup.",
    "Logs proving what ran sit on servers the bank controls, which is exactly the party with a reason to edit them after a complaint lands.",
  ],
  with: [
    "Each change is sealed as it happens, with its author, its policy reference and its position in an append-only log.",
    "The April receipt is retrieved by date and shows the exact prompt, the exact model version, and who approved it.",
    "The regulator's own analyst verifies the receipt offline, with the published verifier, without contacting the bank or us.",
  ],
  figures: [
    {
      k: "Time to answer “which model ran on 14 April?”",
      v: "One query",
      basis: "The console filters sealed records by date and surface; the demo shows the record shape.",
    },
    {
      k: "Evidence pack for the audit period",
      v: "One signed file",
      basis: "A single export with a signed manifest, rather than an assembled folder of screenshots.",
    },
    {
      k: "Independent verification",
      v: "Offline, ~200ms",
      basis: "cool verify --offline on the regulator's own machine. Network requests during verification: 0.",
    },
  ],
} as const;

/* ── reviews ──────────────────────────────────────────────────────────────── */

export interface Review {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  /** Where the quote came from, so a reader can weigh it. */
  readonly source: string;
}

/**
 * EMPTY, AND THAT IS THE CORRECT STATE TODAY.
 *
 * The brief asked for "real customer reviews". CooL is pre-launch: there are
 * no customers, so there are no real reviews, and inventing them was not an
 * option. A fabricated testimonial is a lie told to a reader who is
 * specifically trying to decide whether this company can be trusted with
 * evidence — and it would sit on the same page as a section headed "the two
 * things this cannot prove yet". The contradiction would be fatal, and it
 * would be deserved.
 *
 * The section is built and works. It renders nothing while this array is
 * empty, so the site simply does not have a reviews section yet, rather than
 * having a fake one. Add real, attributed, permission-granted quotes here and
 * it appears — no other change needed.
 *
 * Design-partner and pilot feedback both qualify. What does not qualify is a
 * quote nobody said, a name nobody agreed to, or a role invented to make a
 * quote land harder.
 */
export const REVIEWS: readonly Review[] = [];
