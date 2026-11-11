# Christower International School — Node.js backend

## What this backend does
- Serves the website from the `public` folder.
- Receives admission enquiries at `POST /submit-application`.
- Validates parent/guardian name, phone, child name, age and class.
- Sends a plain-text notification to the configured school email through SMTP.
- Applies a submission rate limit and a hidden honeypot spam check.
- Redirects visitors to a success or error message.

## Requirements
- Node.js 18 or newer
- SMTP account/credentials from your email provider or hosting provider

## Run locally
1. Install Node.js.
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Copy `.env.example` to a new file named `.env`.
5. Edit `.env` with real SMTP settings and the school's real receiving email.
6. Run `npm start`.
7. Open `http://localhost:3000`.

## Important configuration
Do not publish your `.env` file or share SMTP passwords. Keep `.env` out of Git (it is included in `.gitignore`).
The sample SMTP values are placeholders and will not send email until replaced with valid settings.

## Before putting the site online
- Deploy to a Node.js-compatible host.
- Set the environment variables in the host's dashboard.
- Enable HTTPS.
- Confirm the school's correct email address and SMTP provider.
- Test an enquiry from a real phone and confirm the email arrives.
- Add a privacy notice explaining how parent/child information is used and retained.
- Consider database storage only if the school needs an application dashboard; this starter sends email and does not save applications to a database.

## Form fields
The frontend form names must remain:
`parent_name`, `phone`, `child_name`, `child_age`, `class_applying_for`, `message`.
