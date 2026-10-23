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

The website is being built with TypeScript, React, Next.js, and CSS Modules. Supabase Auth and PostgreSQL profiles are connected; persistent library storage and website deployment remain upcoming work.

| Technology | Purpose | Status |
| --- | --- | --- |
| TypeScript | Typed entries, form logic, and server-side authentication actions | In use |
| React and Next.js | Pages, shared components, client state, routing, and server actions | In use |
| CSS Modules | Component styles, alongside shared global CSS | In use |
| ESLint | Automated code checks | In use |
| Git and GitHub | Version control and project history | In use |
| OpenAI Codex | Development assistance within a structured learning workflow | In use |
| PostgreSQL through Supabase | Private profiles with unique usernames; library entries and ratings are next | In use for profiles |
| Supabase Edge Functions | Protected account deletion using the Auth admin API | In use |
| Supabase Auth | Email/password accounts, cookie sessions, and protected library access | Connected |
| TMDB API | Movie and television metadata, subject to checking anime coverage | Planned |
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

MyTake runs locally with a public homepage, account pages, and a protected personal library. The design uses a single dark theme, coral accents, rounded controls, and consistent line icons. The exclamation mark stays in the `mytake!` wordmark; the rest of the interface is kept clean. Profiles use unique usernames and an initials avatar.

| Page | What works today |
| --- | --- |
| `/` | Product introduction, sample collection, and links to Sign In and Sign Up |
| `/sign-up` | Email/password submission, password confirmation, pending states, and styled confirmation/error messages |
| `/sign-in` | Email/password submission, pending states, and error messages |
| `/profile/setup` | Username selection after signing in for accounts without a profile |
| `/settings` | Change your username, return to the library after saving, or permanently delete your account after confirmation |
| `/library` | Server-checked access, an Add Media dialog, session-only cards, rating/alphabetical sorting, an updating title count, and a profile dropdown |

### Adding media

The library starts with four sample entries. I can add a title and an optional rating through the dialog. Missing titles, out-of-range scores, and ratings that don't follow 0.1 steps produce inline errors. Valid entries appear as new cards. Blank ratings display an Unrated badge; a rating of 0 stays a real score.

The parent library component owns the entries array. The dialog passes a valid entry back through a callback, and React renders the updated collection. A sorting dropdown defaults to highest rating first, with lowest rating first and alphabetical A–Z options. Unrated entries come first in ascending order and last in descending order.

Entries are held in memory only: **refreshing the page resets the library**. New cards use a neutral title cover; the sample covers are made with CSS rather than fetched from a catalogue.

### Accounts

Supabase handles email/password authentication. Sign-up checks that passwords match and contain at least eight characters. Confirmation emails return to the app, and the server checks the session before rendering the library. Signed-out visitors are sent to Sign In. Sessions are maintained using cookies, with server-side refresh handling.

Profiles are stored in Supabase PostgreSQL, separately from authentication credentials. Each profile links its account ID to a unique username: 3–20 lowercase letters, numbers, or underscores. Database constraints enforce these rules, and row-level security restricts profile reads and changes to the account owner. No timestamp field is used.

After signing in, accounts without a profile choose a username before entering the library. The initials avatar opens a dropdown with the username, Settings, and Sign Out. Settings saves username changes to the database and returns to My Library with a confirmation that disappears after three seconds. Settings also includes permanent account deletion behind a confirmation dialog. Profile pictures are not uploaded yet.

### Next steps

I want title selection to come from a media catalogue, rather than asking people to enter titles and media types manually. The intended flow is to search, select the correct work using its title, poster, and release year, then enter an optional personal rating.

TMDB is the recommended starting point, but it is not connected yet. Before settling the catalogue choice and categories, I want to check how it represents anime, seasons, specials, and movies. Anime can also be a movie or TV series, so those labels should not be forced into mutually exclusive categories. TMDB's [API FAQ](https://developer.themoviedb.org/docs/faq) describes non-commercial access and the attribution requirements we will need to meet.

The next implementation order is:

1. Check catalogue coverage and build search/selection in Add Media.
2. Save selected media and personal ratings with per-user database access rules.
3. Build media detail pages, followed by season and episode ratings.

Catalogue information and personal opinions will have separate responsibilities: the API supplies media information; Supabase stores each user's ratings and progress. The server will determine ownership from the verified account, and database rules will enforce private access. Account deletion must also remove future saved library entries.

### Still to build

- Working filters and entry editing.
- Profile picture uploads.
- Episode, season, and arc ratings, plus tracking unfinished media.
- Deployment and the later mobile interface.

The existing viewing-progress labels are sample data. Authentication protects the library page, and profiles have private database storage. Library entries still have no database storage.

### Verification

Linting, TypeScript checking during the production build, and the production build have passed. Browser checks covered adding rated and unrated entries, preserving 0 as a score, validation errors, dialog dismissal/focus, navigation, and refresh resetting entries.

Live authentication checks covered invalid credentials, password mismatch rejection, and signed-out redirects. I completed sign-up and email confirmation, reached My Library, and verified signing out and signing back in. I also verified username setup and the account dropdown, and tested account deletion with a disposable account successfully.

Desktop layouts have been visually reviewed. Responsive styles are included; mobile visual review is still outstanding. The website has not been deployed; the account-deletion backend function is deployed in Supabase.

## Run locally

From the project folder, using Node.js 20.9 or newer (development currently uses Node.js 24):

```sh
npm install
cp .env.example .env.local
# Fill in your Supabase project URL and publishable key, then:
npm run dev
```

Open [localhost:3000](http://localhost:3000). Edit `app/page.tsx` and `app/page.module.css` for the public homepage. The library demo and its styles live in `app/library/`. Shared styles and theme colours are in `app/globals.css`. The library route checks the session on the server and redirects signed-out visitors to Sign In. Sign Out is available in the library’s avatar dropdown.

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

I verified successful username selection and the authenticated dropdown. The Settings save/redirect flow was checked using the existing username unchanged. A changed-username refresh-persistence walkthrough remains to be checked. Library entries are still session-only even though profiles persist.

Supabase’s security advisor also reports that [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) is disabled; that existing Auth setting was not changed during profile work.

Account deletion uses the deployed `delete-account` Supabase Edge Function. It verifies the caller with Auth and deletes only that account through the admin API; the administrator credential stays in Supabase. Profile data is removed by its cascading foreign key. Future persisted library data must also be linked to the account with deletion cleanup. Source is in `supabase/functions/delete-account/`; deploy with JWT verification enabled. `node --test supabase/tests/delete-account.test.mjs` checks authorization, explicit confirmation, identity binding, and failure responses. The deployed endpoint rejects unauthenticated calls; profile cleanup passed a rolled-back database fixture check. I also completed a successful account-deletion walkthrough with a disposable account. Automatic three-second notice expiry and the deletion dialog visual details have not received a separate agent-run browser check.
