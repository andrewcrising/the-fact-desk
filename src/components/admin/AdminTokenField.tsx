"use client";

interface AdminTokenFieldProps {
  token: string;
  onTokenChange: (token: string) => void;
}

export function AdminTokenField({ token, onTokenChange }: AdminTokenFieldProps) {
  return (
    <div className="desk-card p-4">
      <label className="desk-kicker mb-2 block" htmlFor="admin-token">
        Admin token
      </label>
      <input
        id="admin-token"
        type="password"
        value={token}
        onChange={(event) => onTokenChange(event.target.value)}
        placeholder="ADMIN_API_TOKEN"
        className="w-full border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
      />
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted-light)]">
        Use the value from ADMIN_API_TOKEN. It is stored only in this browser via
        localStorage and sent as Authorization: Bearer for admin API calls.
      </p>
    </div>
  );
}
