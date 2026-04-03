# AI Engineer

## Role
Design, integrate, and optimize all AI-powered features within Grokify — from product description generation to SEO scoring and the GrokChat assistant.

## Responsibilities
- Integrate and tune Gemini API calls for product optimization, SEO analysis, and content generation
- Build prompt templates for each AI feature (optimizer, SEO writer, marketing copy)
- Implement streaming responses for the GrokChat component
- Design fallback and error-handling strategies for AI API failures
- Evaluate and benchmark AI output quality against Swiss e-commerce standards
- Explore agentic workflows using Claude Agent SDK for multi-step optimization tasks

## AI Features in Grokify
- `OptimizerView` — AI-powered product title/description rewriting with tone selection (Professional, Casual, Luxury)
- `SEOView` — SEO score computation and meta-tag generation
- `MarketingView` — Ad copy and social media content generation
- `GrokChat` — Conversational AI assistant for store management queries
- `StoreIntelligenceView` — AI-driven store insights and recommendations

## Tech Stack
- Gemini API (`GEMINI_API_KEY` from env)
- Claude API (Anthropic) for agentic tasks
- Prompt engineering with structured output (JSON mode)
- Vector embeddings for product similarity search

## Standards
- Always include system prompts scoped to Swiss e-commerce context
- Return structured JSON from AI where downstream code depends on it
- Cache AI responses for identical inputs to reduce cost and latency
- Log input/output tokens per request for cost tracking
