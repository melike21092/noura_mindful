# NOURA Product Implementation Plan

This plan translates `NOURA_PRODUCT_ARCHITECTURE_V1.md` into product work. It
does not authorize visual-system changes or changes to calculation and safety
logic.

## 1. Shared product foundation

### Required components and services

| Element | Reuse | New responsibility |
|---|---|---|
| App Shell | Existing `.page-shell`, brand and product scope | Stable area navigation, workspace outlet, responsive shell state |
| Area Navigation | Existing brand-home and back-button semantics | Visible labels, active state, desktop/mobile presentation |
| Workspace Header | Existing section header, eyebrow and heading rules | Area title, local status, contextual actions |
| Local Flow Header | Existing progress and back controls | Step text, progress, exit/return context |
| View State | Existing notices, errors and empty-state rules | Shared Empty, Loading, Error and Success contract |
| Action Bar | Existing primary, secondary and tertiary actions | Stable action ordering and async state |
| Metric Group | Existing metric and planner-budget patterns | Primary/supporting metric hierarchy |
| Interactive Row | Existing situation, direct-choice and form-choice rows | Shared selection and navigation row API |
| Product Store | None | Single versioned state, selectors, commands and subscriptions |
| Storage Adapter | Existing weekly-plan localStorage pattern | Versioning, validation, migration and recoverable failures |
| Workspace Coordinator | Existing hidden-section switching | URL/history-aware area and local-state transitions |
| Focus/Announcement Manager | Existing heading focus and aria-live patterns | Consistent focus restoration and transition announcements |

### Shared state shape

```js
{
  schemaVersion,
  orientation: null | {
    status, updatedAt, input, result, sourceVersion
  },
  activePlan: null | {
    status, updatedAt, dailyTarget, breakfastPreference,
    recipeIds, days, sourceOrientationVersion
  },
  shopping: null | {
    planVersion, items, completedItemIds, updatedAt
  },
  progress: {
    observations, lastReviewAt
  },
  ui: {
    activeArea, localState, returnContext
  }
}
```

`today` is always derived from the active plan and the local date. Recipe data
remains catalogue data, not duplicated in product state.

### Shared commands

- `completeOrientation(result)`
- `updateOrientation(result)`
- `createPlan(config)`
- `replacePlan(plan)`
- `selectPlanDay(date)`
- `addRecipeToPlan(recipeId, context)`
- `replacePlannedRecipe(context, recipeId)`
- `deriveShoppingList(plan)`
- `toggleShoppingItem(itemId)`
- `recordObservation(observation)`
- `navigateTo(area, context)`

Commands own validation and state change. Components render state and issue
commands; they do not synchronize domains directly.

## 2. Home Workspace — visible label: Heute

### Purpose

Answer within seconds: what is relevant today and what is the next useful
action?

### Components

**Reuse**

- Product Shell and brand anchor
- Section/Workspace Header
- existing metric presentation
- existing weekly day data
- notice and CTA patterns
- recipe summary metadata

**New**

- `TodaySummary`
- `TodayMealList`
- `PreparationNotice`
- `NextBestAction`
- `TodayPlanStatus`

### Owned data

No independent meal plan. Only ephemeral UI state such as expanded meal or
selected date.

### Reads

- active weekly plan
- recipe catalogue
- current orientation range
- incomplete shopping count
- latest progress review status

### Shared-state actions

- open today's planned meal in Rezepte
- open today's day context in Wochenplan
- mark a preparation prompt acknowledged if that behavior is later required
- navigate to planning when no plan exists

### Transitions

- Heute → Wochenplan with today's date as context
- Heute → Rezepte with recipe ID and return context
- Heute → Einkauf with active plan version
- Heute → Rechner when orientation is missing or needs review

### Required states

- **Empty:** no orientation; orientation exists but no plan; plan has no entry
  for today. Each state offers one relevant next action.
- **Loading:** shell remains stable; summary and meals use reserved regions.
- **Error:** invalid stored plan or recipe reference; explain recovery without
  losing unrelated state.
- **Success:** active day available; actions are ready. Avoid generic success
  banners.

## 3. Calculation Workspace — visible label: Rechner

### Purpose

Provide a safe, credible starting range and explain what the user should do
next.

### Components

**Reuse**

- entire calculator engine in `calculator.mjs`
- existing safety gate and guidance logic
- Product Shell, Local Flow Header and progress
- Numeric Field, Choice Row, Inline Error and Action Bar
- existing result metrics, range and disclosures

**New**

- `OrientationSummary`
- `OrientationStatus`
- `OrientationVersionNotice`
- `ReviewOrientationAction`
- adapter that maps the existing result into shared product state

### Owned data

- normalized calculator input
- safety mode and relevant confirmations
- calculation result and assumptions
- calculation timestamp and schema/source version

Sensitive inputs remain local unless a separate privacy decision explicitly
authorizes persistence. The MVP may persist only the minimum derived values
required by planning.

### Reads

- latest progress review, when available
- active plan version to detect whether a changed orientation affects it

### Shared-state actions

- complete orientation
- update orientation
- confirm whether an existing plan should keep or adopt a new target

### Transitions

- Rechner result → Wochenplan with orientation context
- Fortschritt → Rechner in review mode
- Rechner → Heute after a completed update

### Required states

- **Empty:** no orientation; start the existing safe flow.
- **Loading:** calculation submission holds action width and announces work.
- **Error:** field errors remain inline; engine/persistence failure does not
  erase entered values.
- **Success:** result is available and next action is explicit; avoid a global
  congratulatory state.

## 4. Nutrition Workspace — visible label: Rezepte

### Purpose

Help the user find a meal that fits her current planning context.

### Components

**Reuse**

- `RECIPES`, calorie classes and recipe lookup helpers
- existing card, badge, interactive row and metadata primitives
- existing planner compatibility functions

**New**

- `RecipeCollection`
- `RecipeSummary`
- `RecipeDetail`
- `RecipeMetadata`
- `RecipeFilterBar` only when the catalogue requires it
- `PlanPlacementAction`
- `RecipeContextNotice`

### Owned data

- recipe catalogue and catalogue schema
- recipe metadata and availability
- later: ingredients and preparation information

The current catalogue does not contain ingredients or preparation instructions.
This is a real data dependency, not a UI gap.

### Reads

- current orientation for contextual suitability
- active weekly plan for planned status
- placement context from Wochenplan or Heute

### Shared-state actions

- add or replace a recipe in the active plan
- return the selected recipe to the requesting planning context

### Transitions

- Rezepte → Wochenplan with selected recipe and placement context
- Wochenplan → Rezepte with session/day constraints
- Heute → recipe detail with today's meal context
- recipe detail → Einkauf only after ingredient data exists

### Required states

- **Empty:** no recipes match the current context; allow criteria adjustment.
- **Loading:** catalogue or detail placeholders preserve list geometry.
- **Error:** catalogue unavailable or referenced recipe removed; keep return
  context.
- **Success:** recipe selected or inserted; communicate exact destination.

## 5. Planning Workspace — visible label: Wochenplan

### Purpose

Reduce weekly decisions through a small number of cooking and distribution
choices.

### Components

**Reuse**

- `weekly-planner.mjs` calculations, validation and persistence schema
- existing planner flow, budget metrics and choice controls
- existing generated `weekly-plan-day` content
- recipe compatibility helpers

**New**

- `PlanStatusGroup`
- `CookingSessionEditor`
- `WeekOverview`
- `DaySummary`
- `DayDetail`
- `PlanChangeSummary`
- adapter between current planner output and shared product state

### Owned data

- active plan configuration
- generated seven-day plan
- plan version and updated timestamp
- source orientation version

### Reads

- current orientation target
- recipe catalogue
- later: shopping status for plan-impact notices

### Shared-state actions

- create, save or replace plan
- replace a planned recipe
- select a day
- request shopping-list regeneration after a plan change

### Transitions

- Wochenplan → day detail inside the same workspace
- Wochenplan → Rezepte with placement context
- Wochenplan → Einkauf with active plan version
- Wochenplan → Rechner when no valid orientation exists
- Wochenplan → Heute after plan completion

### Required states

- **Empty:** no orientation; orientation exists but no plan.
- **Loading:** plan generation or persisted-plan restoration.
- **Error:** invalid combination, outdated recipe ID, corrupted persisted plan or
  save failure. Preserve valid selections.
- **Success:** plan created/saved/updated; state feedback names the actual
  consequence, including shopping updates when applicable.

## 6. Shopping Workspace — visible label: Einkauf

### Purpose

Translate the active plan into a usable shopping action.

### Components

**Reuse**

- Product Shell, Workspace Header, status and notice patterns
- checkbox semantics and 44px interaction targets
- active plan and recipe lookup

**New**

- `ShoppingList`
- `ShoppingGroup`
- `ShoppingItem`
- `ShoppingProgress`
- `ItemOriginDisclosure`
- `ShoppingPlanVersionNotice`
- deterministic shopping-list derivation service

### Owned data

- derived shopping items for a specific plan version
- completion state per item
- optional manually added items only in a later phase

### Reads

- active weekly plan
- recipe ingredients and quantities
- recipe catalogue version

The current recipe model has no ingredient or quantity data. A meaningful
shopping workspace therefore depends on a versioned ingredient schema and
validated recipe content.

### Shared-state actions

- derive list from active plan
- toggle item completion
- accept regeneration after plan change

### Transitions

- Einkauf → Wochenplan with originating session/day context
- Einkauf → Rezepte with item/recipe origin
- Wochenplan → Einkauf after a valid plan exists

### Required states

- **Empty:** no plan; plan exists but ingredients are unavailable; all items
  completed. These are different states with different next actions.
- **Loading:** list derivation or storage restoration.
- **Error:** incomplete recipe data, stale plan version or persistence failure.
- **Success:** list ready; item toggles update inline; regeneration explicitly
  explains whether completed items can be preserved.

## 7. Progress — cross-workspace capability

### Purpose

Help the user decide whether her current orientation works in real life.

### Components

**Reuse**

- existing 21-day-test guidance
- notices, metric roles and disclosure components

**New**

- `ObservationEntry`
- `TrendSummary`
- `ReviewPrompt`
- `OrientationReviewLink`

### Owned data

- dated observations
- optional aggregated trend
- last review timestamp

### Reads

- orientation version and date
- active plan period

### Shared-state actions

- record observation
- start orientation review

### Required states

- **Empty:** explain what becomes useful after enough observations.
- **Loading:** trend derivation.
- **Error:** invalid entry or persistence failure without losing draft input.
- **Success:** observation recorded inline; trend shown only when meaningful.

Progress remains contextual until it supports a sufficiently independent and
recurring user task to justify primary navigation.

## 8. Cross-workspace transition contract

Every transition carries:

```js
{
  from,
  to,
  intent,
  entityId,
  placementContext,
  returnContext
}
```

The destination uses this context to focus the relevant entity and provide a
predictable return. Global navigation may discard local placement context only
after an explicit user choice.

## 9. Delivery phases

### Phase A — indispensable MVP

1. Versioned Product Store and Storage Adapter
2. State selectors and commands
3. App Shell with responsive Area Navigation
4. Workspace Coordinator, history and focus management
5. Shared View State, Action Bar, Workspace Header and Local Flow Header
6. Calculation adapter preserving the complete existing safety flow
7. Orientation Summary and persisted minimum planning target
8. Planning adapter preserving the existing planner engine
9. Plan Status Group, Week Overview and Day Summary
10. Basic Heute workspace derived from the active plan
11. Empty/error recovery for missing orientation, plan and invalid storage
12. Integration and migration tests across Rechner → Wochenplan → Heute

Visible navigation in Phase A exposes only usable areas: Heute, Wochenplan and
Rechner.

### Phase B — useful Version 1

1. Recipe Collection, Summary and Detail
2. plan-placement context between Rezepte and Wochenplan
3. Day Detail with recipe links
4. versioned ingredient and quantity schema
5. Shopping derivation service and Shopping Workspace
6. plan-change impact handling for shopping items
7. contextual progress observations and orientation review
8. expanded navigation for Rezepte and Einkauf once complete
9. offline/loading behavior and storage migration coverage

### Phase C — later

1. independent Progress area if usage validates it
2. advanced recipe filters and substitutions
3. manual shopping items and quantity adjustments
4. cross-device or account synchronization
5. richer preparation guidance
6. notifications and reminders
7. historical plan comparison

Phase C items require separate user-value and privacy validation. They are not
implied by Architecture 1.0.

## 10. Dependency map

```text
Design system contracts (frozen)
        │
        ├── View State / Action Bar / Workspace Header
        │         └── all workspaces
        │
        ├── Product Store + Storage Adapter
        │         ├── Calculation adapter
        │         ├── Planning adapter
        │         ├── Shopping state
        │         └── Progress state
        │
        ├── Workspace Coordinator + Focus/History
        │         └── App Shell + Area Navigation
        │                    └── all workspace transitions
        │
        ├── Recipe Catalogue API
        │         ├── Recipe components
        │         ├── Planning engine
        │         ├── Heute meal summaries
        │         └── Shopping derivation
        │
        ├── Calculation engine (existing)
        │         └── Orientation state
        │                    ├── Planning
        │                    ├── Heute
        │                    └── Progress
        │
        └── Planning engine (existing)
                  └── Active plan state
                             ├── Heute
                             ├── Day detail
                             ├── Einkauf
                             └── Progress context
```

## 11. Efficient implementation order

1. Freeze state schemas and ownership rules.
2. Build Product Store, Storage Adapter and selectors with tests.
3. Build Workspace Coordinator, focus restoration and transition context.
4. Assemble App Shell from existing design-system components.
5. Adapt the current calculator result into orientation state without touching
   calculation or safety logic.
6. Adapt the existing weekly planner into active plan state.
7. Build shared Metric Group, Day Summary and View State contracts.
8. Build Heute as the first proof that two domains produce one coherent user
   experience.
9. Build Week Overview and Day Detail on the same day data contract.
10. Add Recipes as a reusable catalogue workspace and planning dependency.
11. Extend recipe data with ingredients only after the schema is validated.
12. Build shopping derivation and Einkauf.
13. Add progress observations and review loops.

The first end-to-end product slice is therefore:

```text
Rechner abschließen → Orientierung speichern → Woche erstellen
→ heutigen Tag unter Heute sehen → zurück in den Wochenkontext wechseln
```

This slice validates shared state, navigation, transitions, persistence and
cross-workspace coherence before adding more catalogue or shopping scope.
