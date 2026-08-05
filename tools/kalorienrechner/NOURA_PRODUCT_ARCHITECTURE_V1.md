# NOURA Product Architecture 1.0

Status: **Frozen and binding**  
Date: 2026-08-02

## Product promise

NOURA helps a user understand what fits her, prepare her week and make a clear
decision today. The product is one continuous application, not a collection of
tools.

## User jobs

1. I want to know roughly how much I should eat.
2. I want to plan my week with fewer decisions.
3. I want to know what is relevant today.
4. I want to find meals that fit my life and plan.
5. I want to shop for the active plan.
6. I want to understand whether my current orientation works.

## Internal architecture and visible language

Internal terms never appear in product copy.

| Internal workspace | Visible language | User problem |
|---|---|---|
| Home Workspace | Heute | What matters today? |
| Calculation Workspace | Rechner | What is a credible starting range for me? |
| Nutrition Workspace | Rezepte | Which meals fit my life and plan? |
| Planning Workspace | Wochenplan | How do I reduce decisions across the week? |
| Shopping Workspace | Einkauf | What do I need for the active plan? |
| Cross-workspace feedback | Fortschritt | Is my current orientation working? |

## Shared mental model

```text
Orientierung → Woche planen → Heute handeln → Einkaufen
      ↑              ↑               ↓
      └──────── Fortschritt ← Alltag beobachten
                     ↑
                  Rezepte
```

The workspaces show different perspectives on shared product state. They do not
own independent copies of the same truth.

## Navigation contract

- Global navigation identifies a user-recognizable area.
- Local navigation identifies a step, detail or editing state inside that area.
- Wizard progress is never global navigation.
- Desktop may preserve a visible area navigation.
- Mobile prioritizes the current task and exposes no more than five primary
  destinations.
- A destination appears only when it represents a real, usable product area.

## State ownership

| Truth | Owning domain | Consumers |
|---|---|---|
| Personal orientation | Calculation | Heute, Wochenplan, Fortschritt |
| Recipe catalogue | Nutrition | Wochenplan, Heute, Einkauf |
| Active weekly plan | Planning | Heute, Einkauf, Fortschritt |
| Today's projection | Derived, not stored | Heute |
| Shopping items and completion | Shopping | Heute, Wochenplan |
| Observations and trends | Progress | Heute, Calculation |

## Change policy

Future features must derive from a documented user job, identify their owning
domain and consumers, and preserve the shared mental model. A new workspace is
allowed only when it solves a recurring independent user task that requires its
own orientation and working logic. Design-system and architecture changes must
be explicitly justified before implementation.
