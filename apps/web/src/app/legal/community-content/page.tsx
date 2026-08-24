export const metadata = { title: "Community Content Terms — Geek Protocol" };

export default function CommunityContentPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-[var(--text-1)]">Community Content Terms</h1>
      <p>These terms apply when you submit or review questions in the Community Content Engine.</p>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Your submissions</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>You must own the content you submit, or have the right to submit it. Do not paste copyrighted material.</li>
        <li>Questions must be factually accurate and supported by a source where one is requested.</li>
        <li>You grant GEEK Protocol a worldwide, non-exclusive, royalty-free licence to display, serve, adapt and store your submission as part of the game.</li>
        <li>You retain authorship. Your name is attributed on the creator leaderboard.</li>
        <li>We may edit, reject, or remove a submission at any time, including after approval.</li>
      </ul>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Creator rewards</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>Approval rewards and per-serve royalties are configurable Alpha values and may change.</li>
        <li>Royalties are subject to daily, weekly and per-question lifetime caps, and to the overall creator budget.</li>
        <li>You do not earn a royalty from playing your own question.</li>
        <li>A question removed for fraud or plagiarism stops earning, and unpaid pending rewards for it are reversed.</li>
        <li>There is no guaranteed lifetime earning for any question.</li>
      </ul>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Reviewing</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>Reviews are assigned randomly. You cannot choose what to review, and authorship is hidden from you.</li>
        <li>You may not review your own submissions, and there is a weekly cap on reviews of any one creator.</li>
        <li>Reviewer accuracy is measured. Persistent rubber-stamping suspends review eligibility.</li>
        <li>Review rewards are held pending until the question reaches a decision, and are reversed where collusion is found.</li>
      </ul>

      <h2 className="pt-4 text-xl font-bold text-[var(--text-1)]">Reporting</h2>
      <p>
        If you see a question that is wrong, plagiarised, or offensive, report it with the{" "}
        <a className="underline" href="/support/report">Report a problem</a> link.
      </p>
    </>
  );
}
