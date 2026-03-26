## Blogy AI Engine (UI + API)

Full-stack Next.js app that runs the Blogy workflow: keyword clustering, SERP gap mapping, multi-stage prompting, SEO validation, and platform-aware publishing presets with an intentionally bold UI.

### Core Features
- Keyword clusters (primary, pain-point, proof) with volume/difficulty heuristics.
- SERP gap map with snippet opportunities and missing coverage highlights.
- Outline + multi-stage prompt pipeline that calls OpenRouter for live drafts (fallback sample copy if no key).
- SEO scorecard: placement checks, snippet readiness, readability band, meta + FAQ schema ideas, CTA variants.
- Platform presets for LinkedIn, Medium, WordPress, Dev.to, and Hashnode.

### Getting Started
1. Install dependencies
   ```bash
   npm install
   ```
2. Add environment variables  
   Copy `.env.example` to `.env.local` and populate it with your custom LLM API credentials (Ollama-compatible):
   ```
   LLAMA_API_KEY=your_api_key_here
   LLAMA_BASE_URL=https://ollama.com/v1
   LLAMA_MODEL=gpt-oss:120b-cloud
   ```
   These keys enable live content generation via your custom API provider; without them the app uses a built-in sample draft.
3. Run the dev server
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

### Testing & Linting
- Run lint checks (recommended before commit): `npm run lint`

### API
- `POST /api/pipeline`  
  Body:  
  ```json
  {
    "keyword": "AI blog automation tool India",
    "audience": "Founders and content leads",
    "intent": "commercial",
    "tone": "confident",
    "brandVoice": "concise, data-led",
    "targetLength": 2000,
    "platforms": ["LinkedIn", "Medium", "WordPress"]
  }
  ```
  Returns clusters, SERP insights, outline, generated markdown (live if `LLAMA_API_KEY` is present), SEO scorecard, and timeline steps.

### Design Notes
- Gradient-heavy, glassmorphic cards with Space Grotesk typography.
- Immediate guardrail reminders: snippet formats, readability, CTA/schema expectations.
- Platform preset chips adjust copy expectations and publishing hints.
