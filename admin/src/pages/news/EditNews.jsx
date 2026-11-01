
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  X,
  ImagePlus,
  Video,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./CreateNews.css";
import "./EditNews.css";

const emptyLocalizedContent = {
  title: "",
  excerpt: "",
  content: "",
};

const initialForm = {
  title: {
    en: { ...emptyLocalizedContent },
    hi: { ...emptyLocalizedContent },
  },
  thumbnailAlt: { en: "", hi: "" },
  seo: {
    en: { title: "", description: "" },
    hi: { title: "", description: "" },
  },
  availableLanguages: ["en"],
  category: "",
  subcategory: "",
  tags: [],
  status: "draft",
  scheduledAt: "",
  isFeatured: false,
  isBreaking: false,
  isTrending: false,
};

const translations = {
  en: {
    heading: "Edit News Article",
    subtitle: "Update your news article and publishing details.",
    back: "Back to News",
    article: "Article Content",
    language: "Available Languages",
    english: "English",
    hindi: "Hindi",
    title: "Article Title",
    excerpt: "Short Description",
    content: "Article Content",
    category: "Category",
    subcategory: "Subcategory",
    selectCategory: "Select category",
    selectSubcategory: "Select subcategory",
    tags: "Tags",
    thumbnail: "Thumbnail Image",
    upload: "Upload New Image",
    alt: "Image Alt Text",
    gallery: "Article Media Gallery",
    galleryDescription: "Manage images and videos displayed inside the article.",
    addImages: "Add Images",
    addVideos: "Add Videos",
    imageLimit: "Maximum 10 images, 5MB each.",
    videoLimit: "Maximum 3 videos, 100MB each.",
    mediaAlt: "Image alt text",
    removeMedia: "Remove media",
    moveUp: "Move up",
    moveDown: "Move down",
    noMedia: "No article images or videos added.",
    seo: "SEO Settings",
    seoTitle: "SEO Title",
    seoDescription: "SEO Description",
    publishing: "Publishing Settings",
    status: "Status",
    draft: "Draft",
    published: "Published",
    scheduled: "Scheduled",
    archived: "Archived",
    scheduledAt: "Schedule Date",
    featured: "Featured Article",
    breaking: "Breaking News",
    trending: "Trending News",
    update: "Update Article",
    updating: "Updating...",
    cancel: "Cancel",
    required: "Please complete all required fields.",
    languageRequired: "Select at least one language.",
    success: "Article updated successfully.",
    failed: "Unable to update article.",
    loading: "Loading article...",
    loadFailed: "Unable to load article.",
    removeImage: "Remove selected image",
  },
  hi: {
    heading: "समाचार लेख संपादित करें",
    subtitle: "अपने समाचार लेख और प्रकाशन की जानकारी अपडेट करें।",
    back: "समाचार सूची पर वापस जाएं",
    article: "लेख की सामग्री",
    language: "उपलब्ध भाषाएं",
    english: "अंग्रेज़ी",
    hindi: "हिंदी",
    title: "लेख का शीर्षक",
    excerpt: "संक्षिप्त विवरण",
    content: "लेख की सामग्री",
    category: "श्रेणी",
    subcategory: "उपश्रेणी",
    selectCategory: "श्रेणी चुनें",
    selectSubcategory: "उपश्रेणी चुनें",
    tags: "टैग",
    thumbnail: "थंबनेल इमेज",
    upload: "नई इमेज अपलोड करें",
    alt: "इमेज का Alt Text",
    gallery: "लेख की मीडिया गैलरी",
    galleryDescription: "लेख के अंदर दिखाई जाने वाली इमेज और वीडियो प्रबंधित करें।",
    addImages: "इमेज जोड़ें",
    addVideos: "वीडियो जोड़ें",
    imageLimit: "अधिकतम 10 इमेज, प्रत्येक 5MB तक।",
    videoLimit: "अधिकतम 3 वीडियो, प्रत्येक 100MB तक।",
    mediaAlt: "इमेज का Alt Text",
    removeMedia: "मीडिया हटाएं",
    moveUp: "ऊपर ले जाएं",
    moveDown: "नीचे ले जाएं",
    noMedia: "अभी कोई इमेज या वीडियो नहीं जोड़ा गया है।",
    seo: "SEO सेटिंग्स",
    seoTitle: "SEO शीर्षक",
    seoDescription: "SEO विवरण",
    publishing: "प्रकाशन सेटिंग्स",
    status: "स्थिति",
    draft: "ड्राफ्ट",
    published: "प्रकाशित",
    scheduled: "निर्धारित",
    archived: "आर्काइव",
    scheduledAt: "प्रकाशन की तारीख",
    featured: "विशेष लेख",
    breaking: "ब्रेकिंग न्यूज़",
    trending: "ट्रेंडिंग न्यूज़",
    update: "लेख अपडेट करें",
    updating: "अपडेट हो रहा है...",
    cancel: "रद्द करें",
    required: "कृपया सभी आवश्यक फ़ील्ड भरें।",
    languageRequired: "कम से कम एक भाषा चुनें।",
    success: "लेख सफलतापूर्वक अपडेट हुआ।",
    failed: "लेख अपडेट नहीं हो सका।",
    loading: "लेख लोड हो रहा है...",
    loadFailed: "लेख लोड नहीं हो सका।",
    removeImage: "चयनित इमेज हटाएं",
  },
};

const getList = (response) => {
  const data = response.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.tags)) return data.tags;
  if (Array.isArray(data?.subcategories)) return data.subcategories;

  return [];
};

const getArticle = (response) => {
  const data = response.data?.data;

  return (
    data?.news ||
    data?.article ||
    response.data?.news ||
    response.data?.article ||
    data
  );
};

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id || "" : value;
};

const getLocalizedValue = (value, language) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || "";
};

const getTagValue = (tag) => {
  if (typeof tag === "string") return tag.trim();

  if (tag && typeof tag === "object") {
    const name = tag.name;

    if (typeof name === "string") return name.trim();
    if (name?.en) return name.en.trim();
    if (name?.hi) return name.hi.trim();
  }

  return "";
};

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
};

const resolveMediaUrl = (path) => {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) return path;

  try {
    const origin = new URL(apiUrl).origin;
    return new URL(path, `${origin}/`).toString();
  } catch {
    return path;
  }
};

const EditNews = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [activeLanguage, setActiveLanguage] = useState("en");

  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [existingThumbnail, setExistingThumbnail] = useState("");

  const [articleMedia, setArticleMedia] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const mediaPreviewUrls = useRef([]);

  const t = translations[activeLanguage];

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(false);

        const [articleResponse, categoryResponse, tagResponse] =
          await Promise.all([
            api.get(`/news/admin/${id}`),
            api.get("/categories"),
            api.get("/tags"),
          ]);

        if (!active) return;

        const article = getArticle(articleResponse);

        if (!article?._id) {
          throw new Error("Article not found.");
        }

        const categoryList = getList(categoryResponse);
        const tagList = getList(tagResponse);

        setCategories(categoryList);
        setTags(tagList);

        const title = article.title || {};

        const availableLanguages = Array.isArray(article.availableLanguages)
          ? article.availableLanguages.filter((language) =>
              ["en", "hi"].includes(language)
            )
          : ["en", "hi"].filter((language) =>
              Boolean(title[language]?.title)
            );

        const languages =
          availableLanguages.length > 0 ? availableLanguages : ["en"];

        const categoryId = getId(article.category);
        const subcategoryId = getId(article.subcategory);

        const existingTags = Array.isArray(article.tags)
          ? article.tags.map(getTagValue).filter(Boolean)
          : [];

        setForm({
          title: {
            en: {
              title: title.en?.title || "",
              excerpt: title.en?.excerpt || "",
              content: title.en?.content || "",
            },
            hi: {
              title: title.hi?.title || "",
              excerpt: title.hi?.excerpt || "",
              content: title.hi?.content || "",
            },
          },
          thumbnailAlt: {
            en: getLocalizedValue(article.thumbnailAlt, "en"),
            hi: getLocalizedValue(article.thumbnailAlt, "hi"),
          },
          seo: {
            en: {
              title: article.seo?.en?.title || "",
              description: article.seo?.en?.description || "",
            },
            hi: {
              title: article.seo?.hi?.title || "",
              description: article.seo?.hi?.description || "",
            },
          },
          availableLanguages: languages,
          category: categoryId,
          subcategory: subcategoryId,
          tags: existingTags,
          status: article.status || "draft",
          scheduledAt: toDateTimeLocal(article.scheduledAt),
          isFeatured: Boolean(article.isFeatured),
          isBreaking: Boolean(article.isBreaking),
          isTrending: Boolean(article.isTrending),
        });

        setExistingThumbnail(article.thumbnail || "");
        setThumbnailPreview(resolveMediaUrl(article.thumbnail));

        const existingMedia = Array.isArray(article.media)
          ? article.media
              .map((item, index) => ({
                id: item._id || `existing-${index}-${item.url}`,
                type: item.type,
                url: item.url,
                preview: resolveMediaUrl(item.url),
                alt: item.alt || "",
                order: Number.isInteger(item.order) ? item.order : index,
                existing: true,
              }))
              .sort((a, b) => a.order - b.order)
          : [];

        setArticleMedia(existingMedia);
        setActiveLanguage(languages[0]);

        if (categoryId) {
          const subcategoryResponse = await api.get(
            `/subcategories/category/${categoryId}`
          );

          if (active) {
            setSubcategories(getList(subcategoryResponse));
          }
        }
      } catch (error) {
        if (active) {
          setLoadError(true);
          toast.error(
            error.response?.data?.message || translations.en.loadFailed
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!thumbnail) return;

    const previewUrl = URL.createObjectURL(thumbnail);
    setThumbnailPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [thumbnail]);

  useEffect(() => {
    return () => {
      mediaPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      mediaPreviewUrls.current = [];
    };
  }, []);

  const updateLocalizedField = (section, field, value) => {
    setIsDirty(true);
    setErrors((previous) => {
      if (previous[`${activeLanguage}.${field}`]) {
        const next = { ...previous };
        delete next[`${activeLanguage}.${field}`];
        return next;
      }
      return previous;
    });

    setForm((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [activeLanguage]: {
          ...previous[section][activeLanguage],
          [field]: value,
        },
      },
    }));
  };

  const updateThumbnailAlt = (value) => {
    setIsDirty(true);
    setForm((previous) => ({
      ...previous,
      thumbnailAlt: {
        ...previous.thumbnailAlt,
        [activeLanguage]: value,
      },
    }));
  };

  const toggleLanguage = (language) => {
    setIsDirty(true);
    setForm((previous) => {
      const exists = previous.availableLanguages.includes(language);

      if (exists && previous.availableLanguages.length === 1) {
        toast.error(translations[activeLanguage].languageRequired);
        return previous;
      }

      const availableLanguages = exists
        ? previous.availableLanguages.filter((item) => item !== language)
        : [...previous.availableLanguages, language];

      if (exists && activeLanguage === language) {
        setActiveLanguage(availableLanguages[0]);
      }

      if (!exists && previous.availableLanguages.length === 0) {
        setActiveLanguage(language);
      }

      return { ...previous, availableLanguages };
    });
  };

  const handleCategoryChange = async (categoryId) => {
    setIsDirty(true);
    setErrors((previous) => {
      const next = { ...previous };
      delete next.category;
      return next;
    });

    setForm((previous) => ({
      ...previous,
      category: categoryId,
      subcategory: "",
    }));

    setSubcategories([]);

    if (!categoryId) return;

    try {
      const response = await api.get(
        `/subcategories/category/${categoryId}`
      );

      setSubcategories(getList(response));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load subcategories."
      );
    }
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP and AVIF images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    setIsDirty(true);
    setErrors((previous) => {
      const next = { ...previous };
      delete next.thumbnail;
      return next;
    });

    setThumbnail(file);
  };

  const removeNewThumbnail = () => {
    setIsDirty(true);
    setThumbnail(null);
    setThumbnailPreview(resolveMediaUrl(existingThumbnail));
  };

  const handleMediaSelection = (event, type) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const isImage = type === "image";

    const allowedTypes = isImage
      ? ["image/jpeg", "image/png", "image/webp", "image/avif"]
      : ["video/mp4", "video/webm", "video/quicktime"];

    const maxSize = isImage ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
    const maxCount = isImage ? 10 : 3;

    const currentCount = articleMedia.filter(
      (item) => item.type === type
    ).length;

    const availableSlots = maxCount - currentCount;

    if (availableSlots <= 0) {
      toast.error(
        isImage
          ? "Maximum 10 article images allowed."
          : "Maximum 3 article videos allowed."
      );
      event.target.value = "";
      return;
    }

    if (files.length > availableSlots) {
      toast.error(
        `You can add only ${availableSlots} more ${
          isImage ? "image(s)" : "video(s)"
        }.`
      );
      event.target.value = "";
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          isImage
            ? "Only JPG, PNG, WEBP and AVIF images are allowed."
            : "Only MP4, WEBM and MOV videos are allowed."
        );
        continue;
      }

      if (file.size > maxSize) {
        toast.error(
          isImage
            ? `${file.name} exceeds the 5MB image limit.`
            : `${file.name} exceeds the 100MB video limit.`
        );
        continue;
      }

      validFiles.push(file);
    }

    const newItems = validFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      mediaPreviewUrls.current.push(preview);

      return {
        id: crypto.randomUUID(),
        type,
        file,
        preview,
        url: "",
        alt: "",
        existing: false,
      };
    });

    setArticleMedia((previous) => [...previous, ...newItems]);
    event.target.value = "";
  };

  const removeArticleMedia = (mediaId) => {
    const item = articleMedia.find((media) => media.id === mediaId);

    if (item?.preview && !item.existing) {
      URL.revokeObjectURL(item.preview);

      mediaPreviewUrls.current = mediaPreviewUrls.current.filter(
        (url) => url !== item.preview
      );
    }

    setArticleMedia((previous) =>
      previous.filter((media) => media.id !== mediaId)
    );
  };

  const updateMediaAlt = (mediaId, value) => {
    setArticleMedia((previous) =>
      previous.map((item) =>
        item.id === mediaId ? { ...item, alt: value } : item
      )
    );
  };

  const moveMedia = (index, direction) => {
    setArticleMedia((previous) => {
      const next = [...previous];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= next.length) {
        return previous;
      }

      [next[index], next[targetIndex]] = [
        next[targetIndex],
        next[index],
      ];

      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    if (form.availableLanguages.length === 0) {
      toast.error(translations[activeLanguage].languageRequired);
      return false;
    }

    for (const language of form.availableLanguages) {
      const article = form.title[language];
      const isEn = language === "en";

      if (!article.title.trim()) {
        nextErrors[`${language}.title`] = isEn
          ? "Title is required"
          : "शीर्षक आवश्यक है";
      } else if (article.title.trim().length < 5) {
        nextErrors[`${language}.title`] = isEn
          ? "Title must be at least 5 characters"
          : "शीर्षक कम से कम 5 अक्षरों का होना चाहिए";
      }

      if (!article.excerpt.trim()) {
        nextErrors[`${language}.excerpt`] = isEn
          ? "Short description is required"
          : "संक्षिप्त विवरण आवश्यक है";
      } else if (article.excerpt.trim().length < 10) {
        nextErrors[`${language}.excerpt`] = isEn
          ? "Short description must be at least 10 characters"
          : "संक्षिप्त विवरण कम से कम 10 अक्षरों का होना चाहिए";
      }

      if (!article.content.trim()) {
        nextErrors[`${language}.content`] = isEn
          ? "Article content is required"
          : "मुख्य सामग्री आवश्यक है";
      } else if (article.content.trim().length < 20) {
        nextErrors[`${language}.content`] = isEn
          ? "Article content must be at least 20 characters"
          : "सामग्री कम से कम 20 अक्षरों की होनी चाहिए";
      }
    }

    if (!form.category) {
      nextErrors.category = "Please select a category.";
    }

    if (!existingThumbnail && !thumbnail) {
      nextErrors.thumbnail = "Please upload a thumbnail image.";
    }

    if (form.status === "scheduled") {
      if (!form.scheduledAt) {
        nextErrors.scheduledAt = "Please select a scheduled publishing date.";
      } else if (new Date(form.scheduledAt).getTime() <= Date.now()) {
        nextErrors.scheduledAt = "Scheduled date must be in the future.";
      }
    }

    const imageCount = articleMedia.filter(
      (item) => item.type === "image"
    ).length;

    const videoCount = articleMedia.filter(
      (item) => item.type === "video"
    ).length;

    if (imageCount > 10 || videoCount > 3) {
      toast.error("Media limits exceeded.");
      return false;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      const currentHasErrors =
        nextErrors[`${activeLanguage}.title`] ||
        nextErrors[`${activeLanguage}.excerpt`] ||
        nextErrors[`${activeLanguage}.content`];

      if (!currentHasErrors) {
        const firstErrorLanguage = form.availableLanguages.find(
          (lang) =>
            nextErrors[`${lang}.title`] ||
            nextErrors[`${lang}.excerpt`] ||
            nextErrors[`${lang}.content`]
        );
        if (firstErrorLanguage) {
          setActiveLanguage(firstErrorLanguage);
        }
      }

      toast.error("Please fill in all required fields properly.");
      return false;
    }

    setErrors({});
    return true;
  };

  const uploadArticleMedia = async (item) => {
    if (item.existing) {
      return {
        type: item.type,
        url: item.url,
        alt: item.alt || "",
      };
    }

    const formData = new FormData();
    const fieldName = item.type === "image" ? "image" : "video";

    formData.append(fieldName, item.file);

    const response = await api.post(
      item.type === "image" ? "/media/image" : "/media/video",
      formData
    );

    const uploadedPath =
      response.data?.data?.path ||
      response.data?.data?.url ||
      response.data?.path ||
      response.data?.url;

    if (!uploadedPath) {
      throw new Error(
        `Upload failed for ${item.file?.name || "media file"}.`
      );
    }

    return {
      type: item.type,
      url: uploadedPath,
      alt: item.alt || "",
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (updating || !validateForm()) return;

    try {
      setUpdating(true);

      let thumbnailPath = existingThumbnail;

      if (thumbnail) {
        const imageData = new FormData();
        imageData.append("image", thumbnail);

        const uploadResponse = await api.post("/media/image", imageData);

        thumbnailPath =
          uploadResponse.data?.data?.path ||
          uploadResponse.data?.data?.url ||
          uploadResponse.data?.path ||
          uploadResponse.data?.url;

        if (!thumbnailPath) {
          throw new Error("Image upload did not return a file path.");
        }
      }

      const orderedMedia = await Promise.all(
        articleMedia.map((item) => uploadArticleMedia(item))
      );

      const payload = {
        title: form.title,
        availableLanguages: form.availableLanguages,
        category: form.category,
        subcategory: form.subcategory || null,
        tags: form.tags,
        thumbnail: thumbnailPath,
        thumbnailAlt: form.thumbnailAlt,
        media: orderedMedia.map((item, index) => ({
          ...item,
          order: index,
        })),
        seo: form.seo,
        status: form.status,
        isFeatured: form.isFeatured,
        isBreaking: form.isBreaking,
        isTrending: form.isTrending,
      };

      if (form.status === "scheduled") {
        payload.scheduledAt = new Date(form.scheduledAt).toISOString();
      }

      await api.patch(`/news/${id}`, payload);

      toast.success(translations[activeLanguage].success);
      navigate("/news");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          translations[activeLanguage].failed
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="create-news-loading">
        {translations.en.loading}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="create-news-loading">
        <p>Article could not be loaded.</p>
        <button type="button" onClick={() => navigate("/news")}>
          Back to News
        </button>
      </div>
    );
  }

  const handleBackOrCancel = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      navigate("/news");
    }
  };

  const availableTagValues = [
    ...new Set([
      ...tags.map(getTagValue).filter(Boolean),
      ...form.tags,
    ]),
  ];

  return (
    <div className="create-news-page">
      <div className="create-news-header">
        <div>
          <button
            type="button"
            className="news-back-button"
            onClick={handleBackOrCancel}
          >
            <ArrowLeft size={17} />
            {t.back}
          </button>

          <h1>{t.heading}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="create-news-form">
        <section className="create-news-card">
          <h2>{t.language}</h2>

          <div className="edit-language-options">
            <label>
              <input
                type="checkbox"
                checked={form.availableLanguages.includes("en")}
                onChange={() => toggleLanguage("en")}
              />
              {t.english}
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.availableLanguages.includes("hi")}
                onChange={() => toggleLanguage("hi")}
              />
              {t.hindi}
            </label>
          </div>
        </section>

        <section className="create-news-card">
          <h2>{t.article}</h2>

          <div className="news-language-tabs">
            {form.availableLanguages.includes("en") && (
              <button
                type="button"
                className={`${activeLanguage === "en" ? "active" : ""} ${
                  errors["en.title"] || errors["en.excerpt"] || errors["en.content"]
                    ? "tab-has-error"
                    : ""
                }`}
                onClick={() => setActiveLanguage("en")}
              >
                English
                {(errors["en.title"] || errors["en.excerpt"] || errors["en.content"]) && (
                  <span className="field-required-mark" style={{ marginLeft: "4px" }}>*</span>
                )}
              </button>
            )}

            {form.availableLanguages.includes("hi") && (
              <button
                type="button"
                className={`${activeLanguage === "hi" ? "active" : ""} ${
                  errors["hi.title"] || errors["hi.excerpt"] || errors["hi.content"]
                    ? "tab-has-error"
                    : ""
                }`}
                onClick={() => setActiveLanguage("hi")}
              >
                हिंदी
                {(errors["hi.title"] || errors["hi.excerpt"] || errors["hi.content"]) && (
                  <span className="field-required-mark" style={{ marginLeft: "4px" }}>*</span>
                )}
              </button>
            )}
          </div>

          <div className="news-form-group">
            <label>{t.title} *</label>
            <input
              type="text"
              className={errors[`${activeLanguage}.title`] ? "has-field-error" : ""}
              value={form.title[activeLanguage].title}
              onChange={(event) =>
                updateLocalizedField("title", "title", event.target.value)
              }
            />
            {errors[`${activeLanguage}.title`] && (
              <span className="field-error-text">{errors[`${activeLanguage}.title`]}</span>
            )}
          </div>

          <div className="news-form-group">
            <label>{t.excerpt} *</label>
            <textarea
              rows="3"
              className={errors[`${activeLanguage}.excerpt`] ? "has-field-error" : ""}
              value={form.title[activeLanguage].excerpt}
              onChange={(event) =>
                updateLocalizedField("title", "excerpt", event.target.value)
              }
            />
            {errors[`${activeLanguage}.excerpt`] && (
              <span className="field-error-text">{errors[`${activeLanguage}.excerpt`]}</span>
            )}
          </div>

          <div className="news-form-group">
            <label>{t.content} *</label>
            <textarea
              rows="12"
              className={errors[`${activeLanguage}.content`] ? "has-field-error" : ""}
              value={form.title[activeLanguage].content}
              onChange={(event) =>
                updateLocalizedField("title", "content", event.target.value)
              }
            />
            {errors[`${activeLanguage}.content`] && (
              <span className="field-error-text">{errors[`${activeLanguage}.content`]}</span>
            )}
          </div>
        </section>

        <section className="create-news-card">
          <h2>{t.category}</h2>

          <div className="news-form-grid">
            <div className="news-form-group">
              <label>{t.category} *</label>
              <select
                className={errors.category ? "has-field-error" : ""}
                value={form.category}
                onChange={(event) =>
                  handleCategoryChange(event.target.value)
                }
              >
                <option value="">{t.selectCategory}</option>

                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {getLocalizedValue(category.name, activeLanguage)}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="field-error-text">{errors.category}</span>
              )}
            </div>

            <div className="news-form-group">
              <label>{t.subcategory}</label>
              <select
                value={form.subcategory}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    subcategory: event.target.value,
                  }))
                }
                disabled={!form.category}
              >
                <option value="">{t.selectSubcategory}</option>

                {subcategories.map((subcategory) => (
                  <option key={subcategory._id} value={subcategory._id}>
                    {getLocalizedValue(subcategory.name, activeLanguage)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="news-form-group">
            <label>{t.tags}</label>
            <select
              multiple
              value={form.tags}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  tags: Array.from(
                    event.target.selectedOptions,
                    (option) => option.value
                  ),
                }))
              }
            >
              {availableTagValues.map((tagValue) => (
                <option key={tagValue} value={tagValue}>
                  {tagValue}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="create-news-card">
          <h2>{t.thumbnail}</h2>

          {thumbnailPreview && (
            <div className="edit-thumbnail-preview">
              <img
                src={thumbnailPreview}
                alt="Article thumbnail preview"
              />

              {thumbnail && (
                <button
                  type="button"
                  onClick={removeNewThumbnail}
                  aria-label={t.removeImage}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          <label className={`news-upload-button ${errors.thumbnail ? "has-field-error" : ""}`}>
            <Upload size={17} />
            {t.upload}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleThumbnailChange}
              hidden
            />
          </label>
          {errors.thumbnail && (
            <span className="field-error-text" style={{ marginTop: "6px" }}>{errors.thumbnail}</span>
          )}

          <div className="news-form-group">
            <label>{t.alt}</label>
            <input
              type="text"
              value={form.thumbnailAlt[activeLanguage]}
              onChange={(event) =>
                updateThumbnailAlt(event.target.value)
              }
            />
          </div>
        </section>

        <section className="create-news-card">
          <div className="create-news-card-heading">
            <div>
              <h2>{t.gallery}</h2>
              <p>{t.galleryDescription}</p>
            </div>
          </div>

          <div className="create-news-media-upload-actions">
            <label className="create-news-media-picker">
              <ImagePlus size={17} />
              {t.addImages}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={(event) =>
                  handleMediaSelection(event, "image")
                }
                disabled={
                  articleMedia.filter((item) => item.type === "image")
                    .length >= 10
                }
              />
            </label>

            <label className="create-news-media-picker">
              <Video size={17} />
              {t.addVideos}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                multiple
                onChange={(event) =>
                  handleMediaSelection(event, "video")
                }
                disabled={
                  articleMedia.filter((item) => item.type === "video")
                    .length >= 3
                }
              />
            </label>
          </div>

          <p className="create-news-media-limits">
            {t.imageLimit} {t.videoLimit}
          </p>

          {articleMedia.length === 0 ? (
            <p className="create-news-muted">{t.noMedia}</p>
          ) : (
            <div className="create-news-media-list">
              {articleMedia.map((item, index) => (
                <div className="create-news-media-item" key={item.id}>
                  <div className="create-news-media-preview">
                    {item.type === "image" ? (
                      <img
                        src={item.preview}
                        alt={item.alt || "Article media preview"}
                      />
                    ) : (
                      <video
                        src={item.preview}
                        controls
                        preload="metadata"
                      />
                    )}
                  </div>

                  <div className="create-news-media-details">
                    <strong>
                      {item.existing
                        ? `Existing ${item.type}`
                        : item.file?.name || item.type}
                    </strong>

                    {item.type === "image" && (
                      <input
                        type="text"
                        value={item.alt}
                        placeholder={t.mediaAlt}
                        onChange={(event) =>
                          updateMediaAlt(item.id, event.target.value)
                        }
                      />
                    )}
                  </div>

                  <div className="create-news-media-controls">
                    <button
                      type="button"
                      title={t.moveUp}
                      aria-label={t.moveUp}
                      onClick={() => moveMedia(index, -1)}
                      disabled={index === 0}
                    >
                      <ChevronUp size={17} />
                    </button>

                    <button
                      type="button"
                      title={t.moveDown}
                      aria-label={t.moveDown}
                      onClick={() => moveMedia(index, 1)}
                      disabled={index === articleMedia.length - 1}
                    >
                      <ChevronDown size={17} />
                    </button>

                    <button
                      type="button"
                      title={t.removeMedia}
                      aria-label={t.removeMedia}
                      onClick={() => removeArticleMedia(item.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="create-news-card">
          <h2>{t.seo}</h2>

          <div className="news-form-group">
            <label>{t.seoTitle}</label>
            <input
              type="text"
              value={form.seo[activeLanguage].title}
              onChange={(event) =>
                updateLocalizedField("seo", "title", event.target.value)
              }
            />
          </div>

          <div className="news-form-group">
            <label>{t.seoDescription}</label>
            <textarea
              rows="3"
              value={form.seo[activeLanguage].description}
              onChange={(event) =>
                updateLocalizedField(
                  "seo",
                  "description",
                  event.target.value
                )
              }
            />
          </div>
        </section>

        <section className="create-news-card">
          <h2>{t.publishing}</h2>

          <div className="news-form-group">
            <label>{t.status}</label>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
            >
              <option value="draft">{t.draft}</option>
              <option value="published">{t.published}</option>
              <option value="scheduled">{t.scheduled}</option>
              <option value="archived">{t.archived}</option>
            </select>
          </div>

          {form.status === "scheduled" && (
            <div className="news-form-group">
              <label>{t.scheduledAt}</label>
              <input
                type="datetime-local"
                className={errors.scheduledAt ? "has-field-error" : ""}
                value={form.scheduledAt}
                onChange={(event) => {
                  setIsDirty(true);
                  if (errors.scheduledAt) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.scheduledAt;
                      return next;
                    });
                  }
                  setForm((previous) => ({
                    ...previous,
                    scheduledAt: event.target.value,
                  }));
                }}
              />
              {errors.scheduledAt && (
                <span className="field-error-text">{errors.scheduledAt}</span>
              )}
            </div>
          )}

          <div className="news-checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    isFeatured: event.target.checked,
                  }))
                }
              />
              {t.featured}
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isBreaking}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    isBreaking: event.target.checked,
                  }))
                }
              />
              {t.breaking}
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isTrending}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    isTrending: event.target.checked,
                  }))
                }
              />
              {t.trending}
            </label>
          </div>
        </section>

        <div className="create-news-actions">
          <button
            type="button"
            className="news-cancel-button"
            onClick={handleBackOrCancel}
            disabled={updating}
          >
            {t.cancel}
          </button>

          <button
            type="submit"
            className="news-submit-button"
            disabled={updating}
          >
            {updating ? t.updating : t.update}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this news article. Are you sure you want to discard them and return to the news list?"
        confirmText="Discard and Leave"
        cancelText="Keep Editing"
        variant="warning"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          navigate("/news");
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </div>
  );
};

export default EditNews;
