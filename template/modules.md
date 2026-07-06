# Optional modules (subtractive contract)

This template follows a "full-featured + subtractive trimming" approach: every module is
included by default and `build` is guaranteed to pass. Modules you don't need are **deleted**
rather than toggled off during generation. The removal steps are codified as scripts, and CI
verifies that both the "full-featured" and "after removal" paths build successfully, keeping
this contract from drifting out of sync with reality.

When scaffolding, the site-builder skill calls the corresponding script to trim based on the
user's requirements.

---

## R2 media module

Uploads images to Cloudflare R2 and serves them publicly at `/media/<key>`. It is decoupled
from Post CRUD and can be removed independently.

**How to remove**: run the following from the template root directory

```bash
bash scripts/remove-r2.sh
```

**footprint (the scope covered by the script, all marked `[module:r2]`)**

| Type | Path / Location | Action |
|---|---|---|
| Whole file | `src/server/r2.ts` | Delete |
| Whole directory | `src/app/media/` | Delete |
| Whole directory | `src/app/api/upload/` | Delete |
| Whole directory | `src/app/admin/(dashboard)/media/` | Delete |
| Block | `r2_buckets` in `wrangler.jsonc` (`[module:r2]`…`[module:r2:end]`) | Remove |
| Line | The `MEDIA` binding type in `cloudflare-env.d.ts` | Remove |
| Line | The media nav item in `src/app/admin/(dashboard)/_components/app-sidebar.tsx` | Remove |

After removal, the script runs `biome check --write --unsafe` to strip the now-unused imports
it creates and to normalize formatting.

**Dependency direction**: R2 depends on auth (uploading requires being logged in), but Post
CRUD / auth / dashboard do **not** depend on R2, so R2 can be safely removed. The reverse does
not hold (auth is the base and cannot be removed).
