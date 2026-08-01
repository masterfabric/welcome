<div align="center">
<h1 style="font-weight: 300;">MasterFabric Welcome</h1>
<p>The open-source developer onboarding and internal ops portal.</p>
<p><small>From Chaos to Clarity.</small></p>
</div>

## v.0.1.1 - Alpha: Our Vision 🔭

Our vision for `v.0.1.1-Alpha` is simple: **to give startups, software companies, and small-to-mid-size organizations a powerful, open-source alternative to scattered, expensive SaaS tools.**

Think of it as the master fabric weaving together all your essential developer operations. No more duct-taping five different services together. (And no more hunting down that one guy who knows how the script works. You know who we're talking about.)

This is for the builders, the creators, and the teams that just want to get stuff done.

## Why Use This Project? 🤔

Let's be honest, your startup's 'process' is probably a ~~mess of spreadsheets, Slack DMs,~~ and that one crucial script on a laptop that everyone's afraid to touch. MasterFabric Welcome is for teams that have graduated from ~~pure chaos~~ to **'organized' chaos** and are tired of paying for a dozen different tools that don't talk to each other. It consolidates developer onboarding, worklogs, event management, and support into **one place**. Think of it as a single source of truth that *actually gets updated*, so you can spend less time hunting for that one document and more time arguing about tabs versus spaces. It’s the open-source, cost-effective way to **pretend you have a well-funded ops team**.

## Features: Your All-in-One Ops Portal ✨

This project isn't just a collection of random tools; it's a cohesive system designed to solve specific problems for growing dev teams.

- **GitHub-Based Onboarding & Profiles: 🐙**
    - **Why:** Stop manually creating accounts. Developers can log in with their existing GitHub accounts, reducing friction and letting them get started in seconds. Profiles are centralized and easy to manage.

- **Dynamic Onboarding Checklists: 📋**
    - **Why:** Ensure every new hire has a consistent, high-quality onboarding experience. Create, manage, and assign checklists to guide developers through everything from setting up their environment to understanding team workflows. No more "Did I forget to tell them about...?" moments.

- **Worklog & Progress Tracking: 📝**
    - **Why:** Gain visibility into what your team is working on without micromanaging. It provides a simple way for developers to log their work, helping with project tracking, reporting, and knowledge sharing.

- **Internal Event Management: 🎉**
    - **Why:** Easily create and manage internal events like tech talks, team-building activities, or workshops. The system handles registration and ticketing, so you can focus on the content, not the logistics.

- **Integrated Support Ticket System: 🎫**
    - **Why:** Centralize internal support requests. Instead of questions getting lost in Slack or email, you have a structured system to track issues, assign ownership, and ensure problems get resolved.

- **Company Email Verification (OTP): 📧**
    - **Why:** Securely verify that users belong to your organization by having them confirm ownership of a company email address. This is crucial for controlling access to internal resources.

## Tech Stack 🛠️

- Next.js 15 + React 19 + TypeScript
- Supabase (database + auth + RLS)
- Tailwind CSS
- Sentry for error monitoring

## Scripts 📜

```bash
# local development
npm run dev

# production build
npm run build && npm start

# lint and type-check
npm run lint
npm run type-check
```

## Getting Started 🚀

```bash
npm install
cp env.example .env.local
# Fill .env.local with your Supabase + GitHub OAuth credentials
npm run dev
```

Required envs (see `env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 - `RESEND_API_KEY`
 - `RESEND_FROM` (default: `no-reply@masterfabric.co`)
 - `NEXT_PUBLIC_APP_URL` (e.g., `http://localhost:3000`)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- (optional) Sentry if you enable monitoring:
-   - `NEXT_PUBLIC_SENTRY_DSN`
-   - `SENTRY_AUTH_TOKEN`
-   - `SENTRY_ORG`
-   - `SENTRY_PROJECT`
- reCAPTCHA (optional):
-   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
-   - `RECAPTCHA_SECRET_KEY`

## Database 🗄️

Apply SQL in Supabase (in this order as needed):

## Development Notes 📝

- Error boundaries: `src/app/error.tsx`, `src/app/global-error.tsx`
- Supabase helpers and data access: `src/lib/supabase.ts`
- Sentry helpers: `src/lib/sentry.ts`
- UI components: `src/components/*`

### Monitoring (Sentry)

Sentry is integrated for error tracking and source maps.

1. Set env vars (see above).
2. Build will automatically upload source maps during `npm run build`.
3. Error boundaries will report exceptions to Sentry.

Note: Next.js may deprecate `sentry.client.config.ts` under Turbopack; this repo includes client/server config files and `instrumentation.ts`.

## Contributing 🙌

Issues and PRs are welcome. Please run `npm run lint` and `npm run type-check` before submitting.

## License 📄

Licensed under GNU AGPLv3 with Additional Terms. See `LICENSE` for the full text.

- Repository: https://github.com/masterfabric/welcome
- Organization website: https://masterfabric.co
- Contact: license@masterfabric.co

Next.js + Supabase notice (courtesy):
- If you deploy this software or derivatives as a Next.js project using Supabase, please email a short notice to `license@masterfabric.co` with:
  - Repository URL or product link
  - Deploy target (e.g., production, internal)
  - Maintainer contact

Web projects meta requirement:
- Include a MasterFabric-provided license code as a meta tag in your main HTML (e.g., `index.html`):
  - `<meta name="masterfabric-license" content="<your-license-code>" />`
  - Request a code via `license@masterfabric.co`


Built with ❤️ for the MasterFabric development team and the open-source community.