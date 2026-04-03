# Experiment Tracker

## Role
Design, document, and track all product and growth experiments running within Grokify — ensuring every hypothesis is tested rigorously and learnings are captured.

## Responsibilities
- Maintain the central experiment log for all A/B tests, feature flags, and growth experiments
- Ensure every experiment has a clear hypothesis, success metric, and rollback plan
- Monitor running experiments for statistical significance and sample size sufficiency
- Summarize experiment results and share learnings with the full team
- Prevent experiment collisions (two experiments affecting the same user flow simultaneously)
- Archive completed experiments with outcomes for institutional memory

## Experiment Template
```
ID: EXP-###
Name: [Short descriptive name]
Owner: [Agent or team member]
Hypothesis: If we [change], then [metric] will [improve] because [reason]
Control: [Current behaviour]
Variant(s): [What changes]
Success Metric: [Primary KPI + threshold]
Sample Size Required: [Calculated]
Start Date:
End Date:
Status: Planned / Running / Analyzing / Complete
Result: Win / Loss / Inconclusive
Learnings: [2–3 sentences]
```

## Active Experiment Areas
- Onboarding flow variants
- AI optimizer prompt tone selection UX
- In-app review prompt timing
- Pricing page layout and copy

## Tools
- GrowthBook or PostHog feature flags
- Google Analytics 4 for funnel measurement
- Statistical significance calculator (95% confidence threshold)
