"use client";

/**
 * The story.
 *
 * Ten chapters, read top to bottom, one column. It opens on an ordinary morning
 * rather than on a market, because "AI governance is a $12bn opportunity" is a
 * sentence nobody has ever felt anything about, and "someone changed one line
 * of a prompt" is a sentence half the people reading this did last week.
 *
 * The argument is built to survive a sceptic:
 *
 *   · every number is labelled as an estimate where it is one;
 *   · the chapter on what the product does NOT prove is a chapter, not a
 *     footnote, and it sits before the close rather than after it;
 *   · nothing here claims a customer we do not have.
 *
 * A reader who finishes should be able to argue the case themselves. That is a
 * higher bar than being persuaded, and it is the only one that survives being
 * repeated to somebody else in a meeting we are not in.
 */
import Link from "next/link";
import {
  B,
  Box,
  Chapter,
  Lede,
  List,
  Note,
  Numbers,
  P,
  Passage,
  Pull,
  Reveal,
} from "./prose";
import {
  Investigation,
  Ledger,
  ReceiptAnatomy,
  RegulatoryClock,
  Sprawl,
  TheYear,
  ThirtySeconds,
} from "./figures";

const CHAPTERS = [
  ["01", "opening", "Thirty seconds"],
  ["02", "sprawl", "Ten systems"],
  ["03", "tuesday", "Then Tuesday"],
  ["04", "question", "The question"],
  ["05", "regulator", "The deadline"],
  ["06", "deal", "The deal"],
  ["07", "reconstruction", "What people do"],
  ["08", "receipt", "The receipt"],
  ["09", "honesty", "What it isn't"],
  ["10", "now", "Why now"],
] as const;

export function WhyStory() {
  return (
    <article className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:pt-24">
      {/* ── the open ── */}
      <Reveal>
        <p className="font-mono text-[11.5px] tracking-[0.24em] text-verify uppercase">
          Why CooL exists
        </p>
        <h1 className="mt-5 max-w-[16ch] text-[clamp(2.6rem,10vw,5rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-ink text-balance">
          It is one ordinary morning.
        </h1>
        <p className="mt-7 max-w-[54ch] text-[clamp(1.05rem,2.6vw,1.35rem)] leading-[1.55] text-fog">
          Someone changes one line of a prompt. That part is over in thirty
          seconds. What follows is the rest of somebody&rsquo;s afternoon — and,
          by December, three to four weeks of a team&rsquo;s year.
        </p>
        <p className="mt-6 max-w-[54ch] text-[15px] leading-[1.75] text-mist">
          This is a long page. It is the argument for the product, told the way
          it actually happens rather than the way it fits on a slide. If you
          would rather see the thing working,{" "}
          <Link href="/demo" className="text-verify hover:underline">
            the live demo runs the real cryptography in your browser
          </Link>
          .
        </p>
      </Reveal>

      {/* ── contents ── */}
      <Reveal>
        <nav aria-label="Contents" className="mt-12 border-y border-line py-5">
          <p className="mb-3 font-mono text-[10.5px] tracking-[0.18em] text-mist uppercase">
            Contents
          </p>
          <ol className="flex flex-wrap gap-x-5 gap-y-2">
            {CHAPTERS.map(([no, id, title]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-[13.5px] text-fog transition-colors hover:text-ink"
                >
                  <span className="mr-1.5 font-mono text-[11px] text-mist">{no}</span>
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Reveal>

      <div className="mt-14 space-y-0 sm:mt-20">
        {/* ── 01 ───────────────────────────────────────────────────────── */}
        <Chapter no="01" id="opening" title="The thirty seconds, and the afternoon">
          <Lede>
            The change is never the expensive part. The change takes thirty
            seconds. Everything that has to happen <em>because</em> of the change
            is what takes the rest of the day.
          </Lede>

          <Passage>
            <P>
              Say the prompt for a lending model gets one extra instruction:
              cite the clause you decided under. It is a good edit. It makes the
              system more explainable, not less. Somebody types it, tests it,
              ships it, and goes to get a coffee.
            </P>
            <P>
              By the time they are back at their desk, six jobs exist that did
              not exist at 09:13. Nobody assigned them. Nobody scheduled them.
              They simply arrived, the way they arrive every time anything about
              an AI system changes.
            </P>
          </Passage>

          <List
            tone="fail"
            items={[
              ["Write it up", "a document explaining what changed, and why"],
              ["Get it approved", "chase security and compliance for a sign-off"],
              ["Update the register", "log it in whatever governance system exists"],
              ["Tell the right people", "notify whoever owns the risk downstream"],
              ["File the evidence", "store proof, in case an auditor ever asks"],
              ["Set the retention", "seven years, sometimes ten, depending on the regime"],
            ]}
          />

          <Passage>
            <P>
              None of it is hard. Not one of those six tasks requires a senior
              person, or a decision, or any judgment at all. That is exactly
              what makes it so expensive: it is{" "}
              <B tone="fail">work that is too dull to do carefully and too
              consequential to skip</B>.
            </P>
          </Passage>

          <ThirtySeconds />

          <Passage>
            <P>
              So it gets done badly. The document gets written from memory two
              days later. The approval is a thumbs-up in a direct message. The
              register entry says &ldquo;prompt update&rdquo; and the date. The
              evidence is a screenshot in a folder somebody will reorganise next
              quarter.
            </P>
            <P>
              Everyone involved knows it is thin. Everyone involved also has
              actual work to do, and the thin version has never once caused a
              problem — right up until the afternoon it does.
            </P>
          </Passage>
        </Chapter>

        {/* ── 02 ───────────────────────────────────────────────────────── */}
        <Chapter no="02" id="sprawl" title="Ten systems, and none of them talk">
          <Lede>
            The reason it takes an afternoon is not the writing. It is that the
            same six facts have to be typed into ten different places, by hand,
            in ten slightly different formats.
          </Lede>

          <Passage>
            <P>
              The commit is in Git. The ticket is in Jira. The change document
              is in Confluence. The risk entry is in ServiceNow. The
              notification is in Slack. The approval is in email, or in a
              spreadsheet somebody made, or in a thread. The evidence is on a
              shared drive. The retention clock is in a GRC tool that one person
              knows how to use.
            </P>
          </Passage>

          <Sprawl />

          <Passage>
            <P>
              None of these systems is bad. Each one is good at the job it was
              bought for. The problem is the space <em>between</em> them, and
              the space between them is filled entirely with people copying
              things.
            </P>
            <P>
              Which means that by Friday, the ten copies disagree. The Jira
              ticket says one thing, the Confluence page says another, and the
              register says a third, because each was written at a different
              hour by a different person working from a different memory of what
              happened. And here is the part that matters:{" "}
              <B>there is no way to tell which one is right.</B>
            </P>
          </Passage>

          <Pull tone="fail">
            Ten records of the same event, none of them authoritative, all of
            them written by hand after the fact.
          </Pull>
        </Chapter>

        {/* ── 03 ───────────────────────────────────────────────────────── */}
        <Chapter no="03" id="tuesday" title="Then Tuesday arrives">
          <Lede>
            One change is an annoyance. The arithmetic is what makes it a
            business problem.
          </Lede>

          <Passage>
            <P>
              A team shipping AI changes a few times a week is not doing this
              once. They are doing it on Tuesday, and again on Thursday, and
              twice the following Monday because someone tuned two prompts. The
              afternoon is not an afternoon. It is a standing tax on every
              improvement anybody makes.
            </P>
            <P>
              And the tax scales with exactly the thing every company is
              currently trying to accelerate. The faster you adopt AI, the more
              changes you make. The more changes you make, the more of this you
              do. <B tone="fail">Moving quickly makes it worse.</B>
            </P>
          </Passage>

          <TheYear />

          <Numbers
            tone="fail"
            items={[
              ["3–4 weeks", "of staff time, per team, per year, on paperwork"],
              ["₹40–60L", "a year in compliance effort a mid-size AI team absorbs"],
              ["10 systems", "holding ten versions of the same disputed fact"],
            ]}
          />

          <Note>
            These are our estimates for a mid-size AI team, not a measured
            benchmark from a customer deployment — we do not have one to quote,
            and inventing one would be the first small lie in a product whose
            entire premise is not telling them. What we are confident about is
            the direction, and the direction is the argument.
          </Note>
        </Chapter>

        {/* ── 04 ───────────────────────────────────────────────────────── */}
        <Chapter no="04" id="question" title="The question nobody can answer">
          <Lede>
            Six weeks later, something goes wrong. And the company discovers
            that the paperwork was never the point.
          </Lede>

          <Passage>
            <P>
              Refunds are up six times over. Or the model is declining
              applications it used to approve. Or a regulator&rsquo;s required
              reason codes have quietly stopped appearing on four percent of
              decisions. Somebody notices, and asks the only question worth
              asking.
            </P>
          </Passage>

          <Box kind="voice" label="The question">
            &ldquo;What changed?&rdquo;
          </Box>

          <Passage>
            <P>
              And the room goes quiet — because the honest answer is that
              nobody knows. Not because anybody was careless, but because the
              information needed to answer it was never assembled. It exists,
              scattered, in ten systems: a commit here, a thread there, a
              config change nobody wrote down because it was &ldquo;just a
              parameter&rdquo;.
            </P>
            <P>
              So a room of expensive people spends the afternoon reconstructing
              a week they were all present for. Somebody scrolls Slack. Somebody
              diffs the repo. Somebody asks the platform team whether anything
              changed on their side. Four hours later they land on the answer,
              and it is almost always something small that somebody shipped on a
              Tuesday and correctly considered routine.
            </P>
          </Passage>

          <Investigation />

          <Passage>
            <P>
              The cost is not the four hours. The cost is the four hours{" "}
              <em>while it is still happening</em> — while the refunds keep
              going out, while the declines keep landing on real applicants,
              while the incident channel fills up with people who cannot help
              because nobody can tell them what to fix.
            </P>
            <P>
              And the version of this that keeps executives awake is the one
              where the answer never arrives at all. Where the change that
              caused it was a provider updating their model underneath you,
              silently, with no record on either side that anything happened.
            </P>
          </Passage>

          <Pull tone="fail">
            You cannot roll back a change you cannot identify.
          </Pull>
        </Chapter>

        {/* ── 05 ───────────────────────────────────────────────────────── */}
        <Chapter no="05" id="regulator" title="The deadline that cannot be backfilled">
          <Lede>
            Everything so far has been expensive. This is the part that becomes
            impossible.
          </Lede>

          <Passage>
            <P>
              The EU AI Act requires high-risk AI systems to keep automatic,
              lifelong logs of their operation — Article 12, traceability. India&rsquo;s
              DPDP Rules put a parallel clock on retention and independent audit
              for significant data fiduciaries. Sector regulators are arriving
              behind both.
            </P>
            <P>
              The obligations are not unreasonable. Most of them amount to:{" "}
              <em>be able to show what your system did, and when, and on whose
              authority.</em> Any well-run engineering organisation would want
              that anyway.
            </P>
          </Passage>

          <RegulatoryClock />

          <Passage>
            <P>
              But here is the property that makes this different from every
              other compliance deadline a company has absorbed:{" "}
              <B tone="fail">you cannot do it late.</B>
            </P>
            <P>
              A financial control can be implemented in Q3 and applied to Q3. A
              log cannot. If the record of what your model did in March was not
              written in March, it does not exist, and no amount of budget in
              October creates it. The best you can do is write down what you
              believe happened — which is a memo, not a record, and every
              auditor alive can tell the difference.
            </P>
          </Passage>

          <Box label="The asymmetry that matters">
            Most compliance work can be deferred and then caught up on. Evidence
            cannot. The window to record what happened in March closed in March.
            Every month a company waits is a month permanently missing from its
            own audit trail — and the months already gone are gone.
          </Box>

          <Passage>
            <P>
              Which reframes the whole question. It is not &ldquo;when do we
              need to be compliant?&rdquo; It is &ldquo;how much of our history
              are we willing to lose before we start?&rdquo;
            </P>
          </Passage>
        </Chapter>

        {/* ── 06 ───────────────────────────────────────────────────────── */}
        <Chapter no="06" id="deal" title="The deal that stalls in security review">
          <Lede>
            Long before a regulator ever calls, this costs revenue — in a
            meeting most engineering teams never hear about.
          </Lede>

          <Passage>
            <P>
              A company sells an AI-powered product to an enterprise. The
              commercial conversation goes well. Then it reaches procurement,
              and procurement sends the security questionnaire, and somewhere
              around question one hundred and forty it asks how AI model changes
              are governed, recorded and audited.
            </P>
            <P>
              The honest answer is the one from chapter one: a Confluence page,
              a thumbs-up in Slack, and a folder. So the answer that gets sent
              is a carefully worded paragraph, and the buyer&rsquo;s security
              team — who read carefully worded paragraphs all day — asks a
              follow-up.
            </P>
            <P>
              And now the deal is not in sales. It is in a queue, waiting on a
              document nobody has written, blocked behind an engineering team
              who have to stop building in order to reconstruct six months of
              history for a customer they have not closed yet.
            </P>
          </Passage>

          <Pull tone="warn">
            The bottleneck is not the product. It is the paperwork about the
            product.
          </Pull>

          <Passage>
            <P>
              This is the version of the problem with a number attached to it
              that a CFO already understands, because it shows up as pipeline
              that slipped a quarter. And it gets worse as you move upmarket:
              the bigger the buyer, the longer the questionnaire, and the less
              patience they have for a vendor who cannot evidence their own
              controls.
            </P>
          </Passage>
        </Chapter>

        {/* ── 07 ───────────────────────────────────────────────────────── */}
        <Chapter no="07" id="reconstruction" title="What everyone does instead">
          <Lede>
            Nobody ignores this. Every serious company has already built
            something. It is the same something, and it has the same flaw.
          </Lede>

          <Passage>
            <P>
              They write a policy. They make a template. They add a mandatory
              field to the ticket. They appoint somebody to own it. They put a
              recurring calendar item on a Friday to catch up on the week&rsquo;s
              change records. All of it is reasonable, and all of it is a
              variation on the same move: <B>ask people to write down what they
              did, after they did it.</B>
            </P>
            <P>
              That move has a name in the audit profession, and the name is not
              flattering. It is reconstruction. And reconstruction has one
              structural problem that no amount of diligence fixes.
            </P>
          </Passage>

          <Pull>
            A record written afterwards, by the person it reflects on, is a
            claim. It only becomes evidence when it can be checked by somebody
            who was not there.
          </Pull>

          <Passage>
            <P>
              This is not an accusation of dishonesty. The overwhelming majority
              of these records are written by conscientious people trying to get
              it right. But &ldquo;we believe this is what happened&rdquo; and
              &ldquo;here is proof of what happened&rdquo; are different
              artifacts with different values, and only one of them survives
              contact with somebody whose job is to be sceptical.
            </P>
            <P>
              The second problem is quieter and worse. Reconstruction depends on
              a human remembering to do it. Under deadline, at the end of a
              quarter, during an incident — exactly when the change is most
              consequential — is exactly when it gets skipped. So the record is
              least complete precisely where it matters most.
            </P>
          </Passage>
        </Chapter>

        {/* ── 08 ───────────────────────────────────────────────────────── */}
        <Chapter no="08" id="receipt" title="What we build instead">
          <Lede>
            CooL removes the human from the recording, not from the decision.
            The system that makes the change writes the record, at the moment it
            makes it, and seals it so it cannot be edited afterwards.
          </Lede>

          <Passage>
            <P>
              Every AI change — a prompt edit, a model swap, a parameter change,
              a tool grant, a policy update — produces a{" "}
              <B tone="verify">receipt</B>. Not a log line. A self-contained
              cryptographic document that commits to exactly what happened, and
              that anybody can check, offline, years later, without asking us
              for anything.
            </P>
          </Passage>

          <ReceiptAnatomy />

          <Passage>
            <P>
              Two design choices in there are worth pulling out, because they
              are what makes this usable rather than merely correct.
            </P>
            <P>
              <B>The prompt and the output are never stored.</B> They are
              committed as salted hashes. So a receipt can be handed to a
              regulator, an auditor, or a customer&rsquo;s security team without
              disclosing the content of a single customer interaction — and the
              holder can still open any individual field later by revealing its
              salt. You prove what happened without publishing what was said.
            </P>
            <P>
              <B>Verification needs nothing from us.</B> No network call, no API
              key, no account, no CooL. The verifier is Apache-2.0 and runs on
              the auditor&rsquo;s own machine against the file in front of them.
              That is the property that makes a receipt worth keeping for seven
              years: it survives us.
            </P>
          </Passage>

          <Box label="You can check this claim right now">
            The{" "}
            <Link href="/demo" className="text-verify hover:underline">
              live demo
            </Link>{" "}
            runs the real signing and verification in your browser — not a
            recording of it. Mint a receipt, tamper with it, and watch the same
            verifier reject it and name the domain that failed. Then download it
            and run the published command-line verifier against it yourself.
          </Box>
        </Chapter>

        {/* ── 09 ───────────────────────────────────────────────────────── */}
        <Chapter no="09" id="honesty" title="What a receipt does not prove">
          <Lede>
            This chapter exists because a provenance tool that overstates itself
            is worse than no tool at all — it launders an unverified claim into
            an apparently verified one.
          </Lede>

          <Passage>
            <P>
              A CooL receipt proves that a record matches its commitment, that
              both signatures verify, and that the entry sits in an append-only
              log. In one sentence: <B tone="live">the operator could not have
              forged this record or silently edited it afterwards.</B>
            </P>
            <P>Here is what it does not prove, and will not pretend to.</P>
          </Passage>

          <List
            tone="warn"
            lead="dash"
            items={[
              [
                "That the output was right",
                "correctness, fairness and safety are outside the format. A receipt for a wrong answer is a valid receipt for a wrong answer",
              ],
              [
                "That hardware attested the run",
                "reported MOCK. There is no TEE quote in this build, and no setting turns that green",
              ],
              [
                "That anything was publicly anchored",
                "reported ABSENT. Nothing is written to a public chain",
              ],
              [
                "That an independent party witnessed it",
                "a CooL self-signature is carried and displayed, and never counted as a witness",
              ],
              [
                "Anything about who holds a key",
                "key ids are operator-chosen labels. There is no PKI here",
              ],
            ]}
          />

          <Passage>
            <P>
              Those first two are the ones a competitor would quietly leave
              ambiguous. We report them as unmet <em>in the verifier itself</em>
              , so they show up that way in the demo on this site, in the
              command-line tool, and on every receipt anyone ever exports.
            </P>
            <P>
              The reason is not modesty. It is that the entire value of this
              category rests on a buyer being able to trust the one vendor whose
              product is trust. An auditor who catches you overstating one
              domain will — correctly — stop believing the other five.
            </P>
          </Passage>

          <Pull tone="live">
            The claims are narrow on purpose. Narrow claims are the only kind
            that survive being checked.
          </Pull>
        </Chapter>

        {/* ── 10 ───────────────────────────────────────────────────────── */}
        <Chapter no="10" id="now" title="Why this has to happen this year">
          <Lede>
            Three curves are crossing at once, and only one of them is under any
            company&rsquo;s control.
          </Lede>

          <Passage>
            <P>
              <B>AI changes are accelerating.</B> Every company that got a model
              into production last year is now iterating on it weekly. The
              volume of governable events per company is going up steeply, and
              nobody is planning to slow down.
            </P>
            <P>
              <B>The obligations are landing.</B> High-risk obligations under
              the EU AI Act are live, DPDP is running in parallel, and sector
              regulators are following. These are dates, not intentions.
            </P>
            <P>
              <B>And evidence cannot be created retroactively.</B> This is the
              one that turns a planning problem into an urgency problem. The
              other two would be manageable if a company could simply decide, in
              eighteen months, to become compliant. They cannot. The record had
              to exist when the change happened.
            </P>
          </Passage>

          <Ledger />

          <Passage>
            <P>
              So the decision in front of a company is not whether to solve
              this. The volume curve and the regulatory curve have already made
              that decision. The only open question is how many months of their
              own history they lose first — because those months do not come
              back, and the audit that asks about them is already on somebody&rsquo;s
              calendar.
            </P>
          </Passage>

          <Pull tone="verify">
            Every week without a record is a week that can never be evidenced.
          </Pull>

          <Passage>
            <P>
              CooL is the layer that makes the record automatic: captured by the
              system that made the change, sealed at the moment it happened,
              written back into the tools the company already runs, and
              verifiable by anyone without asking us. The thirty seconds stay
              thirty seconds. The afternoon disappears.
            </P>
          </Passage>

          {/* ── close ── */}
          <Reveal>
            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="rounded-full border border-verify/45 bg-verify/[0.12] px-5 py-2.5 text-[14px] text-ink transition-colors hover:bg-verify/[0.2]"
              >
                Watch the cryptography run →
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-line px-5 py-2.5 text-[14px] text-fog transition-colors hover:border-line-strong hover:text-ink"
              >
                Open the console
              </Link>
              <Link
                href="/investors"
                className="rounded-full border border-line px-5 py-2.5 text-[14px] text-fog transition-colors hover:border-line-strong hover:text-ink"
              >
                Technical diligence
              </Link>
            </div>
            <p className="mt-6 max-w-[58ch] text-[13px] leading-[1.7] text-mist">
              Figures on this page marked as estimates are ours, for a mid-size
              AI team, and are not drawn from a customer deployment. Everything
              said about what a receipt proves is enforced in the verifier and
              can be checked against the published, Apache-2.0 implementation.
            </p>
          </Reveal>
        </Chapter>
      </div>
    </article>
  );
}
