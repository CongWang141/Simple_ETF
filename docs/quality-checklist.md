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
2. On `/etfs/USST01`, select each chart measure and move both range handles
   with pointer and arrow keys.
3. From the screener select two ETFs and open `/compare`; verify the tooltip
   highlights the vertically closest line and names the ETF before its value.
4. Narrow the browser window below 900px and 480px. Filter controls and
   comparison cards should stack; wide tables retain horizontal scrolling rather
   than hiding data.

The app has responsive breakpoints at 900px, 800px, and 480px. A live browser
review remains useful for visual polish because charts size themselves from
their rendered container.
