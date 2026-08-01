# NOURA Styling Architecture

## Status

This document is the binding styling contract for the calculator and weekly
planner. Visual decisions remain governed by `NOURA_DESIGN_SYSTEM.md`.

## Dependency direction

```text
NOURA design tokens and rules
            ↓
shared product components
            ↓
screen composition
            ↓
temporary legacy compatibility
```

The product loads `noura-product.css` as its only stylesheet entrypoint. During
phase 1 the existing sources remain unlayered and keep their established order.
Browser regression testing demonstrated that they still contain specificity
dependencies; wrapping both wholesale in differently ranked layers changes
control geometry. Components therefore move into named layers only as each
screen is deliberately migrated and visually verified.

The design-system showcase loads `noura-design-system.css` directly. It must
never import calculator or planner styling.

## Current phase-1 boundary

- `calculator.css` is the temporary legacy feature layer. Existing selectors
  remain intact during foundation work to avoid visual and behavioral drift.
- `noura-design-system.css` is the current system and migration layer. Existing
  product selectors remain temporarily supported until their components are
  migrated screen by screen.
- `noura-product.css` is the stable public entrypoint and records the temporary
  compatibility order in one place.
- The phase-2 product shell is the first migrated component section inside the
  product entrypoint. It owns only the atmospheric-entry-to-workspace
  transition, uses the explicit product scope and adds no stylesheet request.
- `.noura-product` is the explicit product scope. New product rules must use
  that scope; `body:not(.ds-body)` is migration-only and must not be extended.

## Rules for new work

1. Use semantic `--noura-*` tokens; do not add feature-local colors, shadows,
   radii, type scales or spacing values.
2. A component owns its internal layout. Parents own external spacing and page
   composition.
3. Do not solve cascade conflicts with `!important`, IDs or longer selectors.
4. Add a shared primitive to the design system before using it in a feature.
5. Atmospheric imagery belongs to an atmospheric hero or a supporting media
   component, never to the default decision workspace.
6. Logic, DOM semantics and safety behavior are independent of visual layers.

## Migration completion criteria

The legacy layer can be removed only when calculator, guidance, results and
weekly planner have migrated to named product components, visual regression
coverage exists for their key states, and the complete functional suite passes.
