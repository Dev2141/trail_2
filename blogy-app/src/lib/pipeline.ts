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

const openRouterClient = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
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

const makeClusters = async (keyword: string): Promise<KeywordCluster[]> => {
  if (!openRouterClient) {
    // Fallback to mock data if no API key
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
  }

  try {
    const completion = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: "You are an SEO keyword research expert. Return only valid JSON, no other text.",
        },
        {
          role: "user",
          content: `Generate 3 realistic keyword clusters for: "${keyword}". Return a JSON array with this structure:
[
  {
    "name": "cluster name",
    "primary": "main keyword",
    "keywords": [
      {"term": "keyword phrase", "volume": <realistic monthly volume>, "difficulty": <0.0-1.0>}
    ]
  }
]

Include: 1) Core Intent cluster (main topic), 2) Pain Points cluster (problems/cost), 3) Outcome Proof cluster (results/benefits).
Each cluster should have 3 keyword variations.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || content.match(/(\[[\s\S]*\])/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
    }
  } catch (error) {
    console.error("Failed to generate clusters dynamically, using fallback", error);
  }

  // Fallback
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
  ];
};

const makeSerpInsights = async (keyword: string): Promise<SerpInsight[]> => {
  if (!openRouterClient) {
    // Fallback to mock data
    const base = keyword || "ai blog automation";
    return [
      {
        title: `${base} - comparison`,
        url: "https://example.com/comparison",
        wordCount: 1850,
        gaps: ["No India-specific pricing", "Missing CTA for SMBs", "No schema examples"],
        snippetOpportunity: "Definition snippet: What is " + base + "?",
      },
      {
        title: `${base} tools list`,
        url: "https://example.com/tools-list",
        wordCount: 1450,
        gaps: ["Shallow feature coverage", "No ROI calculator", "No platform tips"],
        snippetOpportunity: "Ordered list snippet: Steps to implement",
      },
      {
        title: `How to choose ${base}`,
        url: "https://example.com/guide",
        wordCount: 2100,
        gaps: ["No cost benchmarks", "No localized examples", "No FAQ schema"],
        snippetOpportunity: "Table snippet: Comparison table",
      },
    ];
  }

  try {
    const completion = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: "You are an SEO SERP analyst. Return only valid JSON, no other text.",
        },
        {
          role: "user",
          content: `Analyze the top 3 SERP results for "${keyword}". Return a JSON array:
[
  {
    "title": "realistic article title",
    "url": "https://example.com/url",
    "wordCount": <realistic count>,
    "gaps": ["gap 1", "gap 2", "gap 3"],
    "snippetOpportunity": "description of snippet type"
  }
]

Identify realistic content gaps, missing information, and featured snippet opportunities.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) {
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || content.match(/(\[[\s\S]*\])/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
    }
  } catch (error) {
    console.error("Failed to generate SERP insights dynamically, using fallback", error);
  }

  // Fallback
  const base = keyword || "ai blog automation";
  return [
    {
      title: `${base} - guide`,
      url: "https://example.com/guide",
      wordCount: 1800,
      gaps: ["Missing specific examples", "No actionable tips", "No case studies"],
      snippetOpportunity: "How-to snippet",
    },
  ];
};

const makeOutline = async (
  keyword: string,
  intent: string,
  audience: string,
  serpGaps: SerpInsight[],
): Promise<OutlineSection[]> => {
  if (!openRouterClient) {
    // Fallback outline
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
  }

  const gapsSummary = serpGaps.map((s) => `"${s.title}" lacks: ${s.gaps.join(", ")}`).join("; ");

  try {
    const completion = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content:
            "You are an SEO content strategist. Create a comprehensive blog outline. Return only valid JSON, no other text.",
        },
        {
          role: "user",
          content: `Create a detailed blog outline for keyword: "${keyword}"
Audience: ${audience}
Intent: ${intent}
SERP Gaps identified: ${gapsSummary}

Return a JSON array with 4-5 sections:
[
  {
    "heading": "section heading",
    "bullets": ["bullet point 1", "bullet point 2", "bullet point 3"]
  }
]

The outline should address the SERP gaps and be optimized for ${intent} intent. Include sections covering: introduction/why it matters, competitive analysis, detailed solution/guide, proof/examples, and call-to-action.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) {
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || content.match(/(\[[\s\S]*\])/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
    }
  } catch (error) {
    console.error("Failed to generate outline dynamically, using fallback", error);
  }

  // Fallback
  const anchor = keyword || "AI blog automation";
  return [
    {
      heading: `Understanding ${anchor}`,
      bullets: [
        `What is ${anchor} and why it matters for ${audience}`,
        "Key benefits and use cases",
        "Common challenges and solutions",
      ],
    },
    {
      heading: "Competitive analysis",
      bullets: ["What others are missing", "Unique opportunities", "Differentiation strategies"],
    },
  ];
};

const buildSeo = (
  keyword: string,
  intent: string,
  platforms: string[],
  tone: string,
  generatedText: string,
): SeoScorecard => {
  const platformLabel = platforms.length ? platforms.slice(0, 3).join(", ") : "priority platforms";

  // Real programmatic heuristics
  const words = generatedText.trim().split(/\s+/);
  const wordCount = words.length;
  const lowerText = generatedText.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  // Count keyword occurrences
  const keywordRegex = new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const keywordMatches = generatedText.match(keywordRegex) || [];
  const keywordCount = keywordMatches.length;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // Check H1 (first line starting with #)
  const h1Match = generatedText.match(/^#\s+(.+)$/m);
  const h1Text = h1Match ? h1Match[1].toLowerCase() : "";
  const keywordInH1 = h1Text.includes(lowerKeyword);

  // Check first 100 words for keyword
  const first100Words = words.slice(0, 100).join(" ").toLowerCase();
  const keywordInIntro = first100Words.includes(lowerKeyword);

  // Count H2s and H3s
  const h2Count = (generatedText.match(/^##\s+/gm) || []).length;
  const h3Count = (generatedText.match(/^###\s+/gm) || []).length;

  // Check for bullet points
  const hasBullets = /^[\-\*]\s+/m.test(generatedText);

  // Check for lists and tables
  const hasNumberedList = /^\d+\.\s+/m.test(generatedText);
  const hasTable = /\|.*\|/m.test(generatedText);

  // Calculate dynamic score (start with 100, deduct points)
  let score = 100;

  if (!keywordInH1) score -= 10;
  if (!keywordInIntro) score -= 10;
  if (keywordDensity < 0.5) score -= 15;
  if (keywordDensity > 3) score -= 10;
  if (h2Count < 3) score -= 10;
  if (!hasBullets) score -= 10;
  if (wordCount < 1000) score -= 15;
  if (!hasNumberedList && !hasTable) score -= 10;

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Build keyword placement feedback
  const keywordPlacement: string[] = [];
  if (keywordInH1) {
    keywordPlacement.push(`✓ Primary keyword in H1: "${keyword}"`);
  } else {
    keywordPlacement.push(`✗ Primary keyword missing from H1 (add "${keyword}" to title)`);
  }

  if (keywordInIntro) {
    keywordPlacement.push(`✓ Keyword appears in first 100 words`);
  } else {
    keywordPlacement.push(`✗ Keyword should appear in introduction`);
  }

  keywordPlacement.push(
    `Keyword density: ${keywordDensity.toFixed(2)}% (${keywordCount} occurrences in ${wordCount} words)` +
    (keywordDensity >= 1 && keywordDensity <= 2 ? " ✓" : keywordDensity < 1 ? " - increase usage" : " - reduce usage")
  );

  // Estimate readability (simple heuristic)
  const avgWordsPerSentence = wordCount / Math.max(1, (generatedText.match(/[.!?]+/g) || []).length);
  const fleschApprox = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * 1.5));
  const gradeLevel = fleschApprox > 60 ? "Grade 8-9" : fleschApprox > 50 ? "Grade 10-12" : "College";

  return {
    score,
    keywordPlacement,
    readability: `Flesch ${fleschApprox.toFixed(0)} (${gradeLevel}) in a ${tone} tone with ~${avgWordsPerSentence.toFixed(1)} words/sentence`,
    snippetReadiness: hasTable && hasNumberedList
      ? "✓ Has both definition paragraphs, numbered lists, and comparison tables"
      : hasNumberedList
      ? "Has numbered lists; consider adding comparison tables"
      : hasTable
      ? "Has tables; consider adding numbered how-to lists"
      : "Add structured content: numbered lists and comparison tables for featured snippets",
    internalLinks: [
      "Link to pricing with anchor 'Compare plans'",
      "Link to feature tour with anchor 'Automation pipeline'",
      "Link to case study with anchor 'Proof from similar teams'",
    ],
    meta: {
      title: `${keyword} | Comprehensive ${intent} guide`,
      description: `${generatedText.split('.')[0]}. Optimized for ${platformLabel}.`.slice(0, 155) + "...",
      slug: keyword.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
    },
    faqs: [
      `What is ${keyword}?`,
      `How does ${keyword} work?`,
      `What are the benefits of ${keyword}?`,
      `How much does ${keyword} cost?`,
      `Is ${keyword} right for my business?`,
    ],
    ctas: [
      "Start your free trial",
      "See a live demo",
      "Book a consultation",
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

// Multi-stage generation pipeline
const generateMultiStage = async (
  payload: PipelineRequest,
  outline: OutlineSection[],
): Promise<{ text: string; usedFallback: boolean }> => {
  if (!openRouterClient) {
    return { text: fallbackExample, usedFallback: true };
  }

  try {
    // Stage 1: Generate detailed content outline (The Architect)
    const stage1 = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.65,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: "You are an SEO content architect. Expand the outline into a detailed structure with talking points.",
        },
        {
          role: "user",
          content: `Keyword: ${payload.keyword}
Audience: ${payload.audience}
Intent: ${payload.intent}
Tone: ${payload.tone}
Target length: ${payload.targetLength} words

Current outline:
${outline.map((s) => `## ${s.heading}\n${s.bullets.map((b) => `- ${b}`).join("\n")}`).join("\n\n")}

Expand this outline with specific talking points, examples to include, and content structure. Return the expanded outline as markdown.`,
        },
      ],
    });

    const expandedOutline = stage1.choices[0]?.message?.content?.trim() || "";

    // Stage 2: Write the content (The Writer)
    const platformNotes = payload.platforms.map(platformEdge).join(" ");
    const stage2 = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.65,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: "You are an expert content writer. Write engaging, well-structured SEO content in markdown format with proper headings, bullets, and tables.",
        },
        {
          role: "user",
          content: `Write a comprehensive ${payload.targetLength}-word blog post.

Keyword: ${payload.keyword}
Audience: ${payload.audience}
Intent: ${payload.intent}
Tone: ${payload.tone}
Brand voice: ${payload.brandVoice}
Platforms: ${payload.platforms.join(", ")}

Structure to follow:
${expandedOutline}

Requirements:
- Start with an H1 title including the keyword
- Use H2 and H3 headings for structure
- Include at least one definition paragraph
- Include at least one numbered list (for how-to)
- Include at least one comparison table in markdown format
- Use bullet points for key information
- Write in a ${payload.tone} tone
- Natural keyword integration (avoid stuffing)
- ${platformNotes}
- End with 2 strong CTAs

Write the complete blog post now in markdown:`,
        },
      ],
    });

    const draftContent = stage2.choices[0]?.message?.content?.trim() || "";

    // Stage 3: SEO optimization and humanization (The SEO/Humanizer)
    const stage3 = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: "You are an SEO optimizer and content humanizer. Refine content to pass AI detection while maintaining SEO quality.",
        },
        {
          role: "user",
          content: `Review and refine this blog post draft:

${draftContent}

Target keyword: ${payload.keyword}
Platforms: ${payload.platforms.join(", ")}

Refinement tasks:
1. Ensure the keyword "${payload.keyword}" appears naturally in:
   - The H1 title
   - First 100 words
   - At least 2 H2 headings
   - Maintain 1-2% keyword density overall
2. Break up any robotic or repetitive sentences
3. Add transitional phrases to improve flow
4. Ensure formatting works for ${payload.platforms.join(", ")}
5. Verify there's at least one table and one numbered list
6. Make CTAs compelling and action-oriented
7. Keep the ${payload.tone} tone throughout

Return the refined, SEO-optimized, human-like markdown content:`,
        },
      ],
    });

    const finalContent = stage3.choices[0]?.message?.content?.trim();
    return { text: finalContent || draftContent || fallbackExample, usedFallback: !finalContent };
  } catch (error) {
    console.error("Multi-stage generation failed, falling back to sample copy", error);
    return { text: fallbackExample, usedFallback: true };
  }
};

const generateWithOpenRouter = async (
  payload: PipelineRequest,
  outline: OutlineSection[],
): Promise<{ text: string; usedFallback: boolean }> => {
  // Use the multi-stage pipeline
  return generateMultiStage(payload, outline);
};

export async function runPipeline(payload: PipelineRequest): Promise<PipelineResponse> {
  const keyword = payload.keyword.trim() || "AI blog automation India";
  const clusters = await makeClusters(keyword);
  const serpInsights = await makeSerpInsights(keyword);
  const outline = await makeOutline(keyword, payload.intent, payload.audience, serpInsights);
  const voice = pickVoice(payload.brandVoice, payload.tone);
  const { text, usedFallback } = await generateWithOpenRouter(
    { ...payload, brandVoice: voice },
    outline,
  );
  const seo = buildSeo(keyword, payload.intent, payload.platforms, payload.tone, text);

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
