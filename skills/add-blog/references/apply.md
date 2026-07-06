# apply — add-blog application details

Below, `$SKILL` refers to this skill's directory and `$PROJ` to the user's t3-flare project root.

## 1. Copy files

```bash
cp -R "$SKILL/files/src/." "$PROJ/src/"
npm run check:write   # align the copied-in files with the project's biome formatting
```
After copying, the project gains:
- `src/lib/{slug,lowlight,tiptap-extensions,tiptap-content}.ts` and `src/lib/render-article.tsx`
- `src/server/api/routers/article.ts`
- `src/app/admin/(dashboard)/articles/**` (list / new / [id] / _components)
- `src/app/articles/**` (list / [slug] / _components)

> `files/fragments/**` are not copy files — they must be **merged** into existing files (see below).

## 2. Prisma schema

Append the `Article` model from `files/fragments/article.prisma` to the end of `prisma/schema.prisma`, and add one line inside the existing `model User { ... }`:
```prisma
  articles      Article[]
```
(Prisma relations must be declared on both sides; without this line, `prisma generate` will error.)

## 3. Register the router (src/server/api/root.ts)

```ts
import { articleRouter } from "~/server/api/routers/article";
// ...
export const appRouter = createTRPCRouter({
  post: postRouter,
  article: articleRouter, // ← added
});
```

## 4. Admin navigation (app-sidebar.tsx)

Add one item to the `navItems` array (placing it right after Posts is fine), and make sure the icon you use (for example `Newspaper`) is imported from `lucide-react`:
```ts
{ title: "Articles", href: "/admin/articles", icon: Newspaper },
```

## 5. Styles (globals.css)

```bash
cat "$SKILL/files/fragments/prose-article.css" >> "$PROJ/src/styles/globals.css"
```

## 6. Dependencies

In `$PROJ`, add these (versions aligned with the template's React 19 / Next 15 ecosystem):
```bash
npm install \
  @tiptap/react@^3.27.1 @tiptap/pm@^3.27.1 @tiptap/starter-kit@^3.27.1 \
  @tiptap/extension-image@^3.27.1 @tiptap/extension-code-block-lowlight@^3.27.1 \
  lowlight@^3.3.0 highlight.js@^11.10.0
```
(`@tiptap/html` is not required — the public site uses `render-article`, not tiptap's HTML generator.)

After installing, **be sure to explicitly regenerate the Prisma client** (so the types include `article`; don't rely on postinstall alone — in practice there can be timing issues):
```bash
npx prisma generate
```

## 7. Migration (local + D1)

```bash
# Local: generate and apply the new migration (creates prisma/migrations/<ts>_add_article/)
npx prisma migrate dev --name add_article

# Take the migration SQL just generated and copy it as the next D1 migration file (numbering continues from the existing d1-migrations)
LATEST=$(ls -dt prisma/migrations/*_add_article 2>/dev/null | head -1)
NEXT=$(printf "%04d" $(( $(ls prisma/d1-migrations/*.sql | wc -l) + 1 )))
cp "$LATEST/migration.sql" "prisma/d1-migrations/${NEXT}_add_article.sql"

# Back up, then apply to the remote D1
npx wrangler d1 export <slug> --remote --output "backup-before-article.sql"
npm run cf:migrate
```

`prisma generate` reruns in `npm install`'s postinstall, producing a client that includes `article`; if it doesn't, run `npx prisma generate` manually.

## 8. Deploy + verify

```bash
npm run cf:deploy
```
- Open `/admin/articles` → add an article → type some text and insert a code block (pick a language) → toggle "Publish" on → create.
- Open `/articles` and you should see the article; click through to `/articles/<slug>` and you should see the body with **code highlighting**.
- Drafts (unpublished) are only visible at `/articles/<slug>` to a logged-in admin, and 404 when logged out — this is expected behavior.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails saying `article` doesn't exist on the prisma client | `prisma generate` didn't run: run `npx prisma generate`, then build again |
| Insert image 500 / upload fails | The project has no R2: add R2, or switch to plain text + code (see SKILL preflight item 2) |
| Worker too large / build blows up | Confirm `ArticleForm` loads `Editor` via `dynamic(..., { ssr:false })` (don't import it directly), to keep tiptap out of the server bundle |
| `/articles` is empty | An article must be "published" to appear in the public list; drafts don't count |
