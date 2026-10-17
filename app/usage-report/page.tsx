"use client";

import { useState } from "react";

type Visitor = {
  id: string;
  name: string;
  opens: number;
  lastOpenedAt: string;
};

type UsageData = {
  totalOpens: number;
  uniqueVisitors: number;
  visitors: Visitor[];
};

export default function UsageReport() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<UsageData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/usage", {
        headers: { "x-usage-admin-key": password },
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      setData(await response.json());
    } catch {
      setData(null);
      setMessage("The password is incorrect or the report is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="usage-report-page">
      <section className="usage-report-card">
        <span className="eyebrow">PRIVATE · MARCELA</span>
        <h1>App usage</h1>
        <p>See how many devices have opened the Travelers Edition and how often.</p>
        <form onSubmit={load}>
          <label htmlFor="usage-password">REPORT PASSWORD</label>
          <div>
            <input
              id="usage-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button type="submit" disabled={loading}>
              {loading ? "LOADING…" : "VIEW REPORT"}
            </button>
          </div>
        </form>
        {message && <p className="usage-report-message">{message}</p>}
        {data && (
          <div className="usage-report-results">
            <div className="usage-report-totals">
              <article><strong>{data.totalOpens}</strong><span>APP OPENS</span></article>
              <article><strong>{data.uniqueVisitors}</strong><span>DEVICES</span></article>
            </div>
            <h2>Visitors</h2>
            {data.visitors.length ? (
              <ul>
                {data.visitors.map((visitor) => (
                  <li key={visitor.id}>
                    <div>
                      <strong>{visitor.name}</strong>
                      <small>Last opened {new Date(visitor.lastOpenedAt).toLocaleString()}</small>
                    </div>
                    <span>{visitor.opens} {visitor.opens === 1 ? "open" : "opens"}</span>
                  </li>
                ))}
              </ul>
            ) : <p>No visits have been recorded yet.</p>}
            <small className="usage-report-note">A traveler’s name appears after they use the Memories name field. Until then, the device is listed as Traveler.</small>
          </div>
        )}
      </section>
    </main>
  );
}
