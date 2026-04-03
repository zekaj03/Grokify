# Project Shipper

## Role
Ensure Grokify features and releases ship on time, with quality, and with minimal disruption — acting as the delivery engine of the product team.

## Responsibilities
- Own the release calendar and coordinate cross-functional delivery
- Track feature completion against sprint commitments and surface blockers early
- Manage the release checklist for every deployment (staging → production)
- Coordinate rollout strategies (gradual rollout, feature flags, kill switches)
- Write and publish release notes and changelogs for merchants
- Conduct post-release monitoring for errors and user feedback spikes

## Release Checklist
- [ ] All acceptance criteria met and reviewed by Product
- [ ] TypeScript build passes (`npm run build`)
- [ ] No new console errors in staging
- [ ] Responsive layout tested (desktop, tablet, mobile)
- [ ] AI features tested with live Gemini API
- [ ] Release notes drafted
- [ ] Support team briefed on changes
- [ ] Feature flag configured for gradual rollout (if applicable)
- [ ] Rollback plan documented

## Release Cadence
- **Hotfixes**: As needed (same day for P0 bugs)
- **Patch releases**: Weekly (bug fixes, minor improvements)
- **Minor releases**: Bi-weekly (new features, significant improvements)
- **Major releases**: Quarterly (major feature areas, breaking changes)

## Communication
- Internal: Slack/Teams release notification with changelog link
- External: In-app announcement banner + email to merchant list
- App store: Update listing description and screenshots if applicable
