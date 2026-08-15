# Quality checklist

## Automated checks

Run the following from the repository root:

```bash
npm run db:seed
npm test
npm run test:db
npm run lint
npx tsc --noEmit
npm run build
```

The unit tests cover database reads, screener filtering/sorting, total-return
normalization, common-history comparison, and comparison edge cases.

## Keyboard and layout review

The interface uses native links, buttons, selects, and checkboxes. They follow
normal Tab / Shift+Tab order, support Enter or Space where applicable, and have
a visible amber `:focus-visible` outline.

Before each handoff, run `npm run dev` locally and make this short review:

1. On `/`, Tab through each filter, reset button, sort controls, and ETF links.
2. On `/etfs/USP500`, Tab to the period buttons and activate one with Enter or
   Space.
3. On `/compare`, Tab through the ETF checkboxes; select two ETFs, then remove
   one to confirm the comparison guidance appears.
4. Narrow the browser window below 900px and 480px. Filter controls and
   comparison cards should stack; wide tables retain horizontal scrolling rather
   than hiding data.

The app has responsive breakpoints at 900px, 800px, and 480px. A live browser
review remains useful for visual polish because charts size themselves from
their rendered container.
