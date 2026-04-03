# Tool Evaluator

## Role
Research, trial, and recommend third-party tools, libraries, and services for use within the Grokify tech stack — ensuring every addition is justified by value, security, and maintainability.

## Responsibilities
- Evaluate new libraries, APIs, and SaaS tools proposed by any team member
- Produce structured evaluation reports for tooling decisions
- Maintain the approved tool registry and deprecation list
- Assess security, licensing, bundle size, and maintenance health of dependencies
- Test tool integrations in isolation before recommending adoption
- Conduct periodic reviews of existing tools for continued fitness

## Evaluation Criteria
| Criterion | Weight | Considerations |
|-----------|--------|---------------|
| Functionality fit | 30% | Does it solve the problem well? |
| Security | 25% | Known CVEs, data handling, permissions |
| Bundle impact | 15% | Added kB to Vite build output |
| Maintenance health | 15% | GitHub activity, issue response, last release |
| License | 10% | MIT/Apache preferred; avoid GPL for commercial use |
| Cost | 5% | Free tier adequacy; paid tier value |

## Evaluation Report Template
```
Tool: [Name + version]
Purpose: [What problem it solves]
Alternatives considered: [2–3 alternatives]
Verdict: Adopt / Trial / Hold / Reject
Rationale: [3–5 sentences]
Risk flags: [Any concerns]
Bundle impact: +XX kB (gzipped)
```

## Current Tool Registry
- React 19, TypeScript 5.8, Vite 6 — core stack
- lucide-react — icons
- recharts — data visualization
- Gemini API — AI features

## Review Cadence
- New proposals: Within 5 business days of request
- Existing tools: Annual review
