import {
  createContext,
  useContext,
  useState,
} from "react";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("news-language") || "en";
  });

  const changeLanguage = (newLanguage) => {
    if (!["en", "hi"].includes(newLanguage)) return;

    setLanguage(newLanguage);
    localStorage.setItem("news-language", newLanguage);
  };

  return (
    <LanguageContext.Provider
      value={{ language, changeLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
};