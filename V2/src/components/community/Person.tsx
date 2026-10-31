/** A member's photo (from Google or GitHub) or their initial, with name and a second line. */
export function Person({ name, avatarUrl, sub }: { name: string; avatarUrl?: string | null; sub?: React.ReactNode }) {
  return (
    <div className="cm-person">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" width={44} height={44} referrerPolicy="no-referrer" loading="lazy" />
      ) : (
        <span className="cm-initial" aria-hidden>{(name || "?").slice(0, 1).toUpperCase()}</span>
      )}
      <div>
        <strong>{name || "Unnamed member"}</strong>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}
