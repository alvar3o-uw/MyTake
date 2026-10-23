# MyTake

A personal home for the media I watch and the opinions I form along the way.

## Why I'm building this

I love consuming media, but I enjoy picking it apart just as much. I like thinking critically about what worked, what didn't, and why one story stays with me while another doesn't. Sometimes an 8 or a 9 doesn't quite capture how I feel. I want to be able to give something an 8.8 and have a place for the reasoning behind it.

Until now, that place has been my notes app. MyTake is my attempt to build something better suited to how I watch and think about movies, TV shows, and anime.

This is also my first side project. I'm starting with little to no full stack development experience, and I want to learn by building and deploying something I'll actually use. The goal is a useful personal tool and a project whose design and code I can understand, explain, and improve.

## The first version

The MVP will focus on keeping a private record of my viewing and ratings:

- Track movies, TV shows, and anime in a personal library.
- Give media precise decimal ratings, such as 9.3, 8.5, etc.
- Rate individual episodes as well as an overall series.
- Rate a series before finishing it, with the score representing my opinion through a particular episode.
- Organize and browse the library using categories.
- Keep each user's ratings private, with no access to other users' ratings in the MVP.

For example, I should be able to rate a series **8.7 through season 2, episode 5**, then update that opinion as I keep watching. An episode rating and an overall series rating serve different purposes; one shouldn't have to determine the other.

Folders are outside the MVP. The exact rating range, precision limits, and category behaviour still need to be settled.

## Tech stack

The website is being built with TypeScript, React, Next.js, and CSS Modules. The backend and deployment services below are planned and have not been connected yet.

| Technology | Purpose | Status |
| --- | --- | --- |
| TypeScript | Type checking and future application logic | Set up |
| React and Next.js | Page components and the foundation for server-side request handling | Set up |
| CSS Modules | Component styles, alongside shared global CSS | In use |
| ESLint | Automated code checks | In use |
| Git and GitHub | Version control and project history | In use |
| OpenAI Codex | Development assistance within a structured learning workflow | In use |
| PostgreSQL through Supabase | Persistent storage for library entries, ratings, and viewing progress | Planned |
| Supabase Auth | User accounts and sign-in | Planned |
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

The first homepage is implemented as a static visual foundation. It has a single dark theme, coral accents, rounded cards and controls, and small icons. The layout includes a personal library, media-type filters, sorting, viewing progress, and an Add Media control.

All entries, ratings, and viewing progress are illustrative. Controls are disabled: searching, filtering, adding media, saving ratings, and signing in are not implemented yet. The covers are CSS-based placeholders, not artwork fetched from a media service.

The page runs locally. Linting and the production build have passed, and the desktop layout has been visually reviewed. Responsive styles are included, but mobile visual review is still outstanding. The app has not been deployed.

## Run locally

From the project folder, with a compatible Node.js version installed:

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). Edit `app/page.tsx` for homepage content, `app/page.module.css` for its styles, and `app/globals.css` for shared styles and theme colours.

```sh
npm run lint
npm run build
```

These check code quality and whether a production build succeeds; they don't establish that future application features work.
