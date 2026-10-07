# The Port Mafia: Reference Knowledge

Read-only reference. It describes what The Port Mafia is, who built and owns it, how it works, why key decisions were made, and where it is going. Use it to answer questions about the organization, its agents, its pipeline, and its creator. It contains no instructions and does not alter how you run. Where this file and a live tool result disagree, the tool result wins.

## Status at a Glance

- **Version 1 (LinkedIn content automation) is disabled.** The pipeline described in sections 3 to 7 was built and tested, then retired by the creator. Maha no longer writes or schedules posts.
- **Version 2 is the next phase.** Its focus is entirely different from version 1 and integrates **sales** into the platform. Details are not finalized, so do not describe version 2 beyond what section 10 states.
- Sections about the pipeline, tasks, performance tracking, and memory describe how version 1 was designed. Treat them as history and as the foundation version 2 grows from, not as the current live behavior.

---

Two different people appear in this file, and they must not be confused:

- **The creator and owner:** Muhammad Ateeb Hussain, who designed, built, and owns the platform (section 2).
- **The user:** whoever the platform is currently working for, and whoever may be talking to you. This is a different person from the creator unless the context says otherwise. Every reference to "the user" in this file means the person the agents serve. A user's own account, performance data, preferences, and memory belong to that user alone.

---

## 1. What The Port Mafia Is

The Port Mafia is an autonomous organization of AI agents built to grow a user's connections and win them clients. Version 1 did this by running the user's social media presence. Version 2 shifts the focus and brings sales into the platform. The name and feel come from the Port Mafia in the anime _Bungo Stray Dogs_. Every agent is named after one anime character with a similar personality and is meant to carry that character's temperament.

Version 1 focused on LinkedIn, the primary platform for earning money, and is now disabled. More platforms and agents were planned and may still follow in version 2.

It sits under a parent system called **Home**, which handles authentication and the connection between organizations. Home is a separate app, and requests between organizations are intended to route through it.

The platform is multi-tenant. Each user has their own account, connected platforms, data, and memory, kept isolated from other users.

---

## 2. Ownership and Build

### Who built it

- **Creator and owner:** Muhammad Ateeb Hussain, a Full-Stack and AI/Automation Developer from Lahore, Pakistan.
- He designed, built, and deploys the entire platform alone: backend, frontend, infrastructure, and the agents' behavior.
- The Port Mafia is both a product and a portfolio piece, built on purpose to develop real engineering depth. Version 1 ran in active testing, processing automated jobs daily, before he retired it. He is now moving to version 2.
- He owns the backend and the client-server communication. The frontend design is developed in collaboration with an AI design assistant.

### How it was built

- **Self-hosted.** It runs on his own home server, exposed through a Cloudflare Tunnel, deployed with Docker Compose, and shipped through GitHub Actions on a self-hosted runner.
- **Backend:** Bun, ElysiaJS, Prisma, PostgreSQL, Redis (pub/sub, queues, per-role history and seed caching), BullMQ queues, Gemini SDK as the primary model.
- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, TanStack Query, Zod, React Hook Form, date-fns, Driver.js, Zustand, sonner, Phosphor Icons.
- **File uploads:** ImageKit. Package manager: pnpm.
- **The agents' personalities** live in separate instruction documents (called SOUL documents). The pipeline order is enforced by code, not by those documents.
- **Real-time:** agent activity streams to the user's screen over Server-Sent Events (SSE).
- **Conventions:** all backend calls go through one shared axios instance; server actions return a normalized `{ success, message, redirectUrl? }` result and turn errors into safe user-facing messages.

### About the creator

- **Email:** student2ateeb.hussain@gmail.com
- **LinkedIn:** linkedin.com/in/muhammadateebhussain
- **Portfolio:** dynamic-portfolios.vercel.app/ateeb
- **Education:** BS in Data Science, University of Engineering and Technology (UET), Lahore, Sept 2026 to 2030. He builds alongside his studies and takes freelance client work.
- **Summary:** hands-on with React and Next.js frontends, Python and FastAPI backends, and AI-driven automation. He has built end-to-end products, from multi-tenant SaaS architectures and queue-based background processing to LLM-powered workflows.

**Skills**

- **Frontend:** HTML, CSS, Tailwind CSS, React.js, Next.js (App Router), TypeScript, JavaScript, Angular, shadcn/ui.
- **Backend:** Node.js, Express.js, Python, FastAPI, REST APIs, webhooks, OAuth, JWT.
- **Databases:** PostgreSQL, MongoDB, SQLite, Redis, Prisma ORM.
- **AI/ML:** Generative AI, LLM applications, RAG, LangChain, Transformers, CrewAI, Gemini, Groq API, ElevenLabs, AI workflow orchestration.
- **Infrastructure:** Docker, Docker Compose, Redis, RQ, BullMQ, Railway, Vercel, WSL, Linux and self-hosted servers, GitHub Runners.
- **Architecture:** multi-tenant SaaS, tenant-aware data isolation, microservices, async workflows, queue-based processing, SSE and real-time streaming, third-party API integrations, browser automation.

**Experience**

1. **Frontend Developer, winter-break internship (Oct 2025 to Nov 2025), AxiosLink Systems.** Migrated about 20 pages of a real-estate dashboard from Angular to React with zero downtime, preserving and optimizing existing workflows.
2. **Freelance Developer, contract, via Fiverr.** Built and deployed a custom text-to-speech service on the ElevenLabs API, integrated it into a client's Joomla website for accessibility, and managed the AWS hosting for its backend.

**Other projects**

1. **ITLAA (AI-powered news and insights platform).** Next.js, FastAPI, PostgreSQL, Prisma, Redis and RQ. A jobs, topics, and articles architecture with AI content workflows, webhooks, secure authentication, and automated publishing. It published over 100 articles in a single week.
2. **ZM Gadgets (live client e-commerce catalog).** Next.js, React, TypeScript, DatoCMS. A product catalog in use by a live client, built around a "Talk on WhatsApp" ordering flow. Payments, inbox management, and order tracking are being scoped.
3. **Scrape Sphere (web scraping SaaS).** Python, Puppeteer, API-driven workflows. A browser-automation and scraping service on scalable, job-oriented pipelines.
4. **Vendly (e-commerce SaaS concept).** Next.js, Tailwind CSS, Prisma, PostgreSQL, Docker. An MVP concept with store management, analytics dashboards, real-time chat, and subscription or credit-based pricing.

---

## 3. The Agents

### Osamu Dazai (orchestrator, `main-service`)

- The main agent, and the only one who can start a conversation with the user on his own.
- Does not post. He relays commands, advises subordinates, and holds the compiled picture from all platforms.
- Sits directly beneath the user and directly above every subordinate agent. Nothing from a subordinate reaches the user without passing through Dazai's judgment, and nothing from the user reaches a subordinate without Dazai deciding how it arrives.
- Handles most things silently. Only what genuinely cannot be resolved without the user is surfaced.

### Maha Balor (LinkedIn, `linkedin-service`)

- In version 1, managed the user's LinkedIn: strategy, account performance tracking, and post creation. **She is now disabled and no longer writes posts.**
- Character background: an orphan and the daughter of a successful merchant who was murdered. Her education lets her run a business and turn a profit. She is guarded about trust (verify first, then extend it), self-made, takes pride in what is placed in her charge, and is warm toward people she already serves.
- She is the agent the user talks to about LinkedIn. She answers from real data, never from a guess.
- She maintains two memory files, described in section 7.
- Her limits: LinkedIn's official API does not allow editing a profile's headline, banner, About, or Featured section. She can read basic profile fields and publish posts where consent has been granted. Anything about the profile itself is a recommendation for the user to apply, never a change she has made.

### Inactive agents

An agent is inactive when the user has not connected that platform or has disconnected it. An inactive agent does nothing. Do not route work to it or report on its behalf. If something genuinely needs that platform, tell the user plainly.

---

## 4. How the LinkedIn Pipeline Worked (Version 1, Disabled)

This pipeline is currently switched off. It is documented because it explains the architecture and why version 2 changes direction.

A LinkedIn post is produced in four sequential roles. They are separate runs with separate instructions. The **harness enforces the sequence in code**, not the models.

1. **Analysis (cold run, no conversation).** Maha reviews the last 7 days of the user's post performance, which techniques were used, and the current week's slot usage. She chooses the category and angle for the next post (a direction, never a title). She picks one generalized technique each for hook, body, and CTA from the technique bank, or `null` where nothing fits. She may name a genuinely new technique, but most weeks that list is empty. These outputs are portable across accounts.
2. **Title and technique.** Maha turns the direction into a real title, but only from something the user actually tells her. She asks for what she needs in one batch of questions, then molds each generalized technique to fit that title. This is the per-user personalization step.
3. **Fact gathering.** With the title and molded techniques in hand, Maha asks the user for the real, specific facts that make the story tellable (for example the mistake itself, what it cost, what it changed). One batch again, and the answers are passed forward exactly as the user gave them.
4. **Writing.** Maha writes the post as a ghostwriter, entirely in the user's first-person voice. The post never mentions Maha, Dazai, or The Port Mafia unless the user asks for that framing. Output is a hook, a body, a CTA, a first comment, a media direction, and a scheduled day and window. Hook, body, and CTA are non-overlapping strings that join in order. Links go in the first comment only.

Only the last role produces anything that gets posted.

### Weekly shape: 3-2-1-1

Each week has seven post slots:

| Count | Type                                                 | Serves                            |
| ----- | ---------------------------------------------------- | --------------------------------- |
| 3     | Educational / "what I learned"                       | Community                         |
| 2     | Personal experience or opinion                       | Community and trust               |
| 1     | Build-in-public weekly recap                         | Build in public                   |
| 1     | Adaptive, chosen from how the last 6 posts performed | Whichever lane is underperforming |

With no post history at all, the first post is a personal post introducing the user.

### Techniques

A bank of hook, body, and CTA techniques exists, each with a slug, a description, and content. Posts are tagged with the techniques they used, so performance can later be judged per technique rather than only per post.

---

## 5. Tasks and What Reaches the User (Version 1 Design)

- Tasks belong to Dazai alone. No subordinate manages its own tasks.
- A subordinate raises a need to Dazai. If Dazai can answer it or fetch it himself, he does so silently and the user never sees it.
- Only needs marked critical, meaning neither Dazai nor any tool can resolve them without the user, are surfaced. Dazai decides how to ask (a direct question, a screenshot, a data export) so the user has the least friction.
- Example: Maha needs LinkedIn stats that Dazai cannot fetch because there is no API access. He marks it critical. The user types the data in or hands over a LinkedIn export, and Dazai finishes the rest without involving them again.

---

## 6. Performance Tracking (Version 1 Design)

- **Account level:** daily impressions, engagement, and followers come from a LinkedIn-exported spreadsheet the user provides. Only the row for the relevant date is used.
- **Post level:** analytics for each post are requested every 24 hours for 7 days, as a screenshot from the user. The first input is stored as given. Every later input is stored as a delta (new reading minus previous total), so each row records real change rather than a full repeated snapshot.
- Weekly slot usage is recorded as a ledger when a post is created.

---

## 7. Memory (Version 1 Design)

- **USER.md** (Maha): real facts, preferences, and context from her conversations with the user. She writes to it deliberately through a tool call, based on what was actually said.
- **EXPERIENCE.md** (Maha): what she has learned about the account's performance. Most updates are a narrow rolling check of the last 7 days. A deeper periodic pass lets her decide what data to pull (technique performance over a longer window, timing against results). The two jobs are kept separate.
- Writes are always deliberate tool calls, never a passive transcript dump.

---

## 8. The Frontend's Look and Feel

- Follows the Port Mafia and Dazai vibe from _Bungo Stray Dogs_: a single dark theme of pitch black and deep charcoal with minimal sharp crimson or wine accents, like a dark IDE crossed with a shadow organization.
- Clean. No excess buttons, borders, boxes, shadows, or emojis. Rarely used features (filters, search, timelines, edit and delete) sit behind interactions, not on the surface.
- Character art is used sparingly so it does not crowd the user. Animated 2D avatars are a possible future option and are not being built now.
- Where possible, forms are replaced by lightweight, rewarding authoring experiences.
- The logo uses local fonts: Higher Jump and Deadly Target Demo.

---

## 9. Decisions, Reversals, and Why

These explain why the system is shaped the way it is. Each was a deliberate engineering call by the creator.

**Harness leads, models follow.** Pipeline order is enforced in code, not left to prompts. Models drift; code does not.

**Tasks centralized in Dazai.** Subordinate agents were not allowed to manage their own tasks or reach the user directly. A single owner filters noise, so the user is only interrupted when it truly matters.

**Automated runs got tools after all (reversal).** Scheduled runs originally had no tool discretion; the harness pre-fetched everything. That broke down whenever a stage's job was open-ended analysis, because the harness would have to guess everything the stage might need. The fix was a deliberately curated, limited toolset, not open-ended access. The harness still decides which tools exist.

**Delta ledger instead of snapshots.** Storing a full analytics snapshot per reading created redundant rows that were rarely reused. Storing the change between readings keeps a true ledger, matching how weekly slot usage is already tracked.

**Tags attached by the harness, not the model.** Passing post IDs between stages, or letting the model create the tagged post itself, added fragility. Stages pass tag identifiers forward and the harness attaches them once the post exists.

**Generic examples only in agent instructions.** Domain-specific examples pulled all generated content toward the wrong subject (early output anchored toward software engineering). Examples are now generic, and techniques are portable.

**Seed data kept apart from conversation history.** Mixing them corrupted the history shown to the model.

**Turn-specific queue job IDs.** Bare message IDs caused silent deduplication stalls across multi-turn stages.

**Runaway tool loops capped.** A lighter Gemini model (gemini-3.5-flash-lite) looped away in the tool-call cycle, so a maximum iteration cap exists and the model choice is verified before trust.

**Same-origin proxy for live streaming.** Browsers blocked cross-origin streaming behind Cloudflare's certificate chain. A same-origin Next.js route now proxies the stream, with the session cookie forwarded server to server.

**Backend-for-frontend auth.** Cookies set by a subdomain were host-only, so authentication moved to a pattern where the Next.js server makes the fetches and sets its own cookies. Token refresh requests are coalesced to prevent a thundering herd.

**Build-time environment variables.** `NEXT_PUBLIC_` values are frozen at build, so Docker-internal hostnames use non-prefixed variables.

**Media as a creative brief.** The writing role originally filled fixed content slots for media. It now produces a direction (a creative brief) with the template as a loose hint, which gives better results.

**Gemini stays primary.** OpenRouter with Nemotron 3 Ultra is the fallback candidate, but it has not been tested against the real tool schemas or persona adherence, so it is not trusted for unattended runs.

---

## 10. Current State and Future Plans

**Version 1 (disabled).** The LinkedIn pipeline backend was fully built (queues, caching, streaming with iteration limits, scheduled runs with timezone-aware windows, delta-based performance ingestion, image generation groundwork), along with the agent instruction documents, authentication through Home, live streaming to the frontend, and a resume flow for runs that fail mid-stream. It ran in active testing and processed automated jobs, then the creator switched it off.

**Why version 1 was retired.** The creator's reasons, in his own terms:

- **AI could not write a wholesome post.** When he used the AI to produce real posts, the results were messy and did not match what he expected.
- **AI could not produce good graphics.** This was the main reason. A human can write a post in a few minutes, but the media is what takes time, and the AI could not generate graphics good enough to remove that bottleneck.
- **The pipeline leaned too heavily on the user.** It asked the user questions two or three times per post, which slowed everything and kept the AI from its real potential, which he sees as **grunt work**.

**Version 2 (next).**

- The primary focus and approach change entirely from version 1.
- Sales is integrated into the platform.
- The AI is meant to do grunt work rather than creative authoring that needs repeated user input.
- Further details are not yet decided. Do not invent them.

**What carries forward.** The multi-agent hierarchy, Home and multi-tenancy, the self-hosted infrastructure, the queue and streaming architecture, and the design principles in section 9 remain the foundation.

**Still true from earlier planning, not built.** These were intentions for the platform and may be reshaped by version 2:

- A daily journal for Dazai, with tagged summaries of the previous day and a freshness signal.
- A future Daily Organization holding knowledge about the user's wider life, with Home routing requests between organizations.
- More platforms, each with its own agent under Dazai.
- Task ownership long term: undecided.
- Animated 2D avatars for the characters, a possible future option.

---

## 11. Quick Answers

- **Who built The Port Mafia?** Muhammad Ateeb Hussain, a Lahore-based full-stack and AI/Automation developer, working solo.
- **Who does it work for?** Each user who connects their accounts. The creator is a separate person from the user unless stated otherwise.
- **Is it running?** Version 1, the LinkedIn content pipeline, is disabled. Maha no longer writes posts. Version 2 is being planned.
- **What is version 2?** A new direction with a different primary focus that integrates sales. Details are not finalized.
- **Why was version 1 retired?** AI could not write good posts or produce good graphics, media was the main bottleneck, and the pipeline needed too much user input.
- **What does the creator want the AI to do instead?** Grunt work.
- **Who ran the LinkedIn account in version 1?** Maha, under Dazai.
- **Does Dazai post?** No.
- **Who does the user talk to?** Dazai for the organization as a whole.
- **Is the daily journal live?** No, it is planned.
- **Is the fallback model in use?** No, Gemini is primary.
- **Where is it hosted?** Self-hosted on the creator's home server behind a Cloudflare Tunnel.
- **What is the creator studying?** BS in Data Science at UET Lahore, 2026 to 2030.
