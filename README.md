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

## Planned stack

The current plan is a website built with:

| Technology | Purpose |
| --- | --- |
| TypeScript | Application logic and type checking |
| React and Next.js | Interactive screens and server-side request handling in one project |
| CSS Modules | Styling with ordinary CSS scoped to components |
| PostgreSQL through Supabase | Persistent storage for library entries, ratings, and viewing progress |
| Supabase Auth | User accounts and sign-in |
| TMDB API | Movie and television metadata, subject to checking anime coverage |
| Vercel | Website deployment |

A good-looking, comfortable interface matters to me alongside the functionality. I want MyTake to feel like a place I enjoy returning to, rather than just a form for entering scores.

## Beyond the MVP

I want to release a mobile app on the App Store after the website is useful. The likely direction is a separate mobile interface that shares the website's backend and accounts; the mobile technology hasn't been chosen yet.

Manga, novels, and ways to share ratings with other people may come later. For now, the priority is getting the core personal tracking experience right.

## Current status

Planning stage. This README is the starting point; the application has not been implemented or deployed yet.
