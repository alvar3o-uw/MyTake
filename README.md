# MyTake

A personal home for the media I watch and the opinions I form along the way.

[Open MyTake](https://usemytake.vercel.app)

## Why I'm building this

I love consuming media, but I enjoy picking it apart just as much. I like thinking critically about what worked, what didn't, and why one story stays with me while another doesn't. Sometimes an 8 or a 9 doesn't quite capture how I feel. I want to be able to give something an 8.8 and have a place for the reasoning behind it.

Until now, that place has been my notes app. MyTake is my attempt to build something better suited to how I watch and think about movies, TV shows, and anime.

This is also my first side project. I'm starting with little to no full stack development experience, and I want to learn by building and deploying something I'll actually use. The goal is a useful personal tool and a project whose design and code I can understand, explain, and improve.

## The first version

The MVP will focus on keeping a private record of my viewing and ratings:

- Track movies, TV shows, and anime in a personal library.
- Give media decimal ratings from 0–10 in steps of 0.1, such as 9.3 or 8.8.
- Rate individual episodes, seasons, and story arcs as well as an overall series.
- Rate a series before finishing it, with the score representing my opinion through a particular episode.
- Organize and browse the library using categories.
- Keep each user's ratings private, with no access to other users' ratings in the MVP.

For example, I should be able to rate a series **8.7 through season 2, episode 5**, then update that opinion as I keep watching. An episode rating and an overall series rating serve different purposes; one shouldn't have to determine the other.

Folders are outside the MVP. Ratings use a 0–10 scale in steps of 0.1. Category behaviour still needs to be settled.

## Tech stack

The website is being built with TypeScript, React, Next.js, and CSS Modules. Supabase Auth, profiles, and private library storage are connected. The website is deployed on Vercel at [usemytake.vercel.app](https://usemytake.vercel.app).

| Technology | Purpose | Status |
| --- | --- | --- |
| TypeScript | Typed entries, form logic, and server-side authentication actions | In use |
| React and Next.js | Pages, shared components, client state, routing, and server actions | In use |
| CSS Modules | Component styles, alongside shared global CSS | In use |
| ESLint | Automated code checks | In use |
| Git and GitHub | Version control and project history | In use |
| OpenAI Codex | Development assistance within a structured learning workflow | In use |
| PostgreSQL through Supabase | Private profiles, media snapshots, library ratings, and episode progress | In use |
| Supabase Edge Functions | Protected account deletion using the Auth admin API | In use |
| Supabase Auth | Email/password accounts, cookie sessions, and protected library access | Connected |
| TMDB API | Title search, media identities, release years, and posters | Connected |
| Vercel | Website hosting and production builds | Deployed |

A good-looking, comfortable interface matters to me alongside the functionality. I want MyTake to feel like a place I enjoy returning to, rather than just a form for entering scores.

## How I'm learning with Codex

I'm using Codex as a teacher and development assistant, guided by a set of project instructions and continuity notes I developed around how I want to learn. The aim is to build software I understand, rather than simply receive a finished application.

For new concepts and meaningful features, the workflow is to explain the purpose, trace how information moves through the system, compare tradeoffs, and work through one small piece at a time. It leaves room for me to write code, explain a choice, or investigate a problem, with feedback on my attempt. For bounded tasks such as styling changes or routine edits, Codex can implement the changes and explain what changed and how it was checked.

I own the goals and consequential design decisions. Codex is expected to challenge weak assumptions, distinguish recommendations from agreed choices, and record decisions, checks, and learning checkpoints so later sessions can pick up where we left off. I review changes before committing and publishing them. AI assistance is part of the process; generated code by itself isn't evidence that I've learned the underlying concept.

## Beyond the MVP

I want to release a mobile app on the App Store after the website is useful. The likely direction is a separate mobile interface that shares the website's backend and accounts; the mobile technology hasn't been chosen yet.

Manga, novels, and ways to share ratings with other people may come later. For now, the priority is getting the core personal tracking experience right.

## Current status — MyTake v1

MyTake runs locally and on Vercel with a public homepage, account pages, and a protected personal library. The design uses a single dark theme, coral accents, rounded controls, and consistent line icons. Locally hosted Nunito gives the interface a playful, rounded feel, while the serif wordmark stays distinct. The font and its SIL Open Font License are in `app/fonts/`. The coral exclamation mark from the `mytake!` wordmark also serves as the browser-tab icon on a charcoal background; the rest of the interface is kept clean. Profiles use unique usernames and an initials avatar.

| Page | What works today |
| --- | --- |
| `/` | Product introduction, sample collection, and links to Sign In and Sign Up |
| `/sign-up` | Email/password submission, password confirmation, pending states, and styled confirmation/error messages |
| `/sign-in` | Email/password submission, pending states, password-recovery link and styled error/success messages |
| `/forgot-password` | Private reset-email request with neutral account-existence messaging |
| `/reset-password` | Authenticated new-password/confirmation form and sign-in after reset |
| `/profile` | Private username/avatar header, manually chosen favourites, highest-rated titles, and movie/TV filters |
| `/profile/setup` | Username selection after signing in for accounts without a profile |
| `/settings` | Change your username, return to the library after saving, or permanently delete your account after confirmation |
| `/library` | Server-checked access, TMDB title search/selection, saved personal cards, All Media / Movies / TV Shows filters, rating/alphabetical sorting, an updating title count, and a profile dropdown |
| `/media/[type]/[id]` | Private library title details, synopsis, genres, movie runtime, saved take, and Edit Entry |
| `/media/tv/[id]/episodes` | Season/Specials browsing and private per-episode ratings with explicit row saves |
| `/watchlist` | Private saved titles, catalogue search, movie/TV filters, and confirmed move/remove actions |
| `/about` | TMDB credits and required attribution |

### Adding media

The personal library starts empty and displays only my saved entries. The Add Media dialog searches TMDB as I type and lets me select a movie or TV result with its poster and release year, then choose Completed (the default) or In Progress and enter an optional rating. For an in-progress show, I can select the last episode watched from TMDB season and episode lists; the card displays that progress. A typed title alone cannot be added without selecting a catalogue result. Missing titles, out-of-range scores, and ratings that don't follow 0.1 steps produce inline errors. Valid entries appear as new cards only after the database confirms the save. Pending saves disable the form; failed or uncertain saves preserve the selections and show an error. Retrying the same request cannot create a second entry. Adding a title already in my library shows a message instead of overwriting its rating. Blank ratings display an Unrated badge; a rating of 0 stays a real score.

The server loads saved entries for the verified account; the parent library component owns their displayed list. The dialog saves through a server action and passes the confirmed database entry back through a callback, then React renders the updated collection. A sorting dropdown defaults to highest rating first, with lowest rating first and alphabetical A–Z / Z–A options. Unrated entries come first in ascending order and last in descending order.

Entries are saved to my Supabase account: **refreshing the page keeps the library, ratings, and viewing progress**. Selected cards use TMDB posters when available, with a title cover as fallback when no poster is supplied. The public homepage keeps its illustrative sample collection.

### Editing and removing entries

Each saved library card has a three-dot menu with **Open**, favourites, **Edit Entry**, and **Remove from Library** actions. Open provides another route to the title's media overview. Edit Entry opens with the saved rating, viewing status, and episode progress; the selected media stays fixed. I can change or clear a rating, update the last episode watched, or mark the title completed. Cancel discards the draft. Saving updates the existing card and its sort position only after database confirmation. Library filters and sorting are reflected in the URL, and scroll position is retained in browser-session storage for returning to the same view.

Removal asks for confirmation and names the title, explaining that its rating and viewing progress will be deleted. The card disappears only after confirmed removal. Failed or uncertain edits/removals show an error rather than assuming success.

### Watchlist

My Watchlist keeps movies and TV shows I want to watch, with A–Z (the default) and Z–A sorting options alongside All Media / Movies / TV Shows filters. Adding a title uses the same TMDB search without asking for a rating or viewing progress. Cards offer **Move to Library** and **Remove from Watchlist** in their three-dot menu.

Moving opens the rating/status form with Completed selected initially. I can choose In Progress, select an episode for a show, and leave the rating blank if I want. The database saves the library entry and removes watchlist membership together: a failed save keeps the title on the watchlist. A title cannot belong to both collections. Removal asks for confirmation; account deletion clears both collections.

### Accounts

Supabase handles email/password authentication. Sign-up checks that passwords match and contain at least eight characters. Confirmation emails return to the app, and the server checks the session before rendering the library. Signed-out visitors are sent to Sign In. Sessions are maintained using cookies, with server-side refresh handling.

Profiles are stored in Supabase PostgreSQL, separately from authentication credentials. Each profile links its account ID to a unique username: 3–20 lowercase letters, numbers, or underscores. Database constraints enforce these rules, and row-level security restricts profile reads and changes to the account owner. No timestamp field is used.

After signing in, accounts without a profile choose a username before entering the library. The initials avatar opens a dropdown with the username, Settings, and Sign Out. Settings saves username changes to the database and returns to My Library with a confirmation that disappears after three seconds. Settings also includes permanent account deletion behind a confirmation dialog. The dedicated support sender uses the MyTake `!` as its Google profile image; user avatars remain initials-based for now.

### Catalogue direction

I want to select real catalogue entries instead of manually entering titles and media types. TMDB now supplies that search and selection flow, including posters and episode lists. I checked representative anime listings and accepted their organization for now; the library now uses movie/TV filters, while broader category behavior remains undecided. Anime can also be a movie or TV series, so those labels should not be forced into mutually exclusive categories. TMDB's [API FAQ](https://developer.themoviedb.org/docs/faq) describes non-commercial access and attribution requirements; the About page includes the required credits.

Catalogue information and personal opinions have separate responsibilities: TMDB supplies media information, while Supabase stores my ratings and progress. The server determines ownership from the verified account, and database rules enforce private access. Account deletion also removes saved entries and their catalogue snapshots.

### Still to build

- Arc-level ratings.
- Further episode browsing refinements; arc ratings remain planned.
- The later mobile interface.

### Verification

On October 25, 2026, I ran `npm run build` successfully: compilation, TypeScript, page-data collection, static generation and optimization all passed. I also reviewed the app on my phone over local Wi-Fi and confirmed the mobile presentation looks good. These checks do not replace the complete interaction and production-deployment walkthroughs below.

Focused ESLint and TypeScript checks passed for edit/remove changes, and I subsequently confirmed the production build and edit/remove browser walkthrough. Earlier browser checks covered adding rated and unrated entries, preserving 0 as a score, validation errors, dialog dismissal/focus, navigation, and persistence after a full refresh.

Live authentication checks covered invalid credentials, password mismatch rejection, and signed-out redirects. I completed sign-up and email confirmation, reached My Library, and verified signing out and signing back in. I also verified username setup and the account dropdown, and tested account deletion with a disposable account successfully.

Desktop layouts have been visually reviewed, and I checked the app on my phone and confirmed it looks good. The website is deployed at [usemytake.vercel.app](https://usemytake.vercel.app); the account-deletion backend function is deployed in Supabase.

## Run locally

From the project folder, using Node.js 20.9 or newer (development currently uses Node.js 24):

```sh
npm install
cp .env.example .env.local
# Fill in Supabase settings and your server-only TMDB_READ_ACCESS_TOKEN, then:
npm run dev
```

Open [localhost:3000](http://localhost:3000). Edit `app/page.tsx` and `app/page.module.css` for the public homepage. The personal library and its styles live in `app/library/`. Shared styles and theme colours are in `app/globals.css`. The library route checks the session on the server and redirects signed-out visitors to Sign In. Sign Out is available in the library’s avatar dropdown.

```sh
npm run lint
npm run build
```

Linting checks code quality; the build also checks TypeScript and compiles the application. These are separate from testing behaviour in the browser.

## Local authentication setup

The example environment file lists the required settings. Use the Supabase project URL and **publishable key**; a secret or service-role key is not needed in the Next.js environment. The deletion Edge Function uses its server-only administrator credential inside Supabase. Keep `.env.local` out of Git.

For local development, set the Supabase Auth Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback` as a redirect URL. Use `localhost` consistently when signing up and opening the confirmation email on the same browser. Deployment will need its own Site URL and redirect configuration.

## Profile database setup

The connected project has the profiles schema applied. For another project, `supabase/profiles.sql` records the table, constraints, grants, and ownership policies. `supabase/tests/profiles.sql` tests uniqueness, format validation, owner access, cross-account isolation, and anonymous denial using temporary fixtures inside a rolled-back transaction. These database checks passed against the connected project.

I verified successful username selection and the authenticated dropdown. The Settings save/redirect flow was checked using the existing username unchanged. A changed-username refresh-persistence walkthrough remains to be checked. Profiles and library entries both persist in the account.

Supabase’s security advisor also reports that [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) is disabled; that existing Auth setting was not changed during profile work.

Account deletion uses the deployed `delete-account` Supabase Edge Function. It verifies the caller with Auth and deletes only that account through the admin API; the administrator credential stays in Supabase. Profile data is removed by its cascading foreign key. Saved library entries and private media snapshots also link to the account with cascading deletion. Source is in `supabase/functions/delete-account/`; deploy with JWT verification enabled. `node --test supabase/tests/delete-account.test.mjs` checks authorization, explicit confirmation, identity binding, and failure responses. The deployed endpoint rejects unauthenticated calls; profile cleanup passed a rolled-back database fixture check. I also completed a successful account-deletion walkthrough with a disposable account. Automatic three-second notice expiry and the deletion dialog visual details have not received a separate agent-run browser check.

## Media search setup and checks

Set `TMDB_READ_ACCESS_TOKEN` in `.env.local` using TMDB’s API Read Access Token. This server-only setting is not prefixed with `NEXT_PUBLIC_`. The separate v3 API key is not needed. Signed-in searches go through `/api/media/search`; the token is sent only from the server to TMDB. Results retain only movies and TV shows, and catalogue type is separate from the still-undecided category filters. Requests wait 300 milliseconds after typing and cancel obsolete responses. The dialog includes loading, no-match, retry, and required-selection feedback.

Live TMDB search and authenticated browser selection/addition were checked with Vinland Saga rated 8.8. `node --experimental-strip-types --test tests/media-search.test.mjs` checks movie/TV identity normalization and exclusion of people, malformed entries, adult results, and arbitrary poster URLs. Saving entries to the database is implemented.

Viewing status defaults to Completed. The optional episode picker appears only for in-progress TV results and labels the last episode watched, so the overall score means the opinion through that point. Changing the title or season clears the old episode selection; Completed removes progress. The server-only `/api/media/episodes` endpoint supplies seasons (including Specials) and episodes to signed-in users. Progress retains the TMDB episode ID, season and episode numbers, and episode name separately from its display label. The entry, viewing status, and selected episode progress persist in the account.

## Library database setup

`supabase/library.sql` records the private library schema and atomic save function applied to the connected project. For a separate Supabase project, apply the profile schema, then `supabase/library.sql`, followed by `supabase/library-edit.sql` for owner-only edits and `supabase/watchlist.sql` for watchlist storage and moves, then `supabase/episode-ratings.sql` for per-episode ratings and `supabase/episode-favourites.sql` for favourite episodes, followed by `supabase/reviews.sql` for written reviews. The Next.js application uses the publishable key and the user's verified session; it does not need an administrator key for library access.

Catalogue facts and personal opinions are stored separately. `media_snapshots` holds the selected title, TMDB identity/type, poster path, and year. `library_entries` holds the personal rating, viewing status, and optional episode progress. Both tables are private to the account for this milestone; a global shared catalogue can be considered later without exposing personal ratings. Neither table uses timestamps.

The server re-fetches title and episode details from TMDB before saving, determines the owner from Auth, and validates ratings and progress. The database separately enforces ownership, 0–10 ratings in 0.1 steps, valid status/progress combinations, one entry per catalogue title per account, and deletion cleanup. The save function runs with the caller's permissions, so it does not bypass row-level security. Its two inserts run as one transaction: either both records are saved or neither is. A stable request ID lets an uncertain save be retried safely.

`supabase/tests/library.sql` checks ownership, cross-account isolation, nullable versus zero ratings, decimal precision/range, progress constraints, duplicate prevention, atomicity, retry behavior, anonymous denial, and account-deletion cascades inside a rolled-back transaction. These database checks passed against the connected project. `node --experimental-strip-types --test tests/*.test.mjs` checks input validation, record mapping, and catalogue normalization. The authenticated browser save-and-refresh check passed with a temporary Vinland Saga entry rated 8.8 through S1 E03.

Library removal grants owner-only deletion of private media snapshots; the linked personal entry is removed by the database cascade in the same operation. The server verifies the login and ownership, confirms the entry is gone, and safely accepts a retry if it was already removed. `supabase/tests/library-removal.sql` checks owner deletion, cleanup, cross-account denial, repeat deletion, and anonymous denial with rolled-back fixtures.

Entry editing uses column-limited UPDATE grants and ownership policies: only ratings, status, and episode progress can be changed; owner and media identity remain fixed. Changed episodes are verified against the saved show on the server, while unchanged saved progress can be retained without another catalogue request. `supabase/tests/library-edit.sql` verifies owner edits, progress changes/clearing, zero/unrated, constraints, immutable identity/ownership, and cross-account/anonymous denial with rolled-back fixtures. Focused lint, TypeScript, and these database tests passed.

Library filters use TMDB’s movie/TV type, so anime films appear in Movies and anime series in TV Shows. All Media shows the full library; there is no separate Anime tab. The displayed title count and empty state follow the active filter, and the selected sorting order applies within it. Adding, editing, and removal continue to respect the active filter. Filters reset to All Media on a full refresh; they do not change stored entries. The Movies and TV Shows filters were verified in the browser after fixing local development requests from `127.0.0.1`; the production build passed in a user-run check.

The public homepage describes movies and TV shows, with no separate anime wording. Its static sample library mirrors the current filters, descending rating order, poster cards, and completion/progress labels. The simplified demo omits per-card action dots and sorting controls, and reuses the real Add Media button styling. Demo posters are stored locally in `public/demo-posters/` and credited to TMDB through About & Credits. Homepage copy describes overall ratings through an episode, without presenting separate episode/season ratings as implemented.

Watchlist storage uses owner-private `watchlist_entries` linked to catalogue snapshots. A collection field and matching foreign keys enforce exclusive library/watchlist membership in the database. Caller-permission functions save and move entries atomically, with safe retries. `supabase/tests/watchlist.sql` passed rolled-back checks for ownership, cross-account and anonymous denial, duplicates, invalid-move rollback, successful moves, retries, and deletion cascades. The existing library database fixture also passed after this schema change. Focused ESLint, TypeScript, and whitespace checks passed; Watchlist navigation and opening the add dialog were verified in the browser. The complete add/move/remove walkthrough remains a user-run check.

Library cards open one reusable media detail route, using the movie/TV type and TMDB ID from the URL. The server verifies the account and loads only its saved library entry before requesting catalogue details with the server-only token. The page displays the poster, synopsis, genres, movie runtime when available, and the saved rating/status/progress. Edit Entry reuses the existing form. The My Library return link restores the chosen filter and sort order. Missing or unowned entries show a not-found page; a catalogue failure leaves the saved take available with a retry control. No database schema change was needed. Focused lint/TypeScript and movie/TV opening, edit prefill/cancel, and return-navigation browser checks passed; saving edits from this page remains a user check.

### Episode ratings

TV detail pages include a Seasons & Episodes button opening a dedicated page. It loads one season at a time, including Specials, with landscape thumbnails, expandable descriptions, and 0–10 ratings in 0.1 steps. Each edited row has an explicit Save button and pending/error feedback; successful saves leave no persistent message. Blank clears a saved rating; zero remains a score. Drafts survive season switches within the page, but must be saved before leaving or refreshing. Any episode can be rated regardless of viewing progress; episode scores never automatically change the overall show score.

The private `episode_ratings` table links each score to its saved TV library entry and TMDB episode identity. Owner policies restrict reads/writes through that entry; removing the show or account cascades to its episode ratings. The server verifies the account and catalogue episode before writing a score, rereads to confirm success, and preserves drafts on failures. Clearing an existing rating works without a catalogue request. `supabase/tests/episode-ratings.sql` passed rolled-back privacy, precision/range, movie rejection, repeat save/update, zero/clear, show-score independence, and removal-cascade checks. Browser checks covered opening the page, seasons/Specials, enabling Save on edits, and draft retention across seasons. A complete real save-and-refresh walkthrough remains a user check.

Each show can have one favourite episode, selected with a star independently of its rating. Selecting another transfers the star; selecting the current favourite removes it. Private `episode_favourites` storage enforces one selection per saved show and inherits owner access/deletion cleanup through its library entry. The show page displays the favourite and up to three highest-rated episodes below its poster; ties use season and episode order. Episode metadata comes from TMDB, with missing-image/description fallbacks and season/episode labels retained when catalogue loading fails. Favourite changes and episode score changes refresh the show summary.

Favourite SQL checks passed for owner-only access, one selection, transfer/retry, unrated independence, unstar, movie rejection and cascading removal. Metadata tests check safe image paths and missing descriptions. Browser review verified thumbnails, expandable descriptions and the show summary using an existing saved episode score. Actual star/transfer/unstar and saving without a success message remain user walkthrough checks.

### Written reviews

I can write a private review for a movie, show, or individual episode, even when I leave its score blank. Media detail pages have a Your Review section; episode reviews expand below their rows to keep the list compact. The plain-text editor preserves paragraphs, allows up to 10,000 characters, and provides Save Review and Cancel. Clearing the editor and saving removes the review. Save failures preserve the draft, and episode drafts survive season switches within the page; refreshing or leaving still requires saving first. Successful saves show the review without a persistent success notice.

A nullable `review` column on `library_entries` holds the overall review. Separate owner-private `episode_reviews` records hold episode reviews independently of scores or favourite stars. Server actions derive ownership from the live session, validate text, verify new episode references against TMDB, and reread writes before confirming them. Existing episode reviews can be edited or cleared without a catalogue request. Removing the saved title or deleting the account clears its reviews through existing cascades. Apply `supabase/reviews.sql` after the other library/episode schemas.

`supabase/tests/reviews.sql` passed rolled-back checks for media/episode save, edit, clear/retry, size limits, score independence, owner-only access, movie-episode rejection, immutable episode identity, and deletion cascades. Two input tests passed for paragraph/line-ending handling, literal markup, blank clearing, type validation and limits. Focused lint, TypeScript and whitespace checks passed. Browser checks covered media and episode editor opening, Cancel, and episode-draft retention across seasons without saving synthetic opinions. The complete save/edit/clear/refresh walkthrough remains a user check.

### Season ratings

The Episodes page includes an optional rating for the selected season only when the show has more than one regular season; Specials do not count toward that threshold. Scores use 0–10 in 0.1 steps, with explicit Save Season Rating and blank-to-clear behaviour. Drafts survive season switches within the page. Season scores are personal opinions independent of episode scores, viewing progress and the overall show rating; no averages are calculated automatically.

The media overview replaces Your Top Season with a colour-coded ratings grid below the collapsible Synopsis and Your Review sections. Seasons are columns, episode numbers are rows, and explicit season scores appear beneath the column headings. Specials are excluded. The grid appears after at least one regular-season or episode score exists, preserves zero scores, shows unrated episodes as dashes, and leaves nonexistent episodes empty. Hovering an episode cell loads its image and name in a preview card; clicking opens and focuses that episode's rating field. Season scores link to season controls for multi-season shows. Cells enlarge on hover, and the grid scrolls for long shows. No chart is displayed on the episode-editing page.

Unsaved episode/season ratings and episode reviews, plus the overall review editor, have navigation protection. In-app links and Back use a MyTake dialog offering Keep Editing or Discard & Leave. Browser refresh and tab closure use the browser's required native warning. Lint, TypeScript and a production build passed for these interface changes; a complete browser walkthrough of chart navigation, hover previews, scroll restoration and warning behavior remains pending.

Private `season_ratings` records link to the saved TV entry. Owner-through-parent policies, restricted column updates and a caller-permission save function enforce privacy and safe retries. The server checks that the selected season belongs to the show and confirms the saved value. Removing the show or account cascades to season ratings. Apply `supabase/season-ratings.sql` after the library schema. Its rolled-back SQL fixture passed ownership/anonymous denial, score constraints, Specials/zero, score independence, top-season ordering, edits/clear/retries and show/account cascades. Input tests, scoped lint, TypeScript and whitespace passed. Browser checks covered the editor, draft retention between seasons and top-season empty state; a complete save/refresh/top-season walkthrough remains a user check.

### Personal profile

The account dropdown opens my private Profile page. It shows my username and initials avatar, my manually chosen Favourites, and up to four Highest Rated titles. All Media / Movies / TV Shows filters apply to both sections. Favourites are independent of scores and include unrated titles; they are displayed alphabetically. Highest Rated excludes unrated entries, preserves zero as a score, and breaks equal-score ties alphabetically.

Library and profile card menus include Add to Favourites / Remove from Favourites. A confirmed save updates the card and profile; failures show an error instead of assuming success. Existing Edit Entry and removal actions also update the profile collections. Profile reads are scoped to the signed-in account and protected by existing database ownership rules. `supabase/title-favourites.sql` adds the `is_favourite` flag and a restricted owner UPDATE grant; apply after library editing setup. No new favourites table is needed. Avatar uploads and bios remain separate future work.

The rolled-back title-favourites SQL fixture passed owner save/remove/retry, unrated independence, cross-account isolation and anonymous denial. Profile ranking/filter tests and existing input/mapping tests passed, along with focused lint, TypeScript and whitespace. Browser checks verified account-menu navigation, highest-rated ordering, movie filtering, empty favourites, and the new menu action without changing actual preferences. The complete favourite/add/refresh/remove walkthrough remains a user check.

### Profile stats and compact rankings

The profile now shows Movies Rated, Shows Rated, Episodes Rated and Reviews Written across the whole private library. Reviews Written includes both overall-media reviews and episode reviews. A rating-distribution chart groups overall movie/show scores into one-point buckets (0–0.9 through 9–9.9, plus 10); episode and season scores are kept separate. Unrated entries are excluded, and zero remains a score. The chart keeps rating-range labels visible and reveals counts only on hover or keyboard focus, with accessible count labels.

Favourites and Highest Rated use smaller poster cards in adjacent sections on larger screens. Their menus remain usable without being clipped by small cards. Separate Top Seasons and Top Episodes lists show up to five saved scores across shows, with show names, season/episode labels and catalogue names/images where available. Rankings are descending, with season/episode coordinates and saved-entry identity providing stable tie ordering. Missing catalogue metadata falls back to saved coordinates; scores remain visible. Movie filtering hides TV-only rankings. Counters and the chart continue to represent the whole library.

No database schema change was required. Server reads use the verified account, owner filters and existing row-level security; exact count queries count episode ratings/reviews independently of the five displayed results. Relevant opinion mutations invalidate the profile. Unit tests passed for decimal buckets, null/zero, counters and existing title ranking/filter rules; scoped lint, TypeScript and whitespace passed. The browser displayed the real account’s counters/chart/top lists, verified the movie filter, and showed the compact menu within the viewport. No actual opinions changed. The production build passed and mobile visuals were reviewed by the user.

### Additional taste stats

The profile also shows shows completed/in progress (including unrated shows), seasons rated, and the mean overall movie/show score to two decimal places. Unrated titles are excluded from averages; zero is included. Most-Rated Genres counts rated titles in each genre, and Highest-Rated Genres averages their overall title scores. Each genre shows its sample size; multi-genre titles count once in each of their genres. Coverage is displayed so missing catalogue metadata is visible rather than silently treated as zero. Genre metadata uses TMDB’s movie/TV details with bounded concurrency, an eight-second overall request budget and a daily cache of public catalogue responses; private opinions are never placed in that cache.


Five profile stats/title tests passed, covering status counts, average/null/zero, decimal buckets, genre deduplication/sample coverage and existing title rankings. Scoped lint, TypeScript and whitespace passed. Browser review verified the live counters, genre coverage and averages, and desktop layout without changing user opinions. Forced catalogue failure remains a user check.

Profile Top Seasons links open Seasons & Episodes with that season selected and its rating editor focused. Top Episodes links select the correct season and scroll/focus the exact episode row after catalogue loading. Season and episode query values are validated, Specials are supported, and missing catalogue targets show a notice. Browser checks passed for Vinland Saga S2E23 and Better Call Saul Season6. Average Rating continues to use only overall movie/show scores, excluding unrated entries and including zero.

### Interface motion

The UI uses short page fades, eased dialog/backdrop entrances, dropdown reveals, poster hover zoom, button press feedback, favourite-star motion, and growing rating-chart bars. Episode descriptions and review editors fade in when opened. Hover effects are limited to devices that support hover, and reduced-motion preferences disable the animation and smooth scrolling. Motion uses CSS without adding dependencies or delaying saves. Browser checks verified the dialog’s 220ms entrance and Cancel, account-menu animation/navigation, and chart animation. Reduced-motion rules are present; a separate device-preference walkthrough remains a user check.

### Password recovery and production authentication

Sign In now includes Forgot Password. The reset request sends a Supabase email without revealing whether the address has an account. Open the latest email in the same browser/device that requested it: this uses Supabase’s existing PKCE flow and default email template. The callback exchanges the one-time code and accepts only the library or reset-form destination; expired/used recovery links show a fresh-request screen. The reset form checks matching passwords with at least eight characters and verifies the live account on the server. Confirmed changes request global sign-out and return to Sign In; failures preserve useful feedback without returning passwords or tokens.

Authentication URLs now come from a validated site-origin helper shared by sign-up and recovery. Development uses `http://localhost:3000` as its single supported local authentication origin. Hosted authentication requires an explicit HTTPS `NEXT_PUBLIC_SITE_URL`, refuses arbitrary request origins, and uses the configured canonical origin for callbacks. Supabase’s local callback allowlist contains confirmation and recovery callbacks for localhost; the Site URL is now `https://usemytake.vercel.app`, with exact production confirmation and recovery callbacks saved alongside the two localhost callbacks.

[Deployment and authentication setup](docs/deployment.md) records the exact Vercel environment variables, Supabase Site URL/callback entries, Gmail SMTP configuration, and release walkthrough. Supabase now sends confirmation and recovery emails through the dedicated `mytakesupport@gmail.com` account using an encrypted Gmail app password. The sender name is `MyTake`.

Five focused auth tests passed for origin validation, redirect allowlisting, password validation, live-user gating, confirmed update/global sign-out and partial failure reporting. Focused lint, TypeScript and the production build passed. Browser review verified recovery styling; HTTP checks verified invalid-link routing and local-host preservation. No agent-run test changed an actual password. I completed the real recovery email/password-update flow and confirmed sign-in with the new password. The deployed production flow was also tested: a password-recovery email arrived from MyTake after Gmail SMTP was enabled. Vercel successfully built and deployed the v1 application, and the live homepage, sign-in, account confirmation, and recovery flows were checked.
