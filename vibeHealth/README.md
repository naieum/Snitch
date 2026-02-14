# VibeHealth - Telehealth Platform

A modern telehealth platform built with Next.js 14, Prisma, and Tailwind CSS.

> **Warning:** This application is intentionally vulnerable and is designed as a
> demonstration target for security auditing tools. **Do not deploy to production.**

## Quick Start

```bash
# Install dependencies
npm install

# Set up the database
npx prisma db push

# Seed with demo data
npm run db:seed

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role    | Email                   | Password  |
|---------|-------------------------|-----------|
| Admin   | admin@vibehealth.io     | admin123  |
| Doctor  | dr.smith@vibehealth.io  | doctor123 |
| Patient | patient@example.com     | patient123|

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma + SQLite
- **Auth:** better-auth
- **Payments:** Stripe
- **AI:** OpenAI GPT-4
- **Email:** Resend
- **SMS:** Twilio
- **Cache:** Upstash Redis
- **Storage:** AWS S3
- **Styling:** Tailwind CSS

## Features

- Patient registration and authentication
- Appointment booking
- Secure messaging between patients and doctors
- AI-powered symptom checker
- Prescription management
- Online billing and payments
- Admin dashboard
- Data export and account management

## Project Structure

```
vibeHealth/
├── app/                  # Next.js App Router pages
│   ├── api/              # API routes
│   ├── admin/            # Admin panel
│   ├── appointments/     # Appointment booking
│   ├── billing/          # Payment processing
│   ├── chat/             # Messaging
│   ├── dashboard/        # User dashboard
│   ├── login/            # Authentication
│   ├── prescriptions/    # Rx management
│   ├── settings/         # User settings
│   ├── signup/           # Registration
│   └── symptom-checker/  # AI symptom analysis
├── components/           # Shared React components
├── lib/                  # Utility libraries and configs
├── prisma/               # Database schema and seeds
└── public/               # Static assets
```
