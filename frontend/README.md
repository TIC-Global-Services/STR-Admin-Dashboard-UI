# STR Admin Frontend

Next.js frontend for the STR Admin system.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (State Management)
- **TanStack Query** (Data Fetching)
- **Axios** (HTTP Client)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── login/             # Login page
│   ├── dashboard/         # Dashboard and protected routes
│   └── layout.tsx         # Root layout
├── components/
│   ├── layout/            # Layout components (Sidebar, Header)
│   └── providers/         # Context providers
├── lib/
│   ├── api/               # API client and endpoints
│   └── store/             # Zustand stores
└── middleware.ts          # Auth middleware

```

## Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Permission-based UI rendering
- Automatic token refresh
- Protected routes with middleware
- Responsive layout with sidebar navigation

## Default Credentials

Use the super admin credentials from the backend seed:
- Email: `manojkumararumainathan@gmail.com`
- Password: `12345678`

## Available Routes

- `/login` - Login page (public)
- `/dashboard` - Main dashboard (protected)
- `/users` - User management (requires USER_VIEW permission)
- `/memberships` - Membership applications (requires MEMBERSHIP_APPROVE)
- `/news` - News management (requires NEWS_CREATE)
- `/social` - Social posts (requires SOCIAL_EMBED_UPDATE)
- `/analytics` - Analytics dashboard (requires ANALYTICS_VIEW)
- `/audit` - Audit logs (protected)

## Next Steps

Share your design and we'll build out the specific screens and functionality!
