require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet());
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));

const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Too many submissions. Please try again later."
});

app.use(express.static(path.join(__dirname, "public")));

const allowedClasses = new Set([
  "Nursery",
  "Primary",
  "JSS",
  "SSS"
]);

function clean(value, maxLength = 120) {
  return String(value || "").trim().slice(0, maxLength);
}

function validPhone(phone) {
  // Accept common international and Nigerian phone formats.
  return /^\+?[0-9][0-9\s()-]{7,18}$/.test(phone);
}

function getTransporter() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SCHOOL_EMAIL"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

app.post("/submit-application", applicationLimiter, async (req, res) => {
  // Hidden honeypot field: real visitors should leave it empty.
  if (clean(req.body.website, 200)) {
    return res.redirect(303, "/?application=success#apply");
  }

  const parentName = clean(req.body.parent_name, 100);
  const phone = clean(req.body.phone, 30);
  const childName = clean(req.body.child_name, 100);
  const ageValue = clean(req.body.child_age, 3);
  const classApplyingFor = clean(req.body.class_applying_for, 30);
  const message = clean(req.body.message, 1500);

  const age = Number(ageValue);
  const errors = [];

  if (parentName.length < 2) errors.push("Enter the parent or guardian's name.");
  if (!validPhone(phone)) errors.push("Enter a valid phone number.");
  if (childName.length < 2) errors.push("Enter the child's name.");
  if (!Number.isInteger(age) || age < 2 || age > 18) errors.push("Enter a valid child age between 2 and 18.");
  if (!allowedClasses.has(classApplyingFor)) errors.push("Select a valid class.");

  if (errors.length) {
    return res.status(400).send(`
      <!doctype html><html lang="en"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Check your application</title></head>
      <body style="font-family:Arial,sans-serif;max-width:650px;margin:50px auto;padding:20px">
      <h1>Please check your details</h1>
      <ul>${errors.map((e) => `<li>${e}</li>`).join("")}</ul>
      <p><a href="/#apply">Return to the application form</a></p>
      </body></html>
    `);
  }

  try {
    const transporter = getTransporter();

    const text = [
      "New admission enquiry — Christower International School",
      "",
      `Parent/guardian: ${parentName}`,
      `Phone: ${phone}`,
      `Child: ${childName}`,
      `Child age: ${age}`,
      `Class: ${classApplyingFor}`,
      "",
      "Message:",
      message || "(No additional message)"
    ].join("\n");

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.SCHOOL_EMAIL,
      subject: "New school admission enquiry",
      text
    });

    return res.redirect(303, "/?application=success#apply");
  } catch (error) {
    // Log server-side details only; do not expose credentials or SMTP errors to visitors.
    console.error("Application email failed:", error.message);
    return res.redirect(303, "/?application=error#apply");
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((err, _req, res, _next) => {
  console.error("Server error:", err.message);
  res.status(500).send("Something went wrong. Please try again later.");
});

app.listen(PORT, () => {
  console.log(`Christower website server running at http://localhost:${PORT}`);
});
