"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

function useDebounced<T>(value: T, delay = 180): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

type ShortenResult = {
  slug: string;
  shortUrl: string;
  target: string;
};

type Ecc = "L" | "M" | "Q" | "H";
type EccChoice = "auto" | Ecc;

function autoEcc(text: string): Ecc {
  const len = text.length;
  if (len <= 40) return "L";
  if (len <= 80) return "M";
  if (len <= 160) return "Q";
  return "H";
}

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

const PRESETS: Array<{ name: string; fg: string; bg: string }> = [
  { name: "ink", fg: "#1c1a16", bg: "#f3ede1" },
  { name: "vermilion", fg: "#c8391c", bg: "#f3ede1" },
  { name: "midnight", fg: "#f3ede1", bg: "#0e0d0a" },
  { name: "neon", fg: "#e8533a", bg: "#0e0d0a" },
  { name: "forest", fg: "#2f6b3a", bg: "#fff7ea" },
  { name: "deep", fg: "#1d4e89", bg: "#ffffff" },
];
const PRESET_FG = ["#1c1a16", "#c8391c", "#1d4e89", "#2f6b3a", "#7a3aa1"];
const PRESET_BG = ["#f3ede1", "#ffffff", "#0e0d0a", "#fff7ea", "#fde8d0"];

export function Shortener() {
  const [input, setInput] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [showSlug, setShowSlug] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fg, setFg] = useState(PRESETS[0].fg);
  const [bg, setBg] = useState(PRESETS[0].bg);
  const [eccChoice, setEccChoice] = useState<EccChoice>("auto");
  const [showCustomize, setShowCustomize] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectedUrl = useMemo(() => detectUrl(input), [input]);
  const isUrl = detectedUrl !== null;

  const encoded = result ? result.shortUrl : input;
  const debouncedEncoded = useDebounced(encoded, 180);
  const hasContent = debouncedEncoded.trim().length > 0;
  const resolvedEcc: Ecc =
    eccChoice === "auto" ? autoEcc(debouncedEncoded) : eccChoice;

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

  async function shorten() {
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
    setShowSlug(false);
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }

  async function downloadPng() {
    if (!hasContent) return;
    const url = await QRCode.toDataURL(debouncedEncoded, {
      width: 1024,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: resolvedEcc,
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <section className="grid grid-cols-1 gap-12 pt-12 lg:grid-cols-12 lg:gap-16">
      {/* LEFT — URL flow */}
      <div className="lg:col-span-7">
        <h1 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95]">
          make a <span className="serif-italic">qr</span>.
          <br />
          shorten a <span className="serif-italic">link</span>
          <span style={{ color: "var(--accent)" }}>.</span>
        </h1>

        <div className="mt-12">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder="paste a link or any text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="field-line text-base sm:text-lg"
          />
        </div>

        {isUrl && !result ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              shorten();
            }}
            className="mt-7 rise"
          >
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "shortening…" : "shorten this link →"}
              </button>
              <button
                type="button"
                className="text-sm underline-offset-4 hover:underline"
                style={{ color: "var(--ink-soft)" }}
                onClick={() => setShowSlug((v) => !v)}
              >
                {showSlug ? "− random slug" : "+ custom slug"}
              </button>
            </div>
            {showSlug ? (
              <div className="mt-4 max-w-md rise">
                <div className="flex items-baseline gap-2">
                  <span style={{ color: "var(--ink-soft)" }}>u.ax4.cz/</span>
                  <input
                    type="text"
                    pattern="[A-Za-z0-9]*"
                    placeholder="your-slug"
                    autoFocus
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    className="field-line text-base"
                  />
                </div>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--ink-faint)" }}
                >
                  letters & digits, min 4 chars · leave blank for random
                </p>
              </div>
            ) : null}
          </form>
        ) : null}

        {result ? (
          <div className="mt-8 rise">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
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
                start over
              </button>
            </div>
            <p
              className="mt-2 break-all text-xs"
              style={{ color: "var(--ink-faint)" }}
            >
              → {result.target}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="mt-6 text-sm rise" style={{ color: "var(--accent)" }}>
            {error}
          </p>
        ) : null}
      </div>

      {/* RIGHT — QR preview & its controls */}
      <aside className="lg:col-span-5 lg:pt-2">
        <div className="lg:sticky lg:top-10">
          <QrStamp text={debouncedEncoded} fg={fg} bg={bg} ecc={resolvedEcc} />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="disclosure"
              onClick={() => setShowCustomize((v) => !v)}
              aria-expanded={showCustomize}
            >
              {showCustomize ? "− customize" : "+ customize"}
            </button>
            <button
              type="button"
              onClick={downloadPng}
              disabled={!hasContent}
              className="text-[0.7rem] uppercase tracking-[0.22em] link-underline disabled:opacity-40 disabled:no-underline"
              style={{ color: "var(--ink)" }}
            >
              download png ↓
            </button>
          </div>

          {showCustomize ? (
            <div className="mt-6 space-y-6 rise">
              <div className="space-y-2">
                <Label>presets</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => {
                    const active = p.fg === fg && p.bg === bg;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setFg(p.fg);
                          setBg(p.bg);
                        }}
                        className="chip"
                        data-active={active}
                      >
                        <span
                          aria-hidden
                          className="mr-1 inline-block h-2.5 w-2.5"
                          style={{
                            background: p.fg,
                            outline: `2px solid ${p.bg}`,
                          }}
                        />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

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

              <div className="space-y-2">
                <Label>
                  density{" "}
                  <span style={{ color: "var(--ink-faint)" }}>
                    · error correction
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="chip"
                    data-active={eccChoice === "auto"}
                    onClick={() => setEccChoice("auto")}
                    title="Pick a level based on data length"
                  >
                    auto{eccChoice === "auto" ? ` · ${resolvedEcc}` : ""}
                  </button>
                  {(["L", "M", "Q", "H"] as Ecc[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      className="chip"
                      data-active={eccChoice === level}
                      onClick={() => setEccChoice(level)}
                      title={
                        {
                          L: "Low — ~7% recoverable",
                          M: "Medium — ~15% recoverable",
                          Q: "Quartile — ~25% recoverable",
                          H: "High — ~30% recoverable",
                        }[level]
                      }
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[0.65rem] uppercase tracking-[0.22em]"
      style={{ color: "var(--ink-soft)" }}
    >
      {children}
    </span>
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
    <div className="flex flex-wrap items-center gap-3">
      <Label>{label}</Label>
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
          title="Custom color"
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
  ecc,
}: {
  text: string;
  fg: string;
  bg: string;
  ecc: Ecc;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      return;
    }
    QRCode.toCanvas(canvasRef.current, text, {
      width: 320,
      margin: 1,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: ecc,
    }).catch(() => {});
  }, [text, fg, bg, ecc, empty]);

  return (
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
          <span className="serif-italic text-2xl">your QR appears here</span>
        </div>
      ) : null}
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
