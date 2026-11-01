export const getLocalizedContent = (value, language, fallback = "en") => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const result = value[language] || value[fallback] || value.hi;

  return typeof result === "string" ? result : "";
};