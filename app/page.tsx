import { Shortener } from "./shortener";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-12 sm:py-14">
        <header className="flex items-center justify-between">
          <a href="/" className="font-display text-2xl leading-none">
            u<span style={{ color: "var(--accent)" }}>.</span>ax4
            <span style={{ color: "var(--accent)" }}>.</span>cz
          </a>
          <span className="tag">N° 001 · short &amp; sharp</span>
        </header>

        <div className="rule mt-6" />

        <Shortener />

        <footer className="mt-auto pt-12">
          <div className="rule mb-4" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span style={{ color: "var(--ink-soft)" }}>
              made on a quiet afternoon · cmd + k to focus
            </span>
            <span style={{ color: "var(--ink-faint)" }}>
              [A–Z a–z 0–9] · case sensitive
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
