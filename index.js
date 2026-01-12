const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONFIG LOADER (PER CHURCH) ==========

const churchConfigs = {}; // simple cache

function loadChurchConfig(churchId = "default") {
  if (churchConfigs[churchId]) return churchConfigs[churchId];

  const baseDir = __dirname;
  const configPath = path.join(baseDir, "configs", `${churchId}.json`);
  let config;

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(raw);
  } catch (e) {
    // Fallback to default.json
    const defaultPath = path.join(baseDir, "configs", "default.json");
    const rawDefault = fs.readFileSync(defaultPath, "utf8");
    config = JSON.parse(rawDefault);
  }

  churchConfigs[churchId] = config;
  return config;
}

// ========== OPTIONAL AI REWRITE (SAFE WRAPPER) ==========

// NOTE: For now, if OPENAI_API_KEY is not set, we just return the original text.
// When you're ready to wire AI, set process.env.OPENAI_API_KEY and this will try
// to call OpenAI's API using fetch (Node 18+ has global fetch).

async function rewriteAnswer(originalText) {
  // No API key? Just return as-is.
  if (!process.env.OPENAI_API_KEY) {
    return originalText;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You rewrite short informational answers for clarity only. " +
              "Do NOT add theology, claims about God, advice, promises, or anything beyond what is given."
          },
          {
            role: "user",
            content:
              "Rewrite this answer for clarity only. Do not add or change the meaning:\n\n" +
              originalText
          }
        ],
        temperature: 0
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("OpenAI error:", res.status, text);
      return originalText;
    }

    const data = await res.json();
    const content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    return (content || "").trim() || originalText;
  } catch (err) {
    console.error("rewriteAnswer error:", err.message);
    return originalText;
  }
}

// ========== EMAIL SENDER (PRAYER / OFFICE ROUTING) ==========

async function sendEmail(to, subject, msg) {
  if (!to || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Email not sent - SMTP or target not configured.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: msg || ""
  });
}

// ========== BOT ENDPOINT ==========

app.post("/bot", async (req, res) => {
  const { churchId = "default", intent, message, email } = req.body || {};

  const config = loadChurchConfig(churchId);
  const qna = config.qna || {};
  const routing = config.routing || {};

  // 1) Known intents from Q&A
  if (intent && qna[intent]) {
    const rewritten = await rewriteAnswer(qna[intent]);
    return res.json({ response: rewritten });
  }

  // 2) Prayer request intent - with captured message
  if (intent === "prayer-request" && message) {
    const to =
      routing.prayerEmail || routing.officeEmail || process.env.TARGET_EMAIL;

    if (to) {
      await sendEmail(
      to,
     `New prayer request`,
     `From: ${name || "Unknown"}
      Email: ${email || "N/A"}
      Phone: ${phone || "N/A"}

      Request:
      ${message}`
      );

      );
    }

    return res.json({
      response: "Thank you. Your prayer request has been sent to our prayer team."
    });
  }

  // 3) Generic message fallback (contact/office)
  if (message) {
    const to = routing.officeEmail || process.env.TARGET_EMAIL;
    if (to) {
      await sendEmail(
        to,
        `New message via assistant from ${email || "unknown"}`,
        message
      );
    }
  }

  return res.json({
    response: "Thank you for your message. Someone from the church will follow up with you."
  });
});

// ========== SERVE widget.js FOR EMBED ==========

app.get("/widget.js", (req, res) => {
  res.sendFile(path.join(__dirname, "widget.js"));
});

// ========== START SERVER ==========

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bot running on port ${port}`);
});
