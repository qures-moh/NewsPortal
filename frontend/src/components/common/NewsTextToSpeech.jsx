
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Headphones } from "lucide-react";
import "./NewsTextToSpeech.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const NewsTextToSpeech = ({
  title,
  excerpt,
  content,
  language = "en",
  articleId,
}) => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const audioRef = useRef(null);
  const controllerRef = useRef(null);
  const audioUrlRef = useRef(null);
  const chunksRef = useRef([]);
  const chunkIndexRef = useRef(0);

  const isHindi = language === "hi";

  const extractText = (html = "") => {
    const doc = new DOMParser().parseFromString(html, "text/html");

    doc.querySelectorAll("script, style").forEach((element) => {
      element.remove();
    });

    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  };

  const splitText = (text, maxLength = 1000) => {
    const sentences = text.match(/[^.!?।]+[.!?।]?/g) || [];
    const chunks = [];
    let currentChunk = "";

    const addWords = (sentence) => {
      const words = sentence.trim().split(/\s+/);

      for (const word of words) {
        if (word.length > maxLength) {
          if (currentChunk) {
            chunks.push(currentChunk);
            currentChunk = "";
          }

          for (let i = 0; i < word.length; i += maxLength) {
            chunks.push(word.slice(i, i + maxLength));
          }

          continue;
        }

        const nextChunk = currentChunk
          ? `${currentChunk} ${word}`
          : word;

        if (nextChunk.length > maxLength) {
          chunks.push(currentChunk);
          currentChunk = word;
        } else {
          currentChunk = nextChunk;
        }
      }
    };

    for (const sentence of sentences) {
      addWords(sentence);
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  };

  const releaseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const handleStop = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    releaseAudio();

    chunksRef.current = [];
    chunkIndexRef.current = 0;

    setStatus("idle");
    setError("");
  };

  const playChunk = async () => {
    const controller = controllerRef.current;

    if (!controller || controller.signal.aborted) return;

    if (chunkIndexRef.current >= chunksRef.current.length) {
      releaseAudio();
      controllerRef.current = null;
      setStatus("idle");
      return;
    }

    try {
      setStatus("loading");

      const response = await fetch(`${API_BASE_URL}/tts/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: chunksRef.current[chunkIndexRef.current],
          language: isHindi ? "hi-IN" : "en-US",
          voice: "aria",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Speech generation failed");
      }

      if (controller.signal.aborted) return;

      const audioBlob = await response.blob();

      if (controller.signal.aborted) return;

      releaseAudio();

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        if (controller.signal.aborted) return;

        releaseAudio();
        chunkIndexRef.current += 1;
        playChunk();
      };

      audio.onerror = () => {
        if (controller.signal.aborted) return;

        setError(
          isHindi
            ? "ऑडियो चलाने में समस्या हुई।"
            : "Unable to play audio."
        );

        handleStop();
      };

      await audio.play();
      setStatus("playing");
      setError("");
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error("TTS Error:", error);

      setError(
        isHindi
          ? "ऑडियो बनाने में समस्या हुई। कृपया दोबारा प्रयास करें।"
          : "Unable to generate audio. Please try again."
      );

      handleStop();
    }
  };

  const handlePlay = () => {
    const articleText = [
      title,
      excerpt,
      extractText(content),
    ]
      .filter(Boolean)
      .join(". ");

    if (!articleText.trim()) {
      setError(
        isHindi
          ? "लेख की सामग्री उपलब्ध नहीं है।"
          : "Article content is not available."
      );
      return;
    }

    handleStop();

    chunksRef.current = splitText(articleText);
    chunkIndexRef.current = 0;

    controllerRef.current = new AbortController();

    playChunk();
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setStatus("paused");
  };

  const handleResume = async () => {
    try {
      await audioRef.current?.play();
      setStatus("playing");
    } catch (error) {
      console.error("Resume Error:", error);
      setError(
        isHindi
          ? "ऑडियो दोबारा शुरू नहीं हो पाया।"
          : "Unable to resume audio."
      );
      handleStop();
    }
  };

  useEffect(() => {
    setStatus("idle");
    setError("");

    return () => {
      controllerRef.current?.abort();
      releaseAudio();
    };
  }, [language, articleId]);

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

        {status === "loading" && (
          <button type="button" disabled>
            {isHindi ? "ऑडियो बन रहा है..." : "Generating audio..."}
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
