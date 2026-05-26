---
date: 2026-05-26
topic: Onboarding engagement pass
status: ready-for-planning
source: Brainstorm evaluating three leadership suggestions (checkboxes + dynamic progress, persistent logins + save-state, color blocks + visual touches)
---

# Onboarding Engagement Pass — Requirements

## Summary

Add per-item checkboxes to each onboarding page, replace the current page-position progress indicator with a completion-driven one, persist state in the browser via `localStorage`, and add visual feedback for completion. Goal is to convert passive scrolling into active acknowledgment without introducing accounts, a backend, or gated navigation.

## Problem / Goal

Leadership wants the onboarding experience to feel more "app-like" and to give them confidence that agents are actually engaging with the content, not just scrolling past it. Today the only signal of progress is *position* (page X of Y), which doesn't distinguish "read carefully" from "scrolled to the bottom."

**Real underlying outcome:** active engagement. We want agents to commit, page by page, to having read each piece — and to feel a small reward as they complete sections.

The three leadership suggestions that initiated this brainstorm:
1. Checkboxes with dynamic progress tracking based on completion → **adopted**
2. Persistent user logins with save-state → **rejected as proposed; replaced with `localStorage`**
3. Color blocks and visual touches to feel more app-like → **adopted, reframed as feedback for the new interactive states**

## Users

- **Primary:** New 6th Ave Homes agents going through onboarding for the first time. Self-serve. Typically complete in one sitting.
- **Secondary:** Returning agents using onboarding pages 6–8 (Guide Orientation) as a reference later.
- **Operator:** Brian (the person maintaining the app and the content).

Scale is small — single-digit to low-double-digit new agents per cohort. This is what makes the auth + multi-user direction the wrong shape.

## Success Criteria

- An agent moving through onboarding sees checkboxes next to commitment-worthy items on each page and can check them off as they go.
- The progress indicator reflects *what's been acknowledged*, not just *what page you're on*.
- Refreshing the page or accidentally closing the tab does not wipe progress within the same browser.
- Hitting 100% completion produces a visible, satisfying moment (not just a static "100%").
- No login screen. No backend. No admin dashboard.
- The visual changes feel like an extension of the existing brand palette, not a new aesthetic layer bolted on.

## Scope

**In scope**
- Checkbox component, reusable across content pages, hydrated from markdown.
- Per-page identification of 1–4 commitment-worthy items (this is content work to be done alongside the build).
- Rework of `src/components/ProgressIndicator.jsx` from page-position % to completion %.
- `localStorage`-based persistence of: checked items + current page.
- Visual completion states: per-section, per-page, and overall 100%.

**Out of scope**
- Authentication, user accounts, password recovery.
- Server-side storage of any kind.
- Multi-device sync.
- Admin/visibility dashboard for who completed what.
- Gated navigation (i.e., blocking advance until all checks are done). Engagement is honor-system here.
- Email notification to Brian when an agent finishes. (Cheapest path if visibility later becomes a real need; not built now.)

## Decisions Made

- **Acknowledged, not gated.** Checkboxes are voluntary acknowledgment. Agents can advance freely. We are not building an LMS.
- **Persistence is `localStorage` only.** No accounts, no backend. The 10% of cases this fails on (different device, cleared cookies) are not the actual usage pattern and don't justify the cost.
- **Visual polish serves the engagement mechanism.** New visual work prioritizes feedback for completion states over general decoration. Existing brand palette (`brand-navy`, `brand-coral`, `brand-taupe`, `brand-cream`) is the source for any new color tokens.
- **Per-suggestion verdicts:** Suggestion 1 = adopt; Suggestion 2 = reject and replace with `localStorage`; Suggestion 3 = adopt as feedback layer for #1.

## Open Questions

- **Content:** Who identifies the 1–4 checkable items per page? (Brian, or someone else on the team?) This is a content decision, not a build decision, but it's a prerequisite.
- **Completion meaning:** Should "complete an onboarding page" require *all* checkboxes on that page, or just *any* checkbox? Default assumption: all checkboxes on a page → page complete. Confirm during planning.
- **Reset behavior:** Is there a "reset my progress" affordance for an agent who wants to re-do it cleanly? Default assumption: yes, small unobtrusive control. Confirm during planning.

## Dependencies / Assumptions

- The existing `Page.jsx` + markdown content pipeline (`content/page-N.md` rendered via `[[...page]].js`) stays as-is. Checkboxes are layered into the existing render, not a rewrite.
- `gray-matter` (already a dep) is sufficient to author checklist items in frontmatter or markdown if we choose that route; final encoding is a planning decision.
- Browser `localStorage` is available and not blocked (reasonable for the audience).
- Audience is small enough that "no backend visibility into who completed" is acceptable. If that changes (e.g., scaling to 50+ agents/year), the cheapest next step is a "Finish" button that emails Brian — not auth.

## Risks

- **Engagement theater.** Checkboxes that don't correspond to anything meaningful become noise. Mitigation: the per-page checkbox content is curated, not auto-generated from headings.
- **Scope creep toward an LMS.** Once checkboxes exist, the natural next ask is "now I want to see who finished" → which is the door to the auth path we just closed. Hold the line: completion visibility is out of scope; if it becomes a real need, revisit with an email-on-finish first.
- **`localStorage` drift.** If the set of checkable items changes after agents have already completed onboarding, stale state in their browser could either over-report or under-report. Mitigation: version the storage key; if the schema changes, treat stale state as empty.
- **Visual changes without a clear principle become noise.** The reframe (visual polish *in service of* engagement feedback) is what keeps this disciplined. Worth restating in the plan doc.

## Handoff to Planning

The technical decisions deliberately deferred to `/ce-plan`:
- Where checkable items live (markdown frontmatter? inline markdown syntax? separate JSON?).
- `localStorage` schema and versioning strategy.
- Whether to introduce a state management layer or keep it component-local with a custom hook.
- Specific completion animation / visual treatment.
- Component structure for the new completion states.
