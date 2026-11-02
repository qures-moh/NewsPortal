
const express = require("express");
const env = require("../config/env");

const ttsRouter = express.Router();

const SUPPORTED_LANGUAGES = ["hi-IN", "en-US"];
const SUPPORTED_VOICES = ["aria", "jason", "john", "leo", "sofia"];

ttsRouter.post("/speech", async (req, res, next) => {
  try {
    const { text, language = "en-US", voice = "aria" } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Article text is required",
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Text cannot exceed 1000 characters",
      });
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language",
      });
    }

    if (!SUPPORTED_VOICES.includes(voice)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported voice",
      });
    }

    const response = await fetch("https://api.utter.cc/v1/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UTTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        language,
        voice,
        format: "wav",
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorDetails = await response.text();

      console.error("Utter API error:", response.status, errorDetails);

      return res.status(502).json({
        success: false,
        message: "Speech generation failed",
      });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    if (!audioBuffer.length) {
      return res.status(502).json({
        success: false,
        message: "Empty audio received from TTS provider",
      });
    }

    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": audioBuffer.length,
      "Cache-Control": "no-store",
    });

    return res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
});

module.exports = ttsRouter;
