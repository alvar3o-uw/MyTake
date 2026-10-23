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

The website is being built with TypeScript, React, Next.js, and CSS Modules. Supabase Auth is connected; library database storage and deployment remain upcoming work.

| Technology | Purpose | Status |
| --- | --- | --- |
| TypeScript | Typed entries, form logic, and server-side authentication actions | In use |
| React and Next.js | Pages, shared components, client state, routing, and server actions | In use |
| CSS Modules | Component styles, alongside shared global CSS | In use |
| ESLint | Automated code checks | In use |
| Git and GitHub | Version control and project history | In use |
| OpenAI Codex | Development assistance within a structured learning workflow | In use |
| PostgreSQL through Supabase | Persistent storage for library entries, ratings, and viewing progress | Planned |
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

MyTake runs locally with a public homepage, account pages, and a protected personal library. The design uses a single dark theme, coral accents, rounded controls, and consistent line icons. The exclamation mark stays in the `mytake!` wordmark; the rest of the interface is kept clean.

| Page | What works today |
| --- | --- |
| `/` | Product introduction, sample collection, and links to Sign In and Sign Up |
| `/sign-up` | Email/password submission, password confirmation, pending states, and styled confirmation/error messages |
| `/sign-in` | Email/password submission, pending states, and error messages |
| `/library` | Server-checked access, an Add Media dialog, session-only cards, an updating title count, and Sign Out |

### Adding media

The library starts with four sample entries. I can add a title and an optional rating through the dialog. Missing titles, out-of-range scores, and ratings that don't follow 0.1 steps produce inline errors. Valid entries appear as new cards. Blank ratings display an Unrated badge; a rating of 0 stays a real score.

The parent library component owns the entries array. The dialog passes a valid entry back through a callback, and React renders the updated collection. Entries are held in memory only: **refreshing the page resets the library**. New cards use a neutral title cover; the sample covers are made with CSS rather than fetched from a catalogue.

### Accounts

Supabase handles email/password authentication. Sign-up checks that passwords match and contain at least eight characters. Confirmation emails return to the app, and the server checks the session before rendering the library. Signed-out visitors are sent to Sign In. Sessions are maintained using cookies, with server-side refresh handling.

### Still to build

- Persistent library storage with per-user database access rules.
- Catalogue search and selection, including a check of anime coverage.
- Working filters, sorting, and entry editing.
- Episode, season, and arc ratings, plus tracking unfinished media.
- Deployment and the later mobile interface.

The existing viewing-progress labels are sample data. Authentication protects the library page, but private database storage has not been implemented yet.

### Verification

Linting, TypeScript checking during the production build, and the production build have passed. Browser checks covered adding rated and unrated entries, preserving 0 as a score, validation errors, dialog dismissal/focus, navigation, and refresh resetting entries.

Live authentication checks covered invalid credentials, password mismatch rejection, and signed-out redirects. I also completed sign-up and email confirmation and reached My Library. A separate successful password sign-in and sign-out cycle still needs verification.

Desktop layouts have been visually reviewed. Responsive styles are included; mobile visual review is still outstanding. The app has not been deployed.

## Run locally

From the project folder, using Node.js 20.9 or newer (development currently uses Node.js 24):

```sh
npm install
cp .env.example .env.local
# Fill in your Supabase project URL and publishable key, then:
npm run dev
```

Open [localhost:3000](http://localhost:3000). Edit `app/page.tsx` and `app/page.module.css` for the public homepage. The library demo and its styles live in `app/library/`. Shared styles and theme colours are in `app/globals.css`. The library route checks the session on the server and redirects signed-out visitors to Sign In. A Sign Out button is available inside the library.

```sh
npm run lint
npm run build
```

Linting checks code quality; the build also checks TypeScript and compiles the application. These are separate from testing behaviour in the browser.

## Local authentication setup

The example environment file lists the required settings. Use the Supabase project URL and **publishable key**; a secret or service-role key is not needed. Keep `.env.local` out of Git.

For local development, set the Supabase Auth Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback` as a redirect URL. Use `localhost` consistently when signing up and opening the confirmation email on the same browser. Deployment will need its own Site URL and redirect configuration.
