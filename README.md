# Court Time — Pickleball Booking Website

A working booking site: a public schedule people book from directly, and a
password-protected admin dashboard to view, add, or remove bookings. Built with
Next.js so it deploys straight to Vercel from a GitHub repo, with a real Postgres
database (Neon) so the schedule updates live for every visitor — no double-booking,
ever, because the database itself refuses to store two bookings for the same slot.

## How the pieces fit together

- **GitHub** — stores your code. Every time you push, Vercel notices and redeploys.
- **Vercel** — hosts the site and runs your `app/api/*` files as serverless functions
  (this is the "Option 2" setup you described — no separate backend server needed).
- **Neon Postgres** — the actual database. This is the shared source of truth: when
  User A books Tuesday 6–7 PM, that row is written to this database. When User B
  loads the page a second later, they fetch fresh from that same database and see
  it's taken. That's what makes it "live" — it's not that GitHub updates automatically,
  it's that both users are always reading from the same database.

## Step 1 — Get the code onto GitHub

1. Create a new empty repository on [github.com](https://github.com) (don't
   initialize it with a README).
2. On your computer, in this project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

## Step 2 — Create the database (Neon, free)

1. Go to [vercel.com](https://vercel.com) and sign up/log in with your GitHub account.
2. From your Vercel dashboard, go to the **Storage** tab → **Create Database** →
   choose **Neon** (Postgres) → follow the prompts to create a free database.
3. Once created, Vercel will show you connection details. Copy the value labeled
   `DATABASE_URL` (or `POSTGRES_URL` — either works, you'll paste it into your own
   `DATABASE_URL` variable in the next step).

   You don't need to create any tables yourself — the app creates the `bookings`
   table automatically the first time it runs.

## Step 3 — Deploy to Vercel

1. Still in Vercel, click **Add New → Project**.
2. Select the GitHub repo you pushed in Step 1. Vercel auto-detects it's a Next.js
   app — you don't need to change any build settings.
3. Before clicking Deploy, open **Environment Variables** and add three:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the connection string from Step 2 |
   | `ADMIN_PASSWORD` | whatever password you want to log into `/admin` with |
   | `ADMIN_SECRET` | a long random string (run `openssl rand -hex 32` in a terminal, or mash your keyboard for 40+ characters) |

4. Click **Deploy**. In about a minute you'll get a live URL like
   `your-project.vercel.app`.

That's it — that IS the "auto-updating GitHub website" you asked about. From now on,
every time you `git push` to `main`, Vercel automatically rebuilds and redeploys
the live site within a minute or two. No manual re-upload, ever.

## Step 4 — Try it

- Visit `your-project.vercel.app` — this is the public booking page. Pick a date,
  click an open time slot, enter a name and number, confirm.
- Open the same URL in a different browser (or incognito window) and pick the same
  date — that slot now shows as **Booked**, because both browsers are reading from
  the same Neon database. If two people somehow click "Book" on the same slot at
  the exact same instant, the database's own uniqueness rule guarantees only one
  of them succeeds — the second gets a friendly "someone just booked that" message.
- Visit `your-project.vercel.app/admin`, log in with the `ADMIN_PASSWORD` you set,
  and you'll see every booking across all dates, plus the ability to manually add
  or remove any booking (for walk-ins, phone bookings, cancellations, etc).

## Customizing

- **Opening hours / number of courts**: edit `lib/slots.js` — change `OPEN_HOUR`,
  `CLOSE_HOUR`, or `COURT_COUNT`, commit, and push. Vercel redeploys automatically.
- **Colors / branding**: edit `app/globals.css` (the CSS variables at the top) and
  the text in `app/page.js`.
- **Admin password**: change the `ADMIN_PASSWORD` environment variable in your
  Vercel project settings (Settings → Environment Variables), then redeploy
  (Vercel → Deployments → ⋯ → Redeploy) for it to take effect.

## Running it on your own computer first (optional but recommended)

1. Install [Node.js](https://nodejs.org) if you don't have it.
2. In the project folder:
   ```bash
   npm install
   cp .env.example .env.local
   ```
3. Fill in `.env.local` with the same `DATABASE_URL`, `ADMIN_PASSWORD`, and
   `ADMIN_SECRET` values from Step 3 (or your own Neon database if you want a
   separate dev database).
4. Run:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` to test the booking page, and
   `http://localhost:3000/admin` to test the admin dashboard.

## Payment & approval flow

Booking a slot now requires proof of payment — no more instant-book:

1. Customer picks a slot, enters name/contact, then sees the **payment step**:
   your QR code (`public/payment-qr.png`), bank/account details, and a form to
   upload a screenshot or PDF of their payment (max 5MB), with optional amount
   and reference number fields.
2. On submit, the booking is saved with status **Pending Approval** — the slot
   is held (nobody else can book it) but isn't confirmed yet.
3. In `/admin`, the **Pending Approval** tab shows these bookings with a
   **View Receipt** link (opens the uploaded image/PDF) plus **Approve** and
   **Reject** buttons.
   - **Approve** → status becomes **Confirmed**.
   - **Reject** → the booking is deleted and the slot is immediately released
     back to the public schedule.
4. Bookings you add yourself from **+ Add Booking** (walk-ins/phone bookings)
   skip this and are marked Confirmed right away, since there's no online
   payment to verify.

To change the QR code or payment details later: replace
`public/payment-qr.png` with a new image, and edit the bank name/account
name/last-4-digits text in `lib/payment.js`, then commit and push.

Receipts are stored directly in the Neon database (not a separate file
storage service), which keeps setup simple — no extra accounts needed. This
comfortably handles a small court's booking volume; if you ever need heavier
file storage (e.g. thousands of receipts), that can be moved to something
like Vercel Blob or Cloudinary later.

## Notes on the admin login

This uses a single shared password (not individual accounts), which is normal for
a small single-manager booking site. The password is checked on the server and a
signed, expiring session cookie is issued — the password itself is never stored in
the browser. If you later want multiple staff accounts with separate logins, that's
a bigger upgrade (e.g. adding NextAuth.js with a users table) — just ask and it can
be added on top of this same codebase.
