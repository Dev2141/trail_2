"use client";

import { useMemo, useState } from "react";
import type { KeywordCluster, SerpInsight, OutlineSection, SeoScorecard } from "@/lib/pipeline";

type FormState = {
  keyword: string;
  audience: string;
  intent: string;
  tone: string;
  brandVoice: string;
  targetLength: number;
  platforms: string[];
};

type Step = 1 | 2 | 3;

type ResearchData = {
  clusters: KeywordCluster[];
  serpInsights: SerpInsight[];
  outline: OutlineSection[];
};

type GeneratedData = {
  generated: string;
  seo: SeoScorecard;
  usedFallback: boolean;
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
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [editableOutline, setEditableOutline] = useState<OutlineSection[]>([]);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
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

  const generateResearch = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const message = (await res.json())?.error ?? "Unable to generate research.";
        throw new Error(message);
      }
      const json = (await res.json()) as ResearchData;
      setResearchData(json);
      setEditableOutline(json.outline);
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateFinalDraft = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, outline: editableOutline }),
      });
      if (!res.ok) {
        const message = (await res.json())?.error ?? "Unable to generate draft.";
        throw new Error(message);
      }
      const json = (await res.json()) as GeneratedData;
      setGeneratedData(json);
      setStep(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateOutlineHeading = (index: number, newHeading: string) => {
    setEditableOutline((prev) =>
      prev.map((section, i) => (i === index ? { ...section, heading: newHeading } : section)),
    );
  };

  const updateOutlineBullet = (sectionIndex: number, bulletIndex: number, newBullet: string) => {
    setEditableOutline((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              bullets: section.bullets.map((b, j) => (j === bulletIndex ? newBullet : b)),
            }
          : section,
      ),
    );
  };

  const addOutlineBullet = (sectionIndex: number) => {
    setEditableOutline((prev) =>
      prev.map((section, i) =>
        i === sectionIndex ? { ...section, bullets: [...section.bullets, "New bullet point"] } : section,
      ),
    );
  };

  const removeOutlineBullet = (sectionIndex: number, bulletIndex: number) => {
    setEditableOutline((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? { ...section, bullets: section.bullets.filter((_, j) => j !== bulletIndex) }
          : section,
      ),
    );
  };

  const headline = useMemo(
    () =>
      form.keyword.length > 0
        ? `Launch-ready AI blog engine for "${form.keyword}"`
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
            Blogy AI – Research ➜ Review ➜ Generate
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                {headline}
              </h1>
              <p className="text-lg text-slate-200/80 md:text-xl">
                Progressive 3-step workflow: generate research, review and edit outline, then create
                SEO-optimized content with human-in-the-loop control.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatPill
                label="Step"
                value={`${step}/3`}
                active={true}
              />
              <StatPill label="SEO target" value="80%+" active={step === 3} />
              <StatPill label="AI detect" value="<30%" active={step === 3} />
            </div>
          </div>
        </header>

        {/* Step 1: Input Form */}
        {step === 1 && (
          <section className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Step 1: Input</p>
                <h2 className="text-2xl font-semibold text-white">Define your content strategy</h2>
              </div>
              <button
                className="rounded-full bg-cyan-400/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:translate-y-[-1px] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={generateResearch}
                disabled={loading}
              >
                {loading ? "Generating research..." : "Generate SEO research"}
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Field
                label="Target keyword"
                hint="Primary query that anchors research"
                value={form.keyword}
                onChange={(keyword) => setForm((prev) => ({ ...prev, keyword }))}
              />
              <Field
                label="Audience"
                hint="Who should resonate with this content"
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
                <p className="text-sm font-semibold text-white">Publishing platforms</p>
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
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}
          </section>
        )}

        {/* Step 2: Review & Edit Outline */}
        {step === 2 && researchData && (
          <>
            <section className="grid gap-6 md:grid-cols-2">
              <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
                <SectionHeader title="Keyword clusters" subtitle="Primary, pain-point, and proof" />
                <div className="mt-4 space-y-3">
                  {researchData.clusters.map((cluster) => (
                    <div key={cluster.name} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">{cluster.name}</p>
                      <p className="text-xs text-cyan-100">Primary: {cluster.primary}</p>
                      <div className="mt-2 space-y-1 text-xs text-slate-200/80">
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
              </div>

              <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
                <SectionHeader title="SERP gaps" subtitle="Opportunities to differentiate" />
                <div className="mt-4 space-y-3">
                  {researchData.serpInsights.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-slate-300">{item.url}</p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                          {item.wordCount}w
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-amber-100">Gaps: {item.gaps.join(" • ")}</p>
                      <p className="text-xs text-cyan-100">Opportunity: {item.snippetOpportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Step 2: Review</p>
                  <h2 className="text-2xl font-semibold text-white">Edit outline before generating</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Modify headings and bullets to match your exact needs
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    onClick={() => setStep(1)}
                  >
                    ← Back to inputs
                  </button>
                  <button
                    className="rounded-full bg-cyan-400/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:translate-y-[-1px] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={generateFinalDraft}
                    disabled={loading}
                  >
                    {loading ? "Generating draft..." : "Generate final draft"}
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {editableOutline.map((section, sectionIdx) => (
                  <div
                    key={sectionIdx}
                    className="rounded-2xl border border-white/5 bg-white/5 p-4"
                  >
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => updateOutlineHeading(sectionIdx, e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/40"
                    />
                    <div className="mt-3 space-y-2">
                      {section.bullets.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="flex gap-2">
                          <span className="text-cyan-300">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) =>
                              updateOutlineBullet(sectionIdx, bulletIdx, e.target.value)
                            }
                            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-1 text-sm text-slate-100 outline-none focus:border-cyan-300/60 focus:ring-1 focus:ring-cyan-400/40"
                          />
                          <button
                            onClick={() => removeOutlineBullet(sectionIdx, bulletIdx)}
                            className="text-xs text-rose-300 hover:text-rose-100"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOutlineBullet(sectionIdx)}
                        className="text-xs text-cyan-300 hover:text-cyan-100"
                      >
                        + Add bullet
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}
            </section>
          </>
        )}

        {/* Step 3: Final Draft & SEO Score */}
        {step === 3 && generatedData && (
          <>
            <section className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
              <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
                <SectionHeader title="Generated draft" subtitle="SEO-optimized markdown" />
                <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/5 bg-black/40 p-4 text-sm leading-relaxed text-slate-100">
                  {generatedData.generated}
                </div>
                {generatedData.usedFallback && (
                  <p className="mt-3 text-xs text-amber-200">
                    Using sample copy. Add OpenRouter API key for live generation.
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    ← Edit outline
                  </button>
                  <button
                    onClick={() => {
                      setStep(1);
                      setResearchData(null);
                      setGeneratedData(null);
                    }}
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Start new
                  </button>
                </div>
              </div>

              <div className={`${gradientBorder} rounded-3xl p-6 md:p-8`}>
                <SectionHeader title="SEO validation" subtitle="Real-time analysis" />
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
                      generatedData.seo.score >= 80
                        ? "bg-emerald-500/20 text-emerald-100"
                        : generatedData.seo.score >= 60
                        ? "bg-amber-500/20 text-amber-100"
                        : "bg-rose-500/20 text-rose-100"
                    }`}
                  >
                    {generatedData.seo.score}
                  </div>
                  <div className="text-sm text-slate-200/90">
                    <p className="font-semibold text-white">SEO Score</p>
                    <p>{generatedData.seo.readability}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-200/90">
                  {generatedData.seo.keywordPlacement.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm">
                  <p className="font-semibold text-white">Snippet readiness</p>
                  <p className="text-slate-200/90">{generatedData.seo.snippetReadiness}</p>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-200/80">
                  <p className="font-semibold text-white">Meta</p>
                  <p>Title: {generatedData.seo.meta.title}</p>
                  <p>Desc: {generatedData.seo.meta.description}</p>
                  <p>Slug: /{generatedData.seo.meta.slug}</p>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-200/80">
                  <p className="font-semibold text-white">FAQ ideas</p>
                  {generatedData.seo.faqs.slice(0, 3).map((faq, idx) => (
                    <div key={idx} className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                      {faq}
                    </div>
                  ))}
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

function StatPill({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div
      className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-xs text-slate-200/90 ${
        active ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-white/5"
      }`}
    >
      <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-200">{label}</span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}
