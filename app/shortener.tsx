"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type ShortenResult = {
  slug: string;
  shortUrl: string;
  target: string;
};

function detectUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.\-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const PRESET_FG = ["#1c1a16", "#c8391c", "#1d4e89", "#2f6b3a"];
const PRESET_BG = ["#f3ede1", "#ffffff", "#0e0d0a", "#fff7ea"];

export function Shortener() {
  const [input, setInput] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [shortenOn, setShortenOn] = useState(true);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fg, setFg] = useState(PRESET_FG[0]);
  const [bg, setBg] = useState(PRESET_BG[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectedUrl = useMemo(() => detectUrl(input), [input]);
  const mode: "empty" | "text" | "url" = !input.trim()
    ? "empty"
    : detectedUrl
      ? "url"
      : "text";

  const encoded = result ? result.shortUrl : input;
  const willShorten = mode === "url" && shortenOn && !result;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (result) setResult(null);
    if (error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  async function mint() {
    if (!detectedUrl) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target: detectedUrl,
          slug: customSlug || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong");
      else setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setInput("");
    setCustomSlug("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <section className="grid grid-cols-1 gap-12 pt-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <h1 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95]">
          make a <span className="serif-italic">qr</span>.
          <br />
          shorten a <span className="serif-italic">link</span>
          <span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p
          className="mt-5 max-w-md text-sm leading-relaxed"
          style={{ color: "var(--ink-soft)" }}
        >
          Paste anything below. We&rsquo;ll turn it into a QR code on the
          right. If it looks like a URL, you can also mint a tiny
          <span className="serif-italic"> u.ax4.cz/&hellip;</span> redirect.
        </p>

        <div className="mt-10 space-y-3">
          <div className="flex items-baseline gap-3">
            <span
              className="text-[0.7rem] uppercase tracking-[0.22em]"
              style={{ color: "var(--ink-faint)" }}
            >
              {mode === "empty"
                ? "01 ·  input"
                : mode === "url"
                  ? "01 ·  url detected"
                  : "01 ·  text"}
            </span>
            {mode === "url" ? (
              <span
                className="text-[0.7rem] uppercase tracking-[0.22em]"
                style={{ color: "var(--accent)" }}
              >
                ↳ shortenable
              </span>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder="https://something.long/and/winding  —  or any text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="field-line text-base sm:text-lg"
          />
        </div>

        {mode === "url" && !result ? (
          <div className="mt-10 rise">
            <div className="flex items-center justify-between">
              <span
                className="text-[0.7rem] uppercase tracking-[0.22em]"
                style={{ color: "var(--ink-faint)" }}
              >
                02 ·  shorten
              </span>
              <button
                type="button"
                aria-label="Toggle shorten"
                className="toggle"
                data-on={shortenOn}
                onClick={() => setShortenOn((v) => !v)}
              />
            </div>

            {shortenOn ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block">
                  <span
                    className="block text-[0.65rem] uppercase tracking-[0.2em]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    custom slug · optional · min 4
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className="font-display text-lg"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      u.ax4.cz/
                    </span>
                    <input
                      type="text"
                      pattern="[A-Za-z0-9]*"
                      placeholder="leave blank for random"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      className="field-line text-base"
                    />
                  </div>
                </label>
                <button
                  type="button"
                  className="btn"
                  onClick={mint}
                  disabled={submitting}
                >
                  {submitting ? "minting…" : "mint ⏎"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {result ? (
          <div className="mt-10 rise">
            <span
              className="text-[0.7rem] uppercase tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              ✓ minted
            </span>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="font-display link-underline text-[clamp(1.6rem,3.4vw,2.4rem)] leading-none"
              >
                {result.shortUrl.replace(/^https?:\/\//, "")}
              </a>
              <CopyButton text={result.shortUrl} />
              <button
                type="button"
                className="text-xs underline-offset-4 hover:underline"
                style={{ color: "var(--ink-soft)" }}
                onClick={reset}
              >
                + new one
              </button>
            </div>
            <p
              className="mt-2 break-all text-xs"
              style={{ color: "var(--ink-faint)" }}
            >
              ↳ {result.target}
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            className="mt-6 text-sm rise"
            style={{ color: "var(--accent)" }}
          >
            {error}
          </p>
        ) : null}

        <div className="mt-12">
          <span
            className="text-[0.7rem] uppercase tracking-[0.22em]"
            style={{ color: "var(--ink-faint)" }}
          >
            03 ·  qr style
          </span>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <SwatchRow
              label="ink"
              value={fg}
              presets={PRESET_FG}
              onChange={setFg}
            />
            <SwatchRow
              label="paper"
              value={bg}
              presets={PRESET_BG}
              onChange={setBg}
            />
          </div>
        </div>
      </div>

      <aside className="lg:col-span-5 lg:pt-2">
        <div className="lg:sticky lg:top-10">
          <QrStamp
            text={encoded}
            fg={fg}
            bg={bg}
            caption={
              mode === "empty"
                ? "—"
                : willShorten
                  ? "preview · mint to fix the QR to a short link"
                  : result
                    ? "encodes the short link"
                    : mode === "url"
                      ? "encodes the URL directly"
                      : "encodes the text above"
            }
          />
        </div>
      </aside>
    </section>
  );
}

function SwatchRow({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[0.65rem] uppercase tracking-[0.22em]"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            className="swatch"
            aria-label={`Set ${label} to ${c}`}
            style={{
              background: c,
              outline: value === c ? "2px solid var(--accent)" : "none",
              outlineOffset: 2,
            }}
            onClick={() => onChange(c)}
          />
        ))}
        <label
          className="swatch grid place-items-center text-[0.6rem]"
          style={{ background: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

function QrStamp({
  text,
  fg,
  bg,
  caption,
}: {
  text: string;
  fg: string;
  bg: string;
  caption: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const empty = !text.trim();

  useEffect(() => {
    if (!canvasRef.current) return;
    if (empty) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        canvasRef.current.width = 320;
        canvasRef.current.height = 320;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 320, 320);
      }
      setDownloadUrl("");
      return;
    }
    QRCode.toCanvas(canvasRef.current, text, {
      width: 320,
      margin: 1,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: "M",
    }).catch(() => {});
    QRCode.toDataURL(text, {
      width: 1024,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: "M",
    })
      .then(setDownloadUrl)
      .catch(() => {});
  }, [text, fg, bg, empty]);

  return (
    <div>
      <div className="qr-frame mx-auto w-fit">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ background: bg }}
          aria-label="QR code"
        />
        {empty ? (
          <div
            className="pointer-events-none absolute inset-0 grid place-items-center text-center"
            style={{ color: "var(--ink-faint)" }}
          >
            <span className="serif-italic text-2xl">awaiting input</span>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 px-1">
        <span
          className="text-[0.7rem] uppercase tracking-[0.22em]"
          style={{ color: "var(--ink-soft)" }}
        >
          {caption}
        </span>
        {downloadUrl ? (
          <a
            href={downloadUrl}
            download="qr.png"
            className="text-[0.7rem] uppercase tracking-[0.22em] link-underline"
          >
            png ↓
          </a>
        ) : null}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="text-[0.65rem] uppercase tracking-[0.22em]"
      style={{ color: copied ? "var(--accent)" : "var(--ink-soft)" }}
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}
