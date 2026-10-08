# Offences (עבירות) – SPFx web part

Shows the offences of the case that is open on the case page (tab "עבירות"), and lets the user search, filter,
add, edit and permanently delete them. Nothing else.

SPFx **1.21.1** (gulp toolchain) · React 17 · TypeScript · Fluent UI v8 · PnPjs v3 · Node.js 22 (>= 22.14, < 23)

> SPFx 1.22+ replaced gulp with Heft. 1.21.1 is the last gulp-based release, so `gulp serve` / `gulp bundle` work as usual.

## Project layout

```
config/serve.json                        initialPage = the dev site's workbench
config/package-solution.json             → sharepoint/solution/offences-webpart.sppkg
scripts/test-search.js                   npm run test:search (verifies utils/search.ts)
src/webparts/offences/
  OffencesWebPart.ts                     web part: setRTL(true), icons, services, property pane
  OffencesWebPart.manifest.json          title "עבירות", default properties
  config.ts                              list titles, column names, SECTION_FIELD, the 8 laws, defaults, color
  strings.ts                             all Hebrew UI text
  theme.ts                               scoped Fluent theme (#3560D8, fonts inherit from the page), button styles
  models/   Conviction.ts, Section.ts    TypeScript types
  utils/    search.ts                    smart search (pure functions)
            odata.ts, query.ts           OData quote escaping, case-insensitive query-string reader
  services/ CasesService.ts              resolveCase
            ConvictionsService.ts        getForCase, add, update, delete, findDuplicate, checkLawChoices
            LawSectionsService.ts        getSections(law) with per-law in-memory cache
            errors.ts, pnp.ts, index.ts  Hebrew error messages, PnPjs bound to the SPFx context
  components/
    OffencesApp.tsx                      states, table search + law filter, wiring
    OffencesToolbar.tsx, FilterCallout.tsx, OffencesTable.tsx, HighlightedText.tsx
    OffenceForm.tsx (Panel), SectionPicker.tsx, LawOption.tsx, DeleteConfirmDialog.tsx
    *.module.scss
```

## Run locally

```bash
npm ci
npx gulp trust-dev-cert      # first time only
npx gulp serve
```

`gulp serve` opens the hosted workbench of the dev site
`https://tikshuv.sharepoint.com/sites/msteams_3d9539R0-DEV/_layouts/15/workbench.aspx`.
Add the web part **עבירות** (group *Advanced*). The workbench has no case in its URL, so either:

- append `?caseId=<Cases item ID>` (or `?caseName=<case name>`) to the workbench URL, or
- open the property pane, fill **תיק לבדיקה** with a case ID or a caseName, and click **Apply**.

To debug on the real page while `gulp serve` runs, open the page with the debug query string, plus the case:
`https://tikshuv.sharepoint.com/sites/msteams_3d9539R0-DEV/SitePages/דף-הבית.aspx?debug=true&noredir=true&debugManifestsFile=https://localhost:4321/temp/build/manifests.js&caseId=<ID>`

Smart-search check (no SharePoint needed): `npm run test:search`

## Package

```bash
npx gulp clean
npx gulp bundle --ship
npx gulp package-solution --ship
```

Output: `sharepoint/solution/offences-webpart.sppkg`

## Deploy and add to the case page

1. Open the **App Catalog** (tenant app catalog, or the dev site's site-collection app catalog if it has one) →
   *Apps for SharePoint* → **Upload** `offences-webpart.sppkg`.
2. In the dialog click **Deploy**. The package allows tenant-wide deployment: either tick
   *Make this solution available to all sites*, or leave it unticked and add the app on the dev site
   (*Site contents → New → App → offences-webpart-client-side-solution*).
3. Open the case page → **Edit** → in the section of the "עבירות" tab click **+** → **עבירות** → **Republish**.
4. Links that open the case page must carry `?caseId=<Cases item ID>` (or `?caseName=<name>`). The two parameter
   names can be changed in the web part's property pane.

Updating later: raise `solution.version` in `config/package-solution.json`, package again, upload and replace.

## Behaviour in short

- **Case**: URL `caseId` → URL `caseName` → property "תיק לבדיקה" (ID first, then caseName). Resolved once to the
  Cases item ID; offences are loaded with `caseRef/Id eq <id>`. Nothing given → "לא נבחר תיק"; a given caseName
  (or test value) that does not exist → an error message.
- **Sections**: a law's list is read only when that law is chosen (`items.select('Id','Title').getAll()`), kept in
  memory per law, in SharePoint's default (ID) order.
- **Smart search** (`utils/search.ts`): normalize (lowercase, no niqqud, no `" ' ״ ׳`, dashes → space, collapsed
  spaces); every query token must be a substring, in any order. The section picker also ranks; the table only filters.
- **Save**: law and section are required ("יש לבחור חוק וסעיף"); a duplicate (same law and section text on the same
  case, the edited item excluded) is refused ("עבירה זו כבר קיימת בתיק"); `items.add({ caseRefId, lawSource, section, details })`.
- **Delete**: confirmation dialog, then `item.delete()` – permanent, not `recycle()`.

## Assumptions to check

1. All lists are in the **same site as the page** (PnPjs uses the SPFx context's web). List **titles** (not URLs) are
   `Cases`, `Convictions` and the eight law-list titles in `config.ts`.
2. Internal column names are exactly `caseName`, `caseRef`, `lawSource`, `section`, `details`, and the law lists'
   label is `Title`. `caseRef` is a **single-value** lookup (written as `caseRefId`).
3. The `lawSource` Choice values equal the `config.ts` strings. On load the web part compares them with the real
   choices and writes a `console.warn` per mismatch (F12 → Console, filter `[Offences]`).
4. `Convictions.Title` is **not required**. If SharePoint rejects an add because of Title, the add is retried once
   with `Title = section text` and a `console.warn` says so. (SharePoint REST usually does not enforce required
   columns, so this may never happen.)
5. If `Convictions` grows beyond 5,000 items, the `caseRef` column must be **indexed**, or the `caseRef/Id eq` filter
   hits the list view threshold. `caseName` is unique, so it is already indexed.
6. Each law list's default (ID) order is the order of its sections, and its Title holds the full label
   ("סעיף N - …"). Empty titles are skipped.
7. Users have **read** on Cases and the law lists, and **add/edit/delete** on Convictions. The web part only uses
   SharePoint permissions; a refused action shows a Hebrew "no permission" message.
8. The site is Hebrew/RTL. Fluent's `setRTL(true)` also sets `dir="rtl"` on the page's `<html>`; on an English
   (LTR) site that would flip the page.
9. Query-string names are matched case-insensitively (`caseid` = `caseId`).
10. A `caseId` that does not exist is skipped (console.warn) and the next source is tried; with no other source the
    user sees "לא נבחר תיק", not an error. Tell me if you prefer an error there.
11. A numeric "תיק לבדיקה" value is tried as an item ID first, then as a caseName.
12. The duplicate check is a server query (`eq`, which SharePoint compares case-insensitively) on the exact section
    text. It is not atomic: two users saving the same offence at the same moment could both succeed.
13. "Permanent" delete: `item.delete()` skips the recycle bin. Retention policies (Purview), if any, may still keep
    a copy; users cannot restore it.
14. When the search/filter hides every row (but the case has offences), the gray bar says
    "לא נמצאו עבירות התואמות את החיפוש" instead of "אין נתונים זמינים". This text was my choice.
15. Ranking refinement: inside "a token equals a whole word" I put items where **every** token is a whole word first,
    so the query "סעיף 12" ranks "סעיף 12" above "סעיף 112" (the word "סעיף" matches both). Otherwise exactly
    whole word → starts with → rest, source order inside each rank.
16. Normalization also treats the Hebrew maqaf (־) and Unicode dashes as hyphens, and removes typographic quotes
    (“ ” ‘ ’) next to `" ' ״ ׳`.
17. An offence whose saved law is not one of the eight laws opens in edit with a hint; its law and section are kept
    unless the user picks a law.
18. Icons are Fluent MDL2 icons from Microsoft's CDN (`initializeIcons()`), as usual in SharePoint Online.
19. Supported hosts: SharePoint page and full-page app only (the Teams tab/personal-app hosts from the template
    were removed). A Teams tab that shows the SharePoint page still works.
20. Property-pane changes apply with the **Apply** button (non-reactive), so the case is not re-resolved on every key.
21. Not tested against the real tenant (the build environment cannot reach it). It was tested in Chromium against a
    fake of the SharePoint REST API: case resolution, loading, search, filter, add, picker (780 sections), duplicate,
    required, edit (incl. legacy text), delete, 403/network/500 errors, Title fallback, Choice mismatch.

## Visible differences from the reference images

1. **Info icon in the gray bar** is at the **left** end (your text); the screenshot shows it at the right end. The
   text sits next to it at the left, as in the screenshot. One CSS line (`.emptyBar` `justify-content`) changes it.
2. The small colored icon right of "אין נתונים זמינים" in the screenshot is not shown (its meaning is unknown).
3. The search box is a single pill border, about 300 px wide; the screenshot shows a pill with an inner second border.
4. Icons are Fluent MDL2 (thinner/older set) rather than the Fluent 2 icons of the host page: *SortLines* (three
   decreasing lines, like the screenshot) for filter, *Refresh*, *Add*, *Edit* (pencil), *Delete* (trash).
   The filter button is highlighted blue while a law filter is active.
5. In the law dropdown and the section list the **check mark is at the right and text right-aligned** (RTL).
   The guide images show a left-aligned, LTR-style list with the check mark at the left.
6. The law dropdown has no "Find items" search box (it has only 8 items); the section picker has a Hebrew search box
   ("חפש/י סעיף...") with a result count and highlighted matches.
7. The add/edit form is a Fluent side Panel that opens from the left (the far side in RTL), 480 px wide.
