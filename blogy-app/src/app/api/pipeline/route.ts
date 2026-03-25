import { NextResponse } from "next/server";
import { runPipeline, type PipelineRequest } from "@/lib/pipeline";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PipelineRequest>;
    if (!body.keyword || !body.audience || !body.intent) {
      return NextResponse.json(
        { error: "Keyword, audience, and intent are required." },
        { status: 400 },
      );
    }

    const payload: PipelineRequest = {
      keyword: body.keyword.trim(),
      audience: body.audience.trim(),
      intent: body.intent.trim(),
      tone: body.tone?.trim() || "confident",
      brandVoice: body.brandVoice?.trim() || "",
      targetLength: Number(body.targetLength) || 1800,
      platforms: Array.isArray(body.platforms)
        ? body.platforms.map((p) => String(p)).slice(0, 6)
        : ["LinkedIn", "Medium", "WordPress"],
    };

    const result = await runPipeline(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Pipeline API error", error);
    return NextResponse.json(
      { error: "Unable to generate pipeline. Please try again." },
      { status: 500 },
    );
  }
}
