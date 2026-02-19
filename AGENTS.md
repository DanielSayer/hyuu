- In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.

## Plans

- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. Sacrifice gramma for the sake of concision.

## Code Quality

### Reusability

- When writing utility functions always check for a scoped `./utils` file for existing utilities.
- Make utility functions small and reusable.

### Databasing

- When storing things in db, specifically `jsonb` columns, all data must be shape validated using zod on insert and retrieval.

### Interacting with external api

- In `@hyuu/intervals-icu-integration` any call to the external api, the shape of the response must be validated using zod schemas

### Code Structure

- Ensure to split code into files where appropriate, consider code layers and separation of concerns, do not have random utilities in files unless they are very specific.

### Typescript

- Never use `any` type. If you cannot determine the type, it is preferred to leave the typecheck failing than to use the `any` type to circumvent the typechecker
