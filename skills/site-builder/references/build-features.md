# build-features — implementing features on the template's rails

When to use: Phase B (implementing the interview's requirements after the site is up), and any later "help me add an ○○ feature" request.
**Every feature runs the same rails; no detours allowed.** Blog/article needs are the exception — use the ready-made `skills/add-blog/`, don't reinvent it.

## Data-storage rules (must not be violated)

| Need | Always use | Forbidden |
|---|---|---|
| Structured data (bookings, courses, rosters, orders…) | Prisma model + D1 (`ctx.db`) | localStorage, JSON files, in-memory variables, storing business data in cookies |
| Uploaded files / images | R2 (`putObject` from `~/server/r2.ts`, via `/api/upload`) | local disk, base64 stuffed into the DB |
| Login / permissions | the existing better-auth; dashboard writes use `protectedProcedure` | homemade sessions, plaintext passwords, unprotected write endpoints |
| Public-facing reads | `publicProcedure` | sending the whole admin dataset to the frontend and filtering there |

## The rails: one round per feature (in order, no skipping)

### 1. Data model — `prisma/schema.prisma`

Add a model in the style of the existing `Post` model; when relating to `User`, remember to add the reverse field inside `model User` (Prisma relations must be declared on both sides).

### 2. Migration (dual-track: local + D1)

```bash
git add -A && git commit -m "before: add <feature>"     # guardrail: save a checkpoint first
npx prisma migrate dev --name add_<feature>              # local migration + regenerate the client

# Copy the same SQL as the next D1 migration file (numbered continuing from the existing files in prisma/d1-migrations/)
LATEST=$(ls -dt prisma/migrations/*_add_<feature> | head -1)
NEXT=$(printf "%04d" $(( $(ls prisma/d1-migrations/*.sql | wc -l) + 1 )))
cp "$LATEST/migration.sql" "prisma/d1-migrations/${NEXT}_add_<feature>.sql"

# Back up, then apply to the production database
npx wrangler d1 export <name> --remote --output backup-before-<feature>.sql
npm run cf:migrate
```

If the types didn't update (`ctx.db.<model>` doesn't exist), run `npx prisma generate` manually.

### 3. API — `src/server/api/routers/<feature>.ts`

Build the router with tRPC (template: `src/server/api/routers/post.ts`): public reads use `publicProcedure`, any writes/management use `protectedProcedure`. Once done, import it in `src/server/api/root.ts` and register it into `appRouter`.

### 4. UI

- **Admin dashboard page**: `src/app/admin/(dashboard)/<feature>/` — follow the CRUD pattern of `posts/` (page + `_components/`), and add an item to `navItems` in `_components/app-sidebar.tsx`.
- **Public-facing page**: `src/app/<feature>/` — a server component fetches data via `~/trpc/server`; split the interactive parts (forms, buttons) into a client component using `~/trpc/react`.
- Always use the ready-made `~/components/ui/*` (shadcn) for UI; don't bring in another UI library.

### 5. Preview → deploy

```bash
npm run dev        # have the user open localhost:3000 to review (local uses separate test data)
npm run cf:deploy  # go live after the user signs off
```

After deploying, actually exercise the feature once on the **production URL** (create a record, walk through a user flow) before considering it done.

## Example: how "students booking class sessions" lands on the rails

1. **model**: `Course` (title, teacher, capacity, startsAt) and `Booking` (courseId relation, studentName, email, createdAt, `@@unique([courseId, email])` to prevent duplicate bookings)
2. **migration**: `add_booking` follows the dual-track flow above
3. **router**: `course.list` (public, lists only non-expired), `booking.create` (public, checks capacity inside a transaction), `course.*` CRUD and `booking.list` (protected, for the dashboard)
4. **UI**: public `/courses` list + booking form; dashboard `admin/courses` to manage courses and view the booking roster
5. preview → deploy → make a real booking on the live site to verify

Any state that "looks like the frontend could handle it on its own" (e.g. selected course, sign-up roster) — as long as it **still needs to exist after the browser is closed** — is structured data → goes into D1, no exceptions.
