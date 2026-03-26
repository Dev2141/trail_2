import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { PipelineRequest, KeywordCluster, SerpInsight, OutlineSection } from "@/lib/pipeline";

const openRouterClient = process.env.LLAMA_API_KEY
  ? new OpenAI({
      apiKey: process.env.LLAMA_API_KEY,
      baseURL: process.env.LLAMA_BASE_URL || "https://ollama.com",
    })
  : null;

// Dynamic keyword clustering
async function generateClusters(keyword: string): Promise<KeywordCluster[]> {
  if (!openRouterClient) {
    const seed = keyword;
    return [
      {
        name: "Core Intent",
        primary: seed,
        keywords: [
          { term: seed, volume: 2100, difficulty: 0.34 },
          { term: `${seed} guide`, volume: 880, difficulty: 0.28 },
          { term: `best ${seed}`, volume: 590, difficulty: 0.41 },
        ],
      },
    ];
  }

  try {
    const completion = await openRouterClient.chat.completions.create({
      model: process.env.LLAMA_MODEL || "gpt-oss:120b-cloud",
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
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || content.match(/(\[[\s\S]*\])/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
    }
  } catch (error) {
    console.error("Failed to generate clusters", error);
  }

  return [
    {
      name: "Core Intent",
      primary: keyword,
      keywords: [
        { term: keyword, volume: 2100, difficulty: 0.34 },
        { term: `${keyword} guide`, volume: 880, difficulty: 0.28 },
      ],
    },
  ];
}

// Dynamic SERP insights
async function generateSerpInsights(keyword: string): Promise<SerpInsight[]> {
  if (!openRouterClient) {
    return [
      {
        title: `${keyword} - comprehensive guide`,
        url: "https://example.com/guide",
        wordCount: 1800,
        gaps: ["Missing practical examples", "No comparison table", "Lacks actionable steps"],
        snippetOpportunity: "Definition snippet",
      },
    ];
  }

  try {
    const completion = await openRouterClient.chat.completions.create({
      model: process.env.LLAMA_MODEL || "gpt-oss:120b-cloud",
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
    console.error("Failed to generate SERP insights", error);
  }

  return [
    {
      title: `${keyword} - guide`,
      url: "https://example.com/guide",
      wordCount: 1800,
      gaps: ["Missing specific examples", "No actionable tips"],
      snippetOpportunity: "How-to snippet",
    },
  ];
}

// Dynamic outline generation
async function generateOutline(
  keyword: string,
  intent: string,
  audience: string,
  serpGaps: SerpInsight[],
): Promise<OutlineSection[]> {
  if (!openRouterClient) {
    return [
      {
        heading: `Understanding ${keyword}`,
        bullets: [
          `What is ${keyword} and why it matters`,
          "Key benefits and use cases",
          "Common challenges",
        ],
      },
      {
        heading: "Implementation guide",
        bullets: ["Step-by-step process", "Best practices", "Common pitfalls to avoid"],
      },
      {
        heading: "Results and next steps",
        bullets: ["Expected outcomes", "Measuring success", "Getting started"],
      },
    ];
  }

  const gapsSummary = serpGaps.map((s) => `"${s.title}" lacks: ${s.gaps.join(", ")}`).join("; ");

  try {
    const completion = await openRouterClient.chat.completions.create({
      model: process.env.LLAMA_MODEL || "gpt-oss:120b-cloud",
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
    console.error("Failed to generate outline", error);
  }

  return [
    {
      heading: `Understanding ${keyword}`,
      bullets: [`What is ${keyword}`, "Why it matters", "Key benefits"],
    },
  ];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PipelineRequest>;
    if (!body.keyword || !body.audience || !body.intent) {
      return NextResponse.json(
        { error: "Keyword, audience, and intent are required." },
        { status: 400 },
      );
    }

    const keyword = body.keyword.trim();
    const audience = body.audience.trim();
    const intent = body.intent.trim();

    // Generate research components
    const clusters = await generateClusters(keyword);
    const serpInsights = await generateSerpInsights(keyword);
    const outline = await generateOutline(keyword, intent, audience, serpInsights);

    return NextResponse.json({
      clusters,
      serpInsights,
      outline,
    });
  } catch (error) {
    console.error("Research API error", error);
    return NextResponse.json(
      { error: "Unable to generate research. Please try again." },
      { status: 500 },
    );
  }
}
