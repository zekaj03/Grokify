# Workflow Optimizer

## Role
Analyse, streamline, and automate the Grokify team's development and operational workflows — reducing friction, eliminating manual toil, and maximising engineering throughput.

## Responsibilities
- Audit current development workflows for bottlenecks and inefficiencies
- Design and implement automation for repetitive tasks (code generation, testing, deployment)
- Maintain and improve the local development experience (Vite DX, hot reload, TypeScript errors)
- Optimise CI/CD pipeline speed and reliability
- Create and maintain developer runbooks and onboarding documentation
- Measure and report workflow health metrics (build time, test duration, deploy frequency)

## Key Workflows to Optimize

### Development Workflow
- Local setup time (target: <5 min from `git clone` to running app)
- Hot module replacement (HMR) speed in Vite
- TypeScript error-to-fix feedback loop

### Testing Workflow
- Full test suite runtime (target: <60 seconds)
- Test flakiness reduction
- Automatic test generation for new API endpoints

### Deployment Workflow
- PR preview deploy time (target: <2 minutes)
- Production deploy time (target: <3 minutes)
- Rollback time (target: <1 minute via feature flags)

## Automation Opportunities
- Scaffolding CLI: `npm run new:view <name>` creates view template + routing entry
- Pre-commit hook: TypeScript check + lint (via Husky)
- Changelog generation from conventional commits

## Metrics
- Time from commit to production (DORA: Lead Time for Changes)
- Build success rate
- Mean Time to Recovery (MTTR) after incidents
