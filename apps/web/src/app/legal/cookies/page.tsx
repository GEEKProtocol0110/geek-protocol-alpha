export const metadata = { title: "Cookies — Geek Protocol" };

export default function CookiesPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-[var(--text-1)]">Cookie Notice</h1>
      <p>
        GEEK Protocol uses a small number of cookies. We do not use advertising cookies and we do not
        sell data to advertisers.
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-[var(--ink)] px-2 py-2 text-left font-bold text-[var(--text-1)]">Cookie</th>
            <th className="border-b border-[var(--ink)] px-2 py-2 text-left font-bold text-[var(--text-1)]">Purpose</th>
            <th className="border-b border-[var(--ink)] px-2 py-2 text-left font-bold text-[var(--text-1)]">Type</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Session token", "Keeps you signed in. Signed, HTTP-only.", "Strictly necessary"],
            ["Auth nonce", "Short-lived challenge used to verify a wallet signature.", "Strictly necessary"],
            ["Preferences", "Remembers UI choices such as sound and reduced motion.", "Functional"],
          ].map(([name, purpose, type]) => (
            <tr key={name}>
              <td className="border-b border-[var(--border-soft)] px-2 py-2 font-semibold text-[var(--text-1)]">{name}</td>
              <td className="border-b border-[var(--border-soft)] px-2 py-2">{purpose}</td>
              <td className="border-b border-[var(--border-soft)] px-2 py-2">{type}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="pt-2">
        Strictly necessary cookies cannot be turned off without breaking sign-in. You can clear all
        cookies in your browser at any time; doing so signs you out.
      </p>
    </>
  );
}
