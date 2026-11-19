# UABS Alumni Launch 2026 (React + Vite)

Landing page and registration at `/`, admin dashboard at `/admin`.

    npm install
    npm run dev

Demo mode (no VITE_API_URL): admin login is `admin` / `admin123`, sample registrants are seeded,
and anyone who registers on the landing page appears in the dashboard. Scan the QR on the
confirmation pass in the Scanner tab to check them in.

- Event content: `src/data.js`
- Backend contract and env: `.env.example` (copy to `.env`)
- The QR value must be a unique, unguessable code per registrant, returned by `/register` as `reference`
  and emailed as the QR code. `/admin/checkin` must mark check-in atomically.
- The camera scanner needs HTTPS (or localhost).
