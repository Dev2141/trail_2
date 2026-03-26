import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { PipelineRequest, OutlineSection, SeoScorecard } from "@/lib/pipeline";

const openRouterClient = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;

const fallbackExample = `
# AI Blog Automation: The Complete Guide

AI blog automation is revolutionizing how content teams create, optimize, and publish SEO-grade articles at scale. This comprehensive guide explores the tools, strategies, and best practices that make automated blogging a reality for modern marketing teams.

## Why AI Blog Automation Matters

Traditional content creation requires significant time and resources. AI automation enables teams to:
- Generate high-quality drafts in minutes instead of hours
- Maintain consistent brand voice across all content
- Scale content production without proportionally scaling costs
- Focus human expertise on strategy and refinement rather than first drafts

## Key Features to Look For

When evaluating AI blog automation tools, prioritize these capabilities:

1. **Keyword Intelligence**: Automated keyword research and clustering
2. **SERP Analysis**: Competitive gap identification and opportunity mapping
3. **Multi-Stage Generation**: Outline → Draft → Optimization workflow
4. **SEO Validation**: Built-in scoring for readability, keyword density, and structure
5. **Platform Optimization**: Format adjustments for Medium, LinkedIn, WordPress, etc.

## Getting Started

Ready to implement AI blog automation? Start here:
- **Define your content strategy**: Identify target keywords and audience segments
- **Choose your tools**: Evaluate based on your specific needs and budget
- **Establish quality controls**: Set up human review processes for generated content
`.trim();

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

// Multi-stage generation
async function generateContent(
  payload: PipelineRequest & { outline: OutlineSection[] },
): Promise<{ text: string; usedFallback: boolean }> {
  if (!openRouterClient) {
    return { text: fallbackExample, usedFallback: true };
  }

  try {
    // Stage 1: Expand outline
    const stage1 = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.65,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: "You are an SEO content architect. Expand the outline with specific talking points.",
        },
        {
          role: "user",
          content: `Keyword: ${payload.keyword}
Audience: ${payload.audience}
Intent: ${payload.intent}
Tone: ${payload.tone}
Target: ${payload.targetLength} words

Outline:
${payload.outline.map((s) => `## ${s.heading}\n${s.bullets.map((b) => `- ${b}`).join("\n")}`).join("\n\n")}

Expand with specific examples, data points, and structure. Return markdown.`,
        },
      ],
    });

    const expandedOutline = stage1.choices[0]?.message?.content?.trim() || "";

    // Stage 2: Write content
    const platformNotes = payload.platforms.map(platformEdge).join(" ");
    const stage2 = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.65,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content:
            "You are an expert content writer. Write engaging, well-structured SEO content in markdown.",
        },
        {
          role: "user",
          content: `Write a ${payload.targetLength}-word blog post.

Keyword: ${payload.keyword}
Audience: ${payload.audience}
Tone: ${payload.tone}
Brand voice: ${payload.brandVoice}
Platforms: ${payload.platforms.join(", ")}

Structure:
${expandedOutline}

Requirements:
- H1 title with keyword
- H2/H3 structure
- Definition paragraph
- Numbered list
- Comparison table (markdown)
- Bullet points
- ${payload.tone} tone
- Natural keyword usage (1-2% density)
- ${platformNotes}
- 2 strong CTAs at end

Write complete markdown:`,
        },
      ],
    });

    const draftContent = stage2.choices[0]?.message?.content?.trim() || "";

    // Stage 3: Refine and humanize
    const stage3 = await openRouterClient.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: "You are an SEO optimizer and content humanizer. Refine to pass AI detection.",
        },
        {
          role: "user",
          content: `Refine this draft:

${draftContent}

Target: ${payload.keyword}
Platforms: ${payload.platforms.join(", ")}

Tasks:
1. Ensure "${payload.keyword}" in H1, first 100 words, 2+ H2s, 1-2% density
2. Remove robotic/repetitive sentences
3. Add transitions
4. Format for ${payload.platforms.join(", ")}
5. Verify table + numbered list present
6. Strengthen CTAs
7. Maintain ${payload.tone} tone

Return refined markdown:`,
        },
      ],
    });

    const finalContent = stage3.choices[0]?.message?.content?.trim();
    return { text: finalContent || draftContent || fallbackExample, usedFallback: !finalContent };
  } catch (error) {
    console.error("Generation failed", error);
    return { text: fallbackExample, usedFallback: true };
  }
}

// Real SEO validation
function buildSeoScore(keyword: string, intent: string, platforms: string[], tone: string, text: string): SeoScorecard {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  const lowerKeyword = keyword.toLowerCase();

  const keywordRegex = new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const keywordCount = (text.match(keywordRegex) || []).length;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  const h1Match = text.match(/^#\s+(.+)$/m);
  const h1Text = h1Match ? h1Match[1].toLowerCase() : "";
  const keywordInH1 = h1Text.includes(lowerKeyword);

  const first100Words = words.slice(0, 100).join(" ").toLowerCase();
  const keywordInIntro = first100Words.includes(lowerKeyword);

  const h2Count = (text.match(/^##\s+/gm) || []).length;
  const hasBullets = /^[\-\*]\s+/m.test(text);
  const hasNumberedList = /^\d+\.\s+/m.test(text);
  const hasTable = /\|.*\|/m.test(text);

  let score = 100;
  if (!keywordInH1) score -= 10;
  if (!keywordInIntro) score -= 10;
  if (keywordDensity < 0.5) score -= 15;
  if (keywordDensity > 3) score -= 10;
  if (h2Count < 3) score -= 10;
  if (!hasBullets) score -= 10;
  if (wordCount < 1000) score -= 15;
  if (!hasNumberedList && !hasTable) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const keywordPlacement: string[] = [];
  if (keywordInH1) {
    keywordPlacement.push(`✓ Primary keyword in H1: "${keyword}"`);
  } else {
    keywordPlacement.push(`✗ Add "${keyword}" to H1 title`);
  }

  if (keywordInIntro) {
    keywordPlacement.push(`✓ Keyword in first 100 words`);
  } else {
    keywordPlacement.push(`✗ Add keyword to introduction`);
  }

  const densityStatus = keywordDensity >= 1 && keywordDensity <= 2 ? " ✓" : keywordDensity < 1 ? " - increase" : " - reduce";
  keywordPlacement.push(
    `Density: ${keywordDensity.toFixed(2)}% (${keywordCount}/${wordCount} words)${densityStatus}`
  );

  const avgWordsPerSentence = wordCount / Math.max(1, (text.match(/[.!?]+/g) || []).length);
  const fleschApprox = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * 1.5));
  const gradeLevel = fleschApprox > 60 ? "Grade 8-9" : fleschApprox > 50 ? "Grade 10-12" : "College";

  const platformLabel = platforms.slice(0, 3).join(", ") || "priority platforms";

  return {
    score,
    keywordPlacement,
    readability: `Flesch ${fleschApprox.toFixed(0)} (${gradeLevel}), ${tone} tone, ~${avgWordsPerSentence.toFixed(1)} words/sentence`,
    snippetReadiness:
      hasTable && hasNumberedList
        ? "✓ Has definition, lists, and tables"
        : hasNumberedList
        ? "Has lists; add comparison tables"
        : hasTable
        ? "Has tables; add numbered lists"
        : "Add structured content for snippets",
    internalLinks: [
      "Link to pricing: 'Compare plans'",
      "Link to features: 'Automation pipeline'",
      "Link to proof: 'Case studies'",
    ],
    meta: {
      title: `${keyword} | ${intent.charAt(0).toUpperCase() + intent.slice(1)} Guide`,
      description: `${text.split(".")[0]}. Optimized for ${platformLabel}.`.slice(0, 155) + "...",
      slug: keyword.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
    },
    faqs: [
      `What is ${keyword}?`,
      `How does ${keyword} work?`,
      `What are the benefits of ${keyword}?`,
      `How much does ${keyword} cost?`,
      `Is ${keyword} right for me?`,
    ],
    ctas: ["Start free trial", "See live demo", "Book consultation"],
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PipelineRequest & { outline: OutlineSection[] }>;

    if (!body.keyword || !body.audience || !body.intent || !body.outline) {
      return NextResponse.json(
        { error: "Keyword, audience, intent, and outline are required." },
        { status: 400 },
      );
    }

    const payload: PipelineRequest & { outline: OutlineSection[] } = {
      keyword: body.keyword.trim(),
      audience: body.audience.trim(),
      intent: body.intent.trim(),
      tone: body.tone?.trim() || "confident",
      brandVoice: body.brandVoice?.trim() || "",
      targetLength: Number(body.targetLength) || 2000,
      platforms: Array.isArray(body.platforms) ? body.platforms : ["LinkedIn", "Medium", "WordPress"],
      outline: body.outline,
    };

    const { text, usedFallback } = await generateContent(payload);
    const seo = buildSeoScore(payload.keyword, payload.intent, payload.platforms, payload.tone, text);

    return NextResponse.json({
      generated: text,
      seo,
      usedFallback,
    });
  } catch (error) {
    console.error("Generate API error", error);
    return NextResponse.json(
      { error: "Unable to generate content. Please try again." },
      { status: 500 },
    );
  }
}
