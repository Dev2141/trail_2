"use client";

import { useMemo, useState } from "react";
import type { PipelineResponse } from "@/lib/pipeline";

type FormState = {
  keyword: string;
  audience: string;
  intent: string;
  tone: string;
  brandVoice: string;
  targetLength: number;
  platforms: string[];
};

const defaultForm: FormState = {
  keyword: "AI blog automation tool India",
  audience: "Founders, growth and content leaders in India",
  intent: "commercial",
  tone: "confident",
  brandVoice: "",
  targetLength: 2000,
  platforms: ["LinkedIn", "Medium", "WordPress"],
};

const platformOptions = ["LinkedIn", "Medium", "WordPress", "Dev.to", "Hashnode"];

const gradientBorder =
  "border border-white/10 bg-white/5 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.8)] backdrop-blur-xl";

export default function Home() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (platform: string) => {
    setForm((prev) => {
      const exists = prev.platforms.includes(platform);
      return {
        ...prev,
        platforms: exists
          ? prev.platforms.filter((p) => p !== platform)
          : [...prev.platforms, platform],
      };
    });
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    setData(null);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const message = (await res.json())?.error ?? "Unable to generate plan.";
        throw new Error(message);
      }
      const json = (await res.json()) as PipelineResponse;
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const headline = useMemo(
    () =>
      form.keyword.length > 0
        ? `Launch-ready AI blog engine for “${form.keyword}”`
        : "Launch-ready AI blog engine",
    [form.keyword],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="absolute inset-0 opacity-40 blur-3xl" aria-hidden>
        <div className="pointer-events-none absolute left-8 top-10 h-72 w-72 rounded-full bg-cyan-500/30" />
        <div className="pointer-events-none absolute right-16 top-24 h-96 w-96 rounded-full bg-indigo-500/25" />
        <div className="pointer-events-none absolute left-1/3 bottom-0 h-80 w-80 rounded-full bg-emerald-500/25" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
        <header className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
            Blogy AI – research ➜ generate ➜ optimize ➜ publish
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                {headline}
              </h1>
              <p className="text-lg text-slate-200/80 md:text-xl">
                Run keyword clustering, SERP gap analysis, multi-stage prompting, and SEO
                validation in one flow. Humanized copy, snippet-ready blocks, and platform-aware
                exports are baked in.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatPill label="SEO score target" value="80%+" />
              <StatPill label="AI detect" value="<30%" />
              <StatPill label="Time to outline" value="~5s" />
            </div>
          </div>
        </header>

        <section className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Input canvas</p>
              <h2 className="text-2xl font-semibold text-white">Shape the run</h2>
            </div>
            <button
              className="rounded-full bg-cyan-400/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:translate-y-[-1px] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate pipeline"}
            </button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Field
              label="Target keyword"
              hint="Primary query that anchors research and generation"
              value={form.keyword}
              onChange={(keyword) => setForm((prev) => ({ ...prev, keyword }))}
            />
            <Field
              label="Audience"
              hint="Who should resonate with this draft"
              value={form.audience}
              onChange={(audience) => setForm((prev) => ({ ...prev, audience }))}
            />
            <Field
              label="Intent"
              hint="Informational, commercial, transactional..."
              value={form.intent}
              onChange={(intent) => setForm((prev) => ({ ...prev, intent }))}
            />
            <Field
              label="Brand voice"
              hint="Optional: tone rules, phrases, do/don'ts"
              value={form.brandVoice}
              onChange={(brandVoice) => setForm((prev) => ({ ...prev, brandVoice }))}
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="grid gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 md:grid-cols-2">
              <SelectField
                label="Tone"
                value={form.tone}
                options={["confident", "conversational", "analytical", "playful"]}
                onChange={(tone) => setForm((prev) => ({ ...prev, tone }))}
              />
              <SliderField
                label="Target length"
                value={form.targetLength}
                min={1200}
                max={3000}
                step={100}
                onChange={(targetLength) => setForm((prev) => ({ ...prev, targetLength }))}
              />
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Publishing presets</p>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map((platform) => {
                  const active = form.platforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        active
                          ? "border-cyan-300/80 bg-cyan-300/20 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30"
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-300/70">
                Each platform preset tweaks formatting, CTA placement, and schema hints.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
            <SectionHeader title="Pipeline status" subtitle="Research → Generate → Optimize → Publish" />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {["Research", "Generate", "Optimize", "Publish"].map((step, index) => {
                const active = loading || data;
                return (
                  <div
                    key={step}
                    className={`rounded-2xl border px-4 py-4 ${
                      active ? "border-cyan-300/50 bg-cyan-300/5" : "border-white/5 bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{step}</p>
                    <p className="text-xs text-slate-300/80">
                      {data?.timeline?.[index]?.detail ??
                        "Ready to orchestrate research, generation, and publishing."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
            <SectionHeader title="Scorecard goals" subtitle="Guardrails applied automatically" />
            <ul className="mt-4 space-y-3 text-sm text-slate-200/90">
              <li>• Keyword placement in H1, intro, and at least two H2s</li>
              <li>• Definition paragraph, ordered list, and comparison table for snippet readiness</li>
              <li>• Readability at Grade 8-9 with short paragraphs</li>
              <li>• CTA variants per platform + schema hints for WordPress</li>
            </ul>
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Bring your OpenRouter API key to unlock live generation. Without it, we’ll use the
              built-in sample copy.
            </div>
          </div>
        </section>

        {data && (
          <>
            <section className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
              <SectionHeader title="Keyword clustering" subtitle="Primary, pain-point, and proof clusters" />
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {data.clusters.map((cluster) => (
                  <div key={cluster.name} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{cluster.name}</p>
                    <p className="text-xs text-cyan-100">Primary: {cluster.primary}</p>
                    <div className="mt-3 space-y-2 text-xs text-slate-200/80">
                      {cluster.keywords.map((kw) => (
                        <div
                          key={kw.term}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-2 py-1"
                        >
                          <span>{kw.term}</span>
                          <span className="text-[10px] text-slate-300">
                            vol {kw.volume} • diff {(kw.difficulty * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
                <SectionHeader title="SERP gap map" subtitle="Top results, coverage gaps, snippet angles" />
                <div className="mt-4 space-y-3">
                  {data.serpInsights.map((item) => (
                    <div
                      key={item.url}
                      className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-100"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-xs text-slate-300">{item.url}</p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                          {item.wordCount} words
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-amber-100">
                        Gaps: {item.gaps.join(" • ")}
                      </p>
                      <p className="text-xs text-cyan-100">
                        Snippet shot: {item.snippetOpportunity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
                <SectionHeader title="Outline" subtitle="H1/H2/H3 and proof blocks" />
                <div className="mt-4 space-y-3">
                  {data.outline.map((section) => (
                    <div
                      key={section.heading}
                      className="rounded-2xl border border-white/5 bg-white/5 p-3"
                    >
                      <p className="text-sm font-semibold text-white">{section.heading}</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-200/80">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>• {bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
              <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
                <SectionHeader title="Generated draft" subtitle="Humanized, SEO-ready markdown" />
                <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/5 bg-black/40 p-4 text-sm leading-relaxed text-slate-100">
                  {data.generated}
                </div>
                {data.usedFallback && (
                  <p className="mt-3 text-xs text-amber-200">
                    Using sample copy. Add your OpenRouter API key for live generation.
                  </p>
                )}
              </div>
              <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
                <SectionHeader title="SEO validation" subtitle="Scorecard and publishing prep" />
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-2xl font-bold text-emerald-100">
                    {data.seo.score}
                  </div>
                  <div className="text-sm text-slate-200/90">
                    <p className="font-semibold text-white">Score target</p>
                    <p>{data.seo.readability}</p>
                    <p className="text-cyan-100">{data.seo.snippetReadiness}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-200/90">
                  {data.seo.keywordPlacement.map((item) => (
                    <div key={item} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1 text-xs text-slate-200/80">
                  <p className="font-semibold text-white">Meta</p>
                  <p>Title: {data.seo.meta.title}</p>
                  <p>Description: {data.seo.meta.description}</p>
                  <p>Slug: /{data.seo.meta.slug}</p>
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-200/80">
                  <p className="font-semibold text-white">FAQ schema ideas</p>
                  {data.seo.faqs.map((faq) => (
                    <div key={faq} className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                      {faq}
                    </div>
                  ))}
                  <p className="font-semibold text-white">CTA variants</p>
                  <p>{data.seo.ctas.join(" • ")}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">{label}</span>
        {hint && <span className="text-[11px] text-slate-300/80">{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[84px] rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/40"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-4">
      <span className="text-sm font-semibold text-white">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/40"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-900 text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center justify-between text-sm text-white">
        <span className="font-semibold">{label}</span>
        <span className="text-cyan-100">{value} words</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-cyan-400"
      />
    </label>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Pipeline</p>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-300/80">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200/90">
      <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-200">{label}</span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}
