import OpenAI from "openai";

export type PipelineRequest = {
  keyword: string;
  audience: string;
  intent: string;
  tone: string;
  brandVoice: string;
  targetLength: number;
  platforms: string[];
};

export type KeywordCluster = {
  name: string;
  keywords: { term: string; volume: number; difficulty: number }[];
  primary: string;
};

export type SerpInsight = {
  title: string;
  url: string;
  wordCount: number;
  gaps: string[];
  snippetOpportunity: string;
};

export type OutlineSection = {
  heading: string;
  bullets: string[];
};

export type SeoScorecard = {
  score: number;
  keywordPlacement: string[];
  readability: string;
  snippetReadiness: string;
  internalLinks: string[];
  meta: { title: string; description: string; slug: string };
  faqs: string[];
  ctas: string[];
};

export type PipelineResponse = {
  clusters: KeywordCluster[];
  serpInsights: SerpInsight[];
  outline: OutlineSection[];
  generated: string;
  seo: SeoScorecard;
  timeline: { label: string; detail: string }[];
  usedFallback: boolean;
};

const openAiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const fallbackExample = `
Blogy is the AI-first content engine crafted for India-first teams that need SEO-grade long form pieces without the agency bloat. It pairs keyword intelligence, SERP gap detection, and a multi-stage prompt system to deliver publish-ready blogs with schema, CTAs, and internal link ideas baked in.

Key reasons teams love it:
- Research-grade keyword clusters that prioritize intent, not just volume.
- Competitive gap summaries that spotlight what no one else covers.
- Humanized drafts tuned to your brand voice and tone.
- SEO guardrails (readability, snippet formatting, FAQ schema) auto-applied.
- Platform-ready exports for WordPress, Medium, LinkedIn, and dev communities.

In short: pick a keyword, pick a voice, and ship a blog that ranks — faster than a sprint planning meeting.
`.trim();

const marketingVoices = [
  "confident strategist",
  "energetic storyteller",
  "product-led educator",
  "minimalist analyst",
];

const platformEdge = (platform: string) => {
  const presets: Record<string, string> = {
    medium: "Lead with a hooky first paragraph and end with a discussion question.",
    linkedin: "Keep paragraphs short, add 2-3 line-breaks and a relatable stat.",
    "dev.to": "Add technical proof-points, bullets, and code-friendly formatting.",
    hashnode: "Surface API/process visuals and keep headings skimmable.",
    wordpress: "Ship with schema hints, alt text, and internal link anchors.",
  };
  return presets[platform.toLowerCase()] ?? "Keep formatting clean and scannable.";
};

const makeClusters = (keyword: string): KeywordCluster[] => {
  const seed = keyword || "ai blog automation";
  return [
    {
      name: "Core Intent",
      primary: seed,
      keywords: [
        { term: seed, volume: 2100, difficulty: 0.34 },
        { term: `${seed} india`, volume: 880, difficulty: 0.28 },
        { term: `${seed} tool`, volume: 590, difficulty: 0.41 },
      ],
    },
    {
      name: "Pain Points",
      primary: `${seed} cost`,
      keywords: [
        { term: `${seed} pricing`, volume: 260, difficulty: 0.35 },
        { term: `${seed} cheapest`, volume: 170, difficulty: 0.31 },
        { term: `${seed} roi`, volume: 140, difficulty: 0.29 },
      ],
    },
    {
      name: "Outcome Proof",
      primary: `${seed} organic traffic`,
      keywords: [
        { term: `${seed} results`, volume: 320, difficulty: 0.32 },
        { term: `${seed} case study`, volume: 210, difficulty: 0.36 },
        { term: `${seed} serp`, volume: 160, difficulty: 0.27 },
      ],
    },
  ];
};

const makeSerpInsights = (keyword: string): SerpInsight[] => {
  const base = keyword || "ai blog automation";
  return [
    {
      title: `${base} - comparison`,
      url: "https://example.com/ai-blog-comparison",
      wordCount: 1850,
      gaps: ["No India-specific pricing", "Missing CTA for SMBs", "No schema examples"],
      snippetOpportunity: "Definition snippet: What is AI blog automation?",
    },
    {
      title: `${base} tools list`,
      url: "https://example.com/tools-list",
      wordCount: 1450,
      gaps: ["Shallow feature coverage", "No ROI calculator", "No platform publishing tips"],
      snippetOpportunity: "Ordered list snippet: Steps to automate content",
    },
    {
      title: "How to scale blog SEO",
      url: "https://example.com/scale-blog-seo",
      wordCount: 2100,
      gaps: ["No cost benchmarks", "No India-localized examples", "No FAQ schema"],
      snippetOpportunity: "Table snippet: Cost vs output per provider",
    },
  ];
};

const makeOutline = (keyword: string, intent: string, audience: string): OutlineSection[] => {
  const anchor = keyword || "AI blog automation";
  return [
    {
      heading: `${anchor}: why it matters for ${audience || "growth teams"}`,
      bullets: [
        `Map the ${intent || "informational"} intent to revenue moments.`,
        "Define what great looks like: speed, depth, and crawlability.",
        "Quantify the risk of manual workflows and fragmented tools.",
      ],
    },
    {
      heading: "Competitive gap and differentiation",
      bullets: [
        "Summarize SERP overlap and where others stop short.",
        "Highlight India-first needs: pricing, GST invoicing, local examples.",
        "Position the product as the autopilot for research → draft → publish.",
      ],
    },
    {
      heading: "Proof, metrics, and governance",
      bullets: [
        "Show word-count vs. competitor averages and readability bands.",
        "Flag snippet-ready blocks: definitions, steps, and comparison tables.",
        "List the scorecard you will ship with (SEO, readability, humanization).",
      ],
    },
    {
      heading: "Activation and CTA strategy",
      bullets: [
        "Map next steps per platform (LinkedIn, Medium, WordPress, dev communities).",
        "Provide CTA variants for demo, trial, and consultation.",
        "Add internal link anchors to product, pricing, and case studies.",
      ],
    },
  ];
};

const buildSeo = (
  keyword: string,
  intent: string,
  platforms: string[],
  tone: string,
): SeoScorecard => {
  const platformLabel = platforms.length ? platforms.slice(0, 3).join(", ") : "priority platforms";
  return {
    score: 82,
    keywordPlacement: [
      `Primary keyword in H1 and first 80 words (${keyword || "target keyword"})`,
      "Secondary keywords in two H2s and CTA block",
      `Latent terms sprinkled across feature bullets, tuned for ${platformLabel}`,
    ],
    readability: `Flesch 64 (Grade 8-9) in a ${tone} tone with 2-4 sentence paragraphs`,
    snippetReadiness:
      "Definition paragraph, numbered how-to, and comparison table cover snippet formats.",
    internalLinks: [
      "Link to pricing with anchor 'Compare plans'",
      "Link to feature tour with anchor 'Automation pipeline'",
      "Link to case study with anchor 'Proof from similar teams'",
    ],
    meta: {
      title: `${keyword || "AI blog automation"} | Fast SEO engine for ${intent || "growth"}`,
      description: `Generate SEO-grade blogs with keyword intelligence, SERP gaps, and humanized drafting in one flow—prepped for ${platformLabel}.`,
      slug: keyword ? keyword.toLowerCase().replace(/\s+/g, "-") : "ai-blog-automation",
    },
    faqs: [
      "How does Blogy reduce the cost of long-form SEO content?",
      "Can I customize the brand voice across multiple platforms?",
      "What schema markup ships with each generated blog?",
      "How are keyword clusters picked for India-first search intent?",
      "What happens if an AI provider is down?",
    ],
    ctas: [
      "Start an autopilot blog run",
      "See a SERP gap demo",
      "Book an SEO quality review",
    ],
  };
};

const pickVoice = (brandVoice: string, tone: string) => {
  if (brandVoice.trim().length > 0) return brandVoice;
  return `${tone} ${marketingVoices[Math.floor(Math.random() * marketingVoices.length)]}`;
};

const buildTimeline = (platforms: string[], tone: string) => [
  { label: "Research", detail: "Keyword clustering + SERP gaps locked in under 5s." },
  { label: "Generate", detail: `Draft shaped in your ${tone} tone with humanization.` },
  {
    label: "Optimize",
    detail: "SEO guardrails applied: snippet blocks, schema hints, CTA anchors.",
  },
  {
    label: "Publish",
    detail: `Export presets for ${platforms.slice(0, 3).join(", ") || "priority platforms"}.`,
  },
];

const buildPrompt = (payload: PipelineRequest, outline: OutlineSection[]) => {
  const platformNotes = payload.platforms.map(platformEdge).join(" ");
  return [
    {
      role: "system" as const,
      content:
        "You are an elite content strategist and SEO writer. Write concise, well-structured markdown with headings, bullets, and CTA sections. Keep tone human and avoid repetition.",
    },
    {
      role: "user" as const,
      content: `
Keyword: ${payload.keyword}
Audience: ${payload.audience}
Intent: ${payload.intent}
Tone: ${payload.tone}
Brand voice: ${payload.brandVoice}
Target length: ${payload.targetLength} words
Platforms: ${payload.platforms.join(", ")}

Follow this outline:
${outline.map((o) => `- ${o.heading}: ${o.bullets.join("; ")}`).join("\n")}

Rules:
- Keep keyword density natural.
- Include at least one definition paragraph, one ordered list, and one comparison table (markdown).
- Close with two CTA options tuned to ${payload.audience}.
- ${platformNotes}
      `,
    },
  ];
};

const generateWithOpenAI = async (
  payload: PipelineRequest,
  outline: OutlineSection[],
): Promise<{ text: string; usedFallback: boolean }> => {
  if (!openAiClient) {
    return { text: fallbackExample, usedFallback: true };
  }

  try {
    const completion = await openAiClient.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.65,
      max_tokens: 900,
      messages: buildPrompt(payload, outline),
    });

    const content = completion.choices[0]?.message?.content?.trim();
    return { text: content || fallbackExample, usedFallback: !content };
  } catch (error) {
    console.error("OpenAI generation failed, falling back to sample copy", error);
    return { text: fallbackExample, usedFallback: true };
  }
};

export async function runPipeline(payload: PipelineRequest): Promise<PipelineResponse> {
  const keyword = payload.keyword.trim() || "AI blog automation India";
  const clusters = makeClusters(keyword);
  const serpInsights = makeSerpInsights(keyword);
  const outline = makeOutline(keyword, payload.intent, payload.audience);
  const voice = pickVoice(payload.brandVoice, payload.tone);
  const { text, usedFallback } = await generateWithOpenAI(
    { ...payload, brandVoice: voice },
    outline,
  );
  const seo = buildSeo(keyword, payload.intent, payload.platforms, payload.tone);

  return {
    clusters,
    serpInsights,
    outline,
    generated: text,
    seo,
    timeline: buildTimeline(payload.platforms, payload.tone),
    usedFallback,
  };
}
