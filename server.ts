import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeGclTZ7rbhcrmkdVflbWz43e3jHxO9GSFBf4_Fy__SAO3YqEYzAbR5p7Zszr6x2f4/exec";

  // Proxy for Google Script Data
  app.get("/api/data", async (req, res) => {
    try {
      const response = await axios.get(GOOGLE_SCRIPT_URL, {
        timeout: 15000,
        maxRedirects: 5
      });
      res.json(response.data);
    } catch (error: any) {
      console.warn("Error fetching from Google Script:", error.message);
      res.status(500).json({ error: "Failed to fetch data from Google Script", details: error.message });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      // Google Apps Script often works better when receiving JSON as text/plain to avoid CORS/Preflight issues
      // Even though we are on the server, it's a safer way to send data to GAS
      const response = await axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(req.body), {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 15000,
        maxRedirects: 5
      });
      res.json(response.data);
    } catch (error: any) {
      console.warn("Error posting to Google Script:", error.message);
      res.status(500).json({ error: "Failed to post data to Google Script", details: error.message });
    }
  });

  // Helper to escape HTML for Telegram while preserving <b> tags
  const safeTelegramHTML = (str: string) => {
    // First escape everything
    let escaped = str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Then restore the <b> and </b> tags
    return escaped
      .replace(/&lt;b&gt;/g, "<b>")
      .replace(/&lt;\/b&gt;/g, "</b>");
  };

  // API endpoint for Telegram notifications
  app.post("/api/notify", async (req, res) => {
    const { message } = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN || "7801195093:AAEnxY9OS3Kq4GK5gQEDRShouE7G6KpctK8";
    const chatId = process.env.TELEGRAM_CHAT_ID || "-5295571127";

    if (!token) {
      return res.json({ success: false, message: "Telegram token not configured" });
    }

    try {
      const safeMessage = safeTelegramHTML(message);
      
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: safeMessage,
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
