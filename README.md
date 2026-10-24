# MyTake

A personal home for the media I watch and the opinions I form along the way.

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

The website is being built with TypeScript, React, Next.js, and CSS Modules. Supabase Auth, profiles, and private library storage are connected. Website deployment remains upcoming work.

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
| Vercel | Website deployment | Planned |

A good-looking, comfortable interface matters to me alongside the functionality. I want MyTake to feel like a place I enjoy returning to, rather than just a form for entering scores.

## How I'm learning with Codex

I'm using Codex as a teacher and development assistant, guided by a set of project instructions and continuity notes I developed around how I want to learn. The aim is to build software I understand, rather than simply receive a finished application.

For new concepts and meaningful features, the workflow is to explain the purpose, trace how information moves through the system, compare tradeoffs, and work through one small piece at a time. It leaves room for me to write code, explain a choice, or investigate a problem, with feedback on my attempt. For bounded tasks such as styling changes or routine edits, Codex can implement the changes and explain what changed and how it was checked.

I own the goals and consequential design decisions. Codex is expected to challenge weak assumptions, distinguish recommendations from agreed choices, and record decisions, checks, and learning checkpoints so later sessions can pick up where we left off. I review changes before committing and publishing them. AI assistance is part of the process; generated code by itself isn't evidence that I've learned the underlying concept.

## Beyond the MVP

I want to release a mobile app on the App Store after the website is useful. The likely direction is a separate mobile interface that shares the website's backend and accounts; the mobile technology hasn't been chosen yet.

Manga, novels, and ways to share ratings with other people may come later. For now, the priority is getting the core personal tracking experience right.

## Current status

MyTake runs locally with a public homepage, account pages, and a protected personal library. The design uses a single dark theme, coral accents, rounded controls, and consistent line icons. Locally hosted Nunito gives the interface a playful, rounded feel, while the serif wordmark stays distinct. The font and its SIL Open Font License are in `app/fonts/`. The exclamation mark stays in the `mytake!` wordmark; the rest of the interface is kept clean. Profiles use unique usernames and an initials avatar.

| Page | What works today |
| --- | --- |
| `/` | Product introduction, sample collection, and links to Sign In and Sign Up |
| `/sign-up` | Email/password submission, password confirmation, pending states, and styled confirmation/error messages |
| `/sign-in` | Email/password submission, pending states, and error messages |
| `/profile/setup` | Username selection after signing in for accounts without a profile |
| `/settings` | Change your username, return to the library after saving, or permanently delete your account after confirmation |
| `/library` | Server-checked access, TMDB title search/selection, saved personal cards, rating/alphabetical sorting, an updating title count, and a profile dropdown |
| `/about` | TMDB credits and required attribution |

### Adding media

The personal library starts empty and displays only my saved entries. The Add Media dialog searches TMDB as I type and lets me select a movie or TV result with its poster and release year, then choose Completed (the default) or In Progress and enter an optional rating. For an in-progress show, I can select the last episode watched from TMDB season and episode lists; the card displays that progress. A typed title alone cannot be added without selecting a catalogue result. Missing titles, out-of-range scores, and ratings that don't follow 0.1 steps produce inline errors. Valid entries appear as new cards only after the database confirms the save. Pending saves disable the form; failed or uncertain saves preserve the selections and show an error. Retrying the same request cannot create a second entry. Adding a title already in my library shows a message instead of overwriting its rating. Blank ratings display an Unrated badge; a rating of 0 stays a real score.

The server loads saved entries for the verified account; the parent library component owns their displayed list. The dialog saves through a server action and passes the confirmed database entry back through a callback, then React renders the updated collection. A sorting dropdown defaults to highest rating first, with lowest rating first and alphabetical A–Z options. Unrated entries come first in ascending order and last in descending order.

Entries are saved to my Supabase account: **refreshing the page keeps the library, ratings, and viewing progress**. Selected cards use TMDB posters when available, with a title cover as fallback when no poster is supplied. The public homepage keeps its illustrative sample collection.

### Editing and removing entries

Each saved card has a three-dot menu with **Edit Entry** and **Remove from Library**. Edit Entry opens with the saved rating, viewing status, and episode progress; the selected media stays fixed. I can change or clear a rating, update the last episode watched, or mark the title completed. Cancel discards the draft. Saving updates the existing card and its sort position only after database confirmation.

Removal asks for confirmation and names the title, explaining that its rating and viewing progress will be deleted. The card disappears only after confirmed removal. Failed or uncertain edits/removals show an error rather than assuming success.

### Accounts

Supabase handles email/password authentication. Sign-up checks that passwords match and contain at least eight characters. Confirmation emails return to the app, and the server checks the session before rendering the library. Signed-out visitors are sent to Sign In. Sessions are maintained using cookies, with server-side refresh handling.

Profiles are stored in Supabase PostgreSQL, separately from authentication credentials. Each profile links its account ID to a unique username: 3–20 lowercase letters, numbers, or underscores. Database constraints enforce these rules, and row-level security restricts profile reads and changes to the account owner. No timestamp field is used.

After signing in, accounts without a profile choose a username before entering the library. The initials avatar opens a dropdown with the username, Settings, and Sign Out. Settings saves username changes to the database and returns to My Library with a confirmation that disappears after three seconds. Settings also includes permanent account deletion behind a confirmation dialog. Profile pictures are not uploaded yet.

### Catalogue direction

I want to select real catalogue entries instead of manually entering titles and media types. TMDB now supplies that search and selection flow, including posters and episode lists. I checked representative anime listings and accepted their organization for now; category behavior remains undecided. Anime can also be a movie or TV series, so those labels should not be forced into mutually exclusive categories. TMDB's [API FAQ](https://developer.themoviedb.org/docs/faq) describes non-commercial access and attribution requirements; the About page includes the required credits.

Catalogue information and personal opinions have separate responsibilities: TMDB supplies media information, while Supabase stores my ratings and progress. The server determines ownership from the verified account, and database rules enforce private access. Account deletion also removes saved entries and their catalogue snapshots.

### Still to build

- Media detail pages for opening a title from the library.
- Working media filters.
- Profile picture uploads.
- Individual episode, season, and arc ratings; episode progress is selectable, while these separate ratings are still planned.
- Deployment and the later mobile interface.

### Verification

Focused ESLint and TypeScript checks passed for the latest edit/remove changes. The most recent production build passed at the library-persistence checkpoint; a full build and browser walkthrough of the later edit/remove features remain user-run checks. Earlier browser checks covered adding rated and unrated entries, preserving 0 as a score, validation errors, dialog dismissal/focus, navigation, and persistence after a full refresh.

Live authentication checks covered invalid credentials, password mismatch rejection, and signed-out redirects. I completed sign-up and email confirmation, reached My Library, and verified signing out and signing back in. I also verified username setup and the account dropdown, and tested account deletion with a disposable account successfully.

Desktop layouts have been visually reviewed. Responsive styles are included; mobile visual review is still outstanding. The website has not been deployed; the account-deletion backend function is deployed in Supabase.

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

`supabase/library.sql` records the private library schema and atomic save function applied to the connected project. For a separate Supabase project, apply the profile schema, then `supabase/library.sql`, followed by `supabase/library-edit.sql` for owner-only edits. The Next.js application uses the publishable key and the user's verified session; it does not need an administrator key for library access.

Catalogue facts and personal opinions are stored separately. `media_snapshots` holds the selected title, TMDB identity/type, poster path, and year. `library_entries` holds the personal rating, viewing status, and optional episode progress. Both tables are private to the account for this milestone; a global shared catalogue can be considered later without exposing personal ratings. Neither table uses timestamps.

The server re-fetches title and episode details from TMDB before saving, determines the owner from Auth, and validates ratings and progress. The database separately enforces ownership, 0–10 ratings in 0.1 steps, valid status/progress combinations, one entry per catalogue title per account, and deletion cleanup. The save function runs with the caller's permissions, so it does not bypass row-level security. Its two inserts run as one transaction: either both records are saved or neither is. A stable request ID lets an uncertain save be retried safely.

`supabase/tests/library.sql` checks ownership, cross-account isolation, nullable versus zero ratings, decimal precision/range, progress constraints, duplicate prevention, atomicity, retry behavior, anonymous denial, and account-deletion cascades inside a rolled-back transaction. These database checks passed against the connected project. `node --experimental-strip-types --test tests/*.test.mjs` checks input validation, record mapping, and catalogue normalization. The authenticated browser save-and-refresh check passed with a temporary Vinland Saga entry rated 8.8 through S1 E03.

Library removal grants owner-only deletion of private media snapshots; the linked personal entry is removed by the database cascade in the same operation. The server verifies the login and ownership, confirms the entry is gone, and safely accepts a retry if it was already removed. `supabase/tests/library-removal.sql` checks owner deletion, cleanup, cross-account denial, repeat deletion, and anonymous denial with rolled-back fixtures.

Entry editing uses column-limited UPDATE grants and ownership policies: only ratings, status, and episode progress can be changed; owner and media identity remain fixed. Changed episodes are verified against the saved show on the server, while unchanged saved progress can be retained without another catalogue request. `supabase/tests/library-edit.sql` verifies owner edits, progress changes/clearing, zero/unrated, constraints, immutable identity/ownership, and cross-account/anonymous denial with rolled-back fixtures. Focused lint, TypeScript, and these database tests passed.
