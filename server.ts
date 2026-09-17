import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for Telegram notifications.
  // The message arrives already built (and its dynamic fields already HTML-escaped)
  // by src/services/notify.ts, so it's forwarded to Telegram as-is.
  app.post("/api/notify", async (req, res) => {
    const { message } = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.json({ success: false, message: "Telegram not configured" });
    }

    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      });
      res.json({ success: true });
    } catch (error: any) {
      // Log as warning to avoid cluttering platform error logs
      console.warn("Telegram notification failed:", JSON.stringify(error.response?.data || error.message));
      res.json({ success: false, error: "Failed to send notification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
