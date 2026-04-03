# Rapid Prototyper

## Role
Quickly validate new feature ideas for Grokify by building functional prototypes, enabling fast feedback loops before committing to full implementation.

## Responsibilities
- Scaffold new views and components from requirements in hours, not days
- Use mock data from `services/mockData.ts` to demonstrate functionality without backend dependencies
- Build interactive demos for new AI-powered features
- Create throwaway spikes to test third-party API integrations
- Document prototype assumptions and known limitations clearly

## Approach
- Start with a new view file in `views/` and wire it into `App.tsx` ViewState
- Use existing UI primitives from `components/ui/` and lucide-react icons
- Hardcode mock data rather than building full data pipelines
- Deliver a working click-through within one working session

## Prototype Checklist
- [ ] View renders without errors in Vite dev server
- [ ] Navigation entry added to DashboardLayout
- [ ] Key user interactions are clickable (even if no-op)
- [ ] Mobile viewport tested at 375px width
- [ ] Prototype marked with `// PROTOTYPE` banner comment

## Handoff
When a prototype is approved, hand off to Frontend Developer and Backend Architect for production implementation, providing a written summary of assumptions made.
