# Isolated sample demo

## Open the demo

- Live: <https://maintenance-proof-book.sociobot.in/demo>
- Local: <http://127.0.0.1:4173/demo> after `npm run build && npm run preview`
- Compatibility entry: `/?demo=1`

The landing page opens the demo in one click with **Try it with sample data**.

## Sample data

The demo opens a fictional property at 24 Willow Lane with three completed repairs:

1. Roof vent flashing, with a generated sample photo and fictional PDF receipt.
2. Heat-pump service, with a fictional PDF service report.
3. Kitchen tap cartridge replacement, with a fictional PDF invoice.

Every sample repair has contractor, vendor or part, cost, evidence, next action, and next due date data.

## Storage boundary

Demo mode uses the IndexedDB database `demo:maintenance-proof-book`. Real use uses `maintenance-proof-book`. Demo mode does not read the real database or the real license values in localStorage.

**Reset demo** clears only the demo database and restores the original three repairs. **Start for real** clears the demo database before opening the real book. Nothing edited in the demo is copied to real data.
