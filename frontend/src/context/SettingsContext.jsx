import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../api/api";
import { getImageUrl } from "../utils/imageUrl";

const SettingsContext = createContext(null);

const defaultSettings = {
  websiteName: {
    en: "THE GLOBAL CHRONICLE",
    hi: "द ग्लोबल क्रॉनिकल",
  },
  branding: {
    logo: { url: null, isVisible: true },
    mobileLogo: { url: null, isVisible: true },
    footerLogo: { url: null, isVisible: true },
    favicon: { url: null, isVisible: true },
  },
  contact: {
    mobile: { value: "", isVisible: true },
    whatsapp: { value: "", isVisible: true },
    email: { value: "editorial@chronicle.news", isVisible: true },
    address: {
      value: { en: "Press Enclave, New Delhi, India", hi: "प्रेस एन्क्लेव, नई दिल्ली, भारत" },
      isVisible: true,
    },
    showContactInFooter: true,
    showFloatingWhatsapp: true,
  },
  socialLinks: [],
  socialDisplay: {
    showInHeader: true,
    showInFooter: true,
  },
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, tagsRes] = await Promise.allSettled([
        api.get("/settings/public"),
        api.get("/tags"),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value.data) {
        const resData = settingsRes.value.data;
        const payload = resData.settings || resData.data || resData;
        setSettings((prev) => ({
          ...prev,
          ...payload,
        }));
      }

      if (tagsRes.status === "fulfilled" && tagsRes.value.data) {
        const rawTags = tagsRes.value.data.tags || tagsRes.value.data.data || [];
        setTags(Array.isArray(rawTags) ? rawTags.filter((t) => t.isActive !== false) : []);
      }
    } catch (err) {
      console.warn("Could not load public settings or tags:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Dynamically update favicon if set in admin branding
  useEffect(() => {
    const faviconUrl = settings.branding?.favicon?.url;
    if (faviconUrl && settings.branding?.favicon?.isVisible) {
      const fullUrl = getImageUrl(faviconUrl);
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = fullUrl;
    }
  }, [settings.branding?.favicon]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        branding: settings.branding || {},
        contact: settings.contact || {},
        socialLinks: settings.socialLinks || [],
        socialDisplay: settings.socialDisplay || {},
        websiteName: settings.websiteName || defaultSettings.websiteName,
        tags,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return context;
};
