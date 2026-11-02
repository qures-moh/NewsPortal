
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Headphones } from "lucide-react";
import "./NewsTextToSpeech.css";

const NewsTextToSpeech = ({
  title,
  excerpt,
  content,
  language = "en",
  articleId,
}) => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const utteranceRef = useRef(null);

  const isHindi = language === "hi";

  // Extract readable text from HTML content
  const extractText = (html = "") => {
    const doc = new DOMParser().parseFromString(html, "text/html");

    doc.querySelectorAll("script, style").forEach((element) => {
      element.remove();
    });

    return (doc.body.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Stop audio when article or language changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setStatus("idle");
    setError("");

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [language, articleId]);

  const handlePlay = () => {
    if (!("speechSynthesis" in window)) {
      setError(
        isHindi
          ? "आपका ब्राउज़र ऑडियो सुविधा का समर्थन नहीं करता।"
          : "Your browser does not support text-to-speech."
      );
      return;
    }

    const articleText = [
      title,
      excerpt,
      extractText(content),
    ]
      .filter(Boolean)
      .join(". ");
      console.log({
  language,
  title,
  excerpt,
  extractedContent: extractText(content),
  textLength: articleText.length,
  sample: articleText.slice(0, 500),
});

    if (!articleText.trim()) {
      setError(
        isHindi
          ? "लेख की सामग्री उपलब्ध नहीं है।"
          : "Article content is not available."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(articleText);

    utterance.lang = isHindi ? "hi-IN" : "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setStatus("playing");
      setError("");
    };

    utterance.onend = () => {
      setStatus("idle");
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      if (
        event.error !== "canceled" &&
        event.error !== "interrupted"
      ) {
        setError(
          isHindi
            ? "ऑडियो चलाने में समस्या हुई।"
            : "Unable to play audio."
        );
      }

      setStatus("idle");
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setStatus("paused");
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setStatus("playing");
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setStatus("idle");
    setError("");
  };

  return (
    <div className="news-tts">
      <div className="news-tts-header">
        <div className="news-tts-icon">
          <Headphones size={22} />
        </div>

        <div>
          <h3>
            {isHindi ? "इस खबर को सुनें" : "Listen to this article"}
          </h3>
          <p>
            {isHindi
              ? "अपनी भाषा में समाचार सुनें"
              : "Listen to the article in your selected language"}
          </p>
        </div>
      </div>

      <div className="news-tts-controls">
        {status === "idle" && (
          <button type="button" onClick={handlePlay}>
            <Play size={17} />
            {isHindi ? "सुनें" : "Listen"}
          </button>
        )}

        {status === "playing" && (
          <button type="button" onClick={handlePause}>
            <Pause size={17} />
            {isHindi ? "रोकें" : "Pause"}
          </button>
        )}

        {status === "paused" && (
          <button type="button" onClick={handleResume}>
            <Play size={17} />
            {isHindi ? "जारी रखें" : "Resume"}
          </button>
        )}

        {status !== "idle" && (
          <button
            type="button"
            className="tts-stop"
            onClick={handleStop}
          >
            <Square size={15} />
            {isHindi ? "बंद करें" : "Stop"}
          </button>
        )}

        <span className="tts-language">
          {isHindi ? "हिंदी" : "English"}
        </span>
      </div>

      {error && (
        <p className="tts-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default NewsTextToSpeech;
