
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImagePlus,
  Save,
  Send,
  CalendarDays,
  X,
  Video,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./CreateNews.css";

const createInitialForm = () => ({
  title: {
    en: { title: "", excerpt: "", content: "" },
    hi: { title: "", excerpt: "", content: "" },
  },
  thumbnailAlt: { en: "", hi: "" },
  seo: {
    en: { title: "", description: "" },
    hi: { title: "", description: "" },
  },
  category: "",
  subcategory: "",
  tags: [],
  status: "draft",
  scheduledAt: "",
  isFeatured: false,
  isBreaking: false,
  isTrending: false,
});

const translations = {
  en: {
    back: "Back to News",
    pageTitle: "Create News Article",
    pageDescription: "Write and publish bilingual news content.",
    articleContent: "Article Content",
    articleDescription: "Enter your article details in English and Hindi.",
    english: "English",
    hindi: "हिंदी",
    title: "Article Title",
    excerpt: "Short Excerpt",
    content: "Article Content",
    titlePlaceholder: "Enter article title",
    excerptPlaceholder: "Write a short summary",
    contentPlaceholder: "Write your complete news article",
    categoryTitle: "Category and Tags",
    categoryDescription: "Organize your article for easier discovery.",
    category: "Category",
    selectCategory: "Select category",
    subcategory: "Subcategory",
    selectSubcategory: "Select subcategory",
    tags: "Tags",
    noTags: "No tags available.",
    thumbnailTitle: "Thumbnail Image",
    thumbnailDescription: "Upload an image to represent your article.",
    uploadImage: "Click to upload thumbnail",
    imageFormats: "JPG, PNG, WEBP or AVIF · Maximum 5 MB",
    altText: "Thumbnail Alt Text",
    galleryTitle: "Article Media Gallery",
    galleryDescription: "Add images and videos inside your article.",
    addImages: "Add images",
    addVideos: "Add videos",
    imageLimit: "Maximum 10 images, 5 MB each.",
    videoLimit: "Maximum 3 videos, 100 MB each.",
    mediaAlt: "Image alt text",
    moveUp: "Move up",
    moveDown: "Move down",
    removeMedia: "Remove media",
    seoTitle: "SEO Settings",
    seoDescription: "Optimize your article for search engines.",
    seoTitleLabel: "SEO Title",
    seoDescriptionLabel: "SEO Description",
    publishingTitle: "Publishing Settings",
    publishingDescription: "Choose how and when your article should appear.",
    articleStatus: "Article Status",
    draft: "Save as Draft",
    published: "Publish Now",
    scheduled: "Schedule",
    scheduleDate: "Schedule Date and Time",
    featured: "Featured News",
    breaking: "Breaking News",
    trending: "Trending News",
    cancel: "Cancel",
    saveDraft: "Save Draft",
    publishArticle: "Publish Article",
    scheduleArticle: "Schedule Article",
    saving: "Saving...",
    selectCategoryError: "Please select a category",
    selectImageError: "Please select a thumbnail image",
    invalidImage: "Only JPG, PNG, WEBP and AVIF images are allowed",
    imageTooLarge: "Thumbnail must be smaller than 5 MB",
    invalidMedia: "The selected file format is not supported.",
    mediaTooLarge: "The selected file exceeds the allowed size.",
    mediaLimitError: "You have reached the upload limit.",
    scheduleRequired: "Please select a scheduled publishing date",
    scheduleFuture: "Scheduled date must be in the future",
    uploadFailed: "Image upload did not return a valid path",
    uploadMediaFailed: "Media upload did not return a valid path",
    createSuccess: "News article created successfully",
    createFailed: "Unable to create news article",
    loadFailed: "Unable to load categories and tags",
    subcategoryFailed: "Unable to load subcategories",
    completeLanguage: "Complete title, excerpt and content for",
    loading: "Loading...",
  },
  hi: {
    back: "समाचार पर वापस जाएं",
    pageTitle: "समाचार लेख बनाएं",
    pageDescription: "अंग्रेज़ी और हिंदी में समाचार लिखें और प्रकाशित करें।",
    articleContent: "लेख की सामग्री",
    articleDescription: "अंग्रेज़ी और हिंदी में अपने लेख का विवरण दर्ज करें।",
    english: "English",
    hindi: "हिंदी",
    title: "लेख का शीर्षक",
    excerpt: "संक्षिप्त विवरण",
    content: "लेख की सामग्री",
    titlePlaceholder: "लेख का शीर्षक दर्ज करें",
    excerptPlaceholder: "लेख का संक्षिप्त विवरण लिखें",
    contentPlaceholder: "पूरा समाचार लेख लिखें",
    categoryTitle: "श्रेणी और टैग",
    categoryDescription: "अपने लेख को सही श्रेणी में व्यवस्थित करें।",
    category: "श्रेणी",
    selectCategory: "श्रेणी चुनें",
    subcategory: "उपश्रेणी",
    selectSubcategory: "उपश्रेणी चुनें",
    tags: "टैग",
    noTags: "कोई टैग उपलब्ध नहीं है।",
    thumbnailTitle: "थंबनेल इमेज",
    thumbnailDescription: "अपने लेख के लिए एक तस्वीर अपलोड करें।",
    uploadImage: "थंबनेल अपलोड करने के लिए क्लिक करें",
    imageFormats: "JPG, PNG, WEBP या AVIF · अधिकतम 5 MB",
    altText: "थंबनेल का वैकल्पिक विवरण",
    galleryTitle: "लेख मीडिया गैलरी",
    galleryDescription: "अपने लेख के अंदर दिखाने के लिए इमेज और वीडियो जोड़ें।",
    addImages: "इमेज जोड़ें",
    addVideos: "वीडियो जोड़ें",
    imageLimit: "अधिकतम 10 इमेज, प्रत्येक 5 MB तक।",
    videoLimit: "अधिकतम 3 वीडियो, प्रत्येक 100 MB तक।",
    mediaAlt: "इमेज का वैकल्पिक विवरण",
    moveUp: "ऊपर करें",
    moveDown: "नीचे करें",
    removeMedia: "मीडिया हटाएं",
    seoTitle: "SEO सेटिंग्स",
    seoDescription: "सर्च इंजन के लिए अपने लेख को बेहतर बनाएं।",
    seoTitleLabel: "SEO शीर्षक",
    seoDescriptionLabel: "SEO विवरण",
    publishingTitle: "प्रकाशन सेटिंग्स",
    publishingDescription: "चुनें कि आपका लेख कब और कैसे प्रकाशित होगा।",
    articleStatus: "लेख की स्थिति",
    draft: "ड्राफ्ट के रूप में सेव करें",
    published: "अभी प्रकाशित करें",
    scheduled: "शेड्यूल करें",
    scheduleDate: "प्रकाशन की तारीख और समय",
    featured: "प्रमुख समाचार",
    breaking: "ब्रेकिंग न्यूज़",
    trending: "ट्रेंडिंग समाचार",
    cancel: "रद्द करें",
    saveDraft: "ड्राफ्ट सेव करें",
    publishArticle: "लेख प्रकाशित करें",
    scheduleArticle: "लेख शेड्यूल करें",
    saving: "सेव हो रहा है...",
    selectCategoryError: "कृपया श्रेणी चुनें",
    selectImageError: "कृपया थंबनेल इमेज चुनें",
    invalidImage: "केवल JPG, PNG, WEBP और AVIF इमेज स्वीकार्य हैं",
    imageTooLarge: "थंबनेल का आकार 5 MB से कम होना चाहिए",
    invalidMedia: "चुनी गई फ़ाइल का फ़ॉर्मेट समर्थित नहीं है।",
    mediaTooLarge: "चुनी गई फ़ाइल निर्धारित आकार से बड़ी है।",
    mediaLimitError: "इस मीडिया की अधिकतम सीमा पूरी हो गई है।",
    scheduleRequired: "कृपया प्रकाशन की तारीख चुनें",
    scheduleFuture: "शेड्यूल की तारीख भविष्य में होनी चाहिए",
    uploadFailed: "इमेज अपलोड से सही पाथ प्राप्त नहीं हुआ",
    uploadMediaFailed: "मीडिया अपलोड से सही पाथ प्राप्त नहीं हुआ",
    createSuccess: "समाचार लेख सफलतापूर्वक बनाया गया",
    createFailed: "समाचार लेख नहीं बनाया जा सका",
    loadFailed: "श्रेणियां और टैग लोड नहीं हो सके",
    subcategoryFailed: "उपश्रेणियां लोड नहीं हो सकीं",
    completeLanguage: "इस भाषा में शीर्षक, विवरण और सामग्री भरें:",
    loading: "लोड हो रहा है...",
  },
};

const getArray = (response, key) => {
  const data = response?.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(response?.data?.[key])) return response.data[key];

  return [];
};

const getLocalizedName = (value, language = "en") => {
  if (typeof value === "string") return value;

  return value?.[language] || value?.en || value?.hi || "Unnamed";
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const formatTagName = (tag) =>
  getLocalizedName(tag?.name, "en").trim().toLowerCase();

const CreateNews = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(createInitialForm);
  const [activeLanguage, setActiveLanguage] = useState("en");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [articleMedia, setArticleMedia] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const mediaPreviewUrls = useRef([]);

  const t = translations[activeLanguage];
  const currentContent = form.title[activeLanguage];
  const currentSEO = form.seo[activeLanguage];

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      try {
        const [categoryResponse, tagResponse] = await Promise.all([
          api.get("/categories"),
          api.get("/tags"),
        ]);

        if (!active) return;

        setCategories(getArray(categoryResponse, "categories"));
        setTags(getArray(tagResponse, "tags"));
      } catch (error) {
        if (active) {
          toast.error(getErrorMessage(error, translations.en.loadFailed));
        }
      } finally {
        if (active) setLoadingOptions(false);
      }
    };

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.category) {
      setSubcategories([]);
      setLoadingSubcategories(false);
      return;
    }

    let active = true;

    const loadSubcategories = async () => {
      setLoadingSubcategories(true);

      try {
        const response = await api.get(
          `/subcategories/category/${form.category}`
        );

        if (active) {
          setSubcategories(getArray(response, "subcategories"));
        }
      } catch (error) {
        if (active) {
          setSubcategories([]);
          toast.error(
            getErrorMessage(error, translations.en.subcategoryFailed)
          );
        }
      } finally {
        if (active) setLoadingSubcategories(false);
      }
    };

    loadSubcategories();

    return () => {
      active = false;
    };
  }, [form.category]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  useEffect(() => {
    return () => {
      mediaPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
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

  const updateField = (field, value) => {
    setIsDirty(true);
    if (errors[field]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(t.invalidImage);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.imageTooLarge);
      return;
    }

    setIsDirty(true);
    setErrors((previous) => {
      const next = { ...previous };
      delete next.thumbnail;
      return next;
    });
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleArticleMediaChange = (event, type) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) return;

    const existingCount = articleMedia.filter(
      (item) => item.type === type
    ).length;

    const maxCount = type === "image" ? 10 : 3;
    const maxSize = type === "image"
      ? 5 * 1024 * 1024
      : 100 * 1024 * 1024;

    const allowedTypes = type === "image"
      ? ["image/jpeg", "image/png", "image/webp", "image/avif"]
      : ["video/mp4", "video/webm", "video/quicktime"];

    const acceptedFiles = [];

    for (const file of selectedFiles) {
      if (existingCount + acceptedFiles.length >= maxCount) {
        toast.error(t.mediaLimitError);
        break;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(t.invalidMedia);
        continue;
      }

      if (file.size > maxSize) {
        toast.error(t.mediaTooLarge);
        continue;
      }

      acceptedFiles.push(file);
    }

    const newItems = acceptedFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      mediaPreviewUrls.current.push(preview);

      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        type,
        preview,
        alt: "",
      };
    });

    setArticleMedia((previous) => [...previous, ...newItems]);
  };

  const removeArticleMedia = (id) => {
    setArticleMedia((previous) => {
      const item = previous.find((media) => media.id === id);

      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
        mediaPreviewUrls.current = mediaPreviewUrls.current.filter(
          (url) => url !== item.preview
        );
      }

      return previous.filter((media) => media.id !== id);
    });
  };

  const moveArticleMedia = (index, direction) => {
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

  const updateArticleMediaAlt = (id, alt) => {
    setArticleMedia((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, alt } : item
      )
    );
  };

  const handleTagChange = (tagName) => {
    setForm((previous) => ({
      ...previous,
      tags: previous.tags.includes(tagName)
        ? previous.tags.filter((name) => name !== tagName)
        : previous.tags.length >= 20
          ? previous.tags
          : [...previous.tags, tagName],
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    for (const language of ["en", "hi"]) {
      const content = form.title[language];
      const isEn = language === "en";

      if (!content.title.trim()) {
        nextErrors[`${language}.title`] = isEn
          ? "Title is required"
          : "शीर्षक आवश्यक है";
      } else if (content.title.trim().length < 5) {
        nextErrors[`${language}.title`] = isEn
          ? "Title must be at least 5 characters"
          : "शीर्षक कम से कम 5 अक्षरों का होना चाहिए";
      }

      if (!content.excerpt.trim()) {
        nextErrors[`${language}.excerpt`] = isEn
          ? "Short excerpt is required"
          : "संक्षिप्त विवरण आवश्यक है";
      } else if (content.excerpt.trim().length < 10) {
        nextErrors[`${language}.excerpt`] = isEn
          ? "Excerpt must be at least 10 characters"
          : "संक्षिप्त विवरण कम से कम 10 अक्षरों का होना चाहिए";
      }

      if (!content.content.trim()) {
        nextErrors[`${language}.content`] = isEn
          ? "Article content is required"
          : "सामग्री आवश्यक है";
      } else if (content.content.trim().length < 20) {
        nextErrors[`${language}.content`] = isEn
          ? "Content must be at least 20 characters"
          : "सामग्री कम से कम 20 अक्षरों की होनी चाहिए";
      }
    }

    if (!form.category) {
      nextErrors.category = t.selectCategoryError;
    }

    if (!thumbnail) {
      nextErrors.thumbnail = t.selectImageError;
    }

    if (form.status === "scheduled") {
      if (!form.scheduledAt) {
        nextErrors.scheduledAt = t.scheduleRequired;
      } else {
        const scheduledDate = new Date(form.scheduledAt);
        if (
          Number.isNaN(scheduledDate.getTime()) ||
          scheduledDate.getTime() <= Date.now()
        ) {
          nextErrors.scheduledAt = t.scheduleFuture;
        }
      }
    }

    const imageCount = articleMedia.filter(
      (item) => item.type === "image"
    ).length;

    const videoCount = articleMedia.filter(
      (item) => item.type === "video"
    ).length;

    if (imageCount > 10 || videoCount > 3) {
      toast.error(t.mediaLimitError);
      return false;
    }

    if (form.tags.length > 20) {
      toast.error(t.mediaLimitError);
      return false;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      const currentHasErrors =
        nextErrors[`${activeLanguage}.title`] ||
        nextErrors[`${activeLanguage}.excerpt`] ||
        nextErrors[`${activeLanguage}.content`];

      if (!currentHasErrors) {
        const otherLanguage = activeLanguage === "en" ? "hi" : "en";
        const otherHasErrors =
          nextErrors[`${otherLanguage}.title`] ||
          nextErrors[`${otherLanguage}.excerpt`] ||
          nextErrors[`${otherLanguage}.content`];

        if (otherHasErrors) {
          setActiveLanguage(otherLanguage);
        }
      }

      toast.error(
        activeLanguage === "en"
          ? "Please review and fill in all required fields"
          : "कृपया सभी आवश्यक फ़ील्ड्स को सही से भरें"
      );
      return false;
    }

    setErrors({});
    return true;
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/media/image", formData);

    const path =
      response.data?.data?.path ||
      response.data?.data?.url;

    if (!response.data?.success || !path) {
      throw new Error(t.uploadFailed);
    }

    return path;
  };

  const uploadArticleMedia = async (item) => {
    const formData = new FormData();
    formData.append(item.type, item.file);

    const response = await api.post(
      item.type === "image" ? "/media/image" : "/media/video",
      formData
    );

    const path =
      response.data?.data?.path ||
      response.data?.data?.url;

    if (!response.data?.success || !path) {
      throw new Error(t.uploadMediaFailed);
    }

    return {
      type: item.type,
      url: path,
      alt: item.type === "image" ? item.alt.trim() : "",
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || !validateForm()) return;

    setSubmitting(true);

    try {
      const thumbnailPath = await uploadImage(thumbnail);

      const uploadedMedia = [];

      for (const item of articleMedia) {
        uploadedMedia.push(await uploadArticleMedia(item));
      }

      const orderedMedia = uploadedMedia.map((item, index) => ({
        ...item,
        order: index,
      }));

      const payload = {
        title: {
          en: {
            title: form.title.en.title.trim(),
            excerpt: form.title.en.excerpt.trim(),
            content: form.title.en.content.trim(),
          },
          hi: {
            title: form.title.hi.title.trim(),
            excerpt: form.title.hi.excerpt.trim(),
            content: form.title.hi.content.trim(),
          },
        },
        availableLanguages: ["en", "hi"],
        category: form.category,
        subcategory: form.subcategory || undefined,
        tags: form.tags,
        thumbnail: thumbnailPath,
        thumbnailAlt: {
          en: form.thumbnailAlt.en.trim(),
          hi: form.thumbnailAlt.hi.trim(),
        },
        media: orderedMedia,
        seo: form.seo,
        status: form.status,
        isFeatured: form.isFeatured,
        isBreaking: form.isBreaking,
        isTrending: form.isTrending,
      };

      if (form.status === "scheduled") {
        payload.scheduledAt = new Date(
          form.scheduledAt
        ).toISOString();
      }

      const response = await api.post("/news", payload);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || t.createFailed
        );
      }

      toast.success(t.createSuccess);
      navigate("/news");
    } catch (error) {
      toast.error(getErrorMessage(error, t.createFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
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
  };

  const handleThumbnailRemove = () => {
    setIsDirty(true);
    setThumbnail(null);
    setThumbnailPreview("");
  };

  const handleBackOrCancel = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      navigate("/news");
    }
  };

  const localDateTime = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);

  return (
    <div className="create-news-page">
      <div className="create-news-heading">
        <div>
          <button
            type="button"
            className="create-news-back"
            onClick={handleBackOrCancel}
          >
            <ArrowLeft size={17} />
            {t.back}
          </button>

          <h1>{t.pageTitle}</h1>
          <p>{t.pageDescription}</p>
        </div>
      </div>

      <form className="create-news-form" onSubmit={handleSubmit}>
        <section className="create-news-card">
          <div className="create-news-card-heading">
            <div>
              <h2>{t.articleContent}</h2>
              <p>{t.articleDescription}</p>
            </div>
          </div>

          <div className="language-tabs">
            <button
              type="button"
              className={`${activeLanguage === "en" ? "active" : ""} ${
                errors["en.title"] || errors["en.excerpt"] || errors["en.content"]
                  ? "tab-has-error"
                  : ""
              }`}
              onClick={() => setActiveLanguage("en")}
            >
              {t.english}
              {(errors["en.title"] || errors["en.excerpt"] || errors["en.content"]) && (
                <span className="field-required-mark" style={{ marginLeft: "4px" }}>*</span>
              )}
            </button>

            <button
              type="button"
              className={`${activeLanguage === "hi" ? "active" : ""} ${
                errors["hi.title"] || errors["hi.excerpt"] || errors["hi.content"]
                  ? "tab-has-error"
                  : ""
              }`}
              onClick={() => setActiveLanguage("hi")}
            >
              {t.hindi}
              {(errors["hi.title"] || errors["hi.excerpt"] || errors["hi.content"]) && (
                <span className="field-required-mark" style={{ marginLeft: "4px" }}>*</span>
              )}
            </button>
          </div>

          <div className="create-news-field">
            <label>{t.title} <span>*</span></label>
            <input
              className={errors[`${activeLanguage}.title`] ? "has-field-error" : ""}
              value={currentContent.title}
              onChange={(event) =>
                updateLocalizedField("title", "title", event.target.value)
              }
              placeholder={t.titlePlaceholder}
              maxLength={200}
            />
            {errors[`${activeLanguage}.title`] && (
              <span className="field-error-text">{errors[`${activeLanguage}.title`]}</span>
            )}
          </div>

          <div className="create-news-field">
            <label>{t.excerpt} <span>*</span></label>
            <textarea
              className={errors[`${activeLanguage}.excerpt`] ? "has-field-error" : ""}
              value={currentContent.excerpt}
              onChange={(event) =>
                updateLocalizedField("title", "excerpt", event.target.value)
              }
              placeholder={t.excerptPlaceholder}
              rows={3}
              maxLength={500}
            />
            {errors[`${activeLanguage}.excerpt`] && (
              <span className="field-error-text">{errors[`${activeLanguage}.excerpt`]}</span>
            )}
          </div>

          <div className="create-news-field">
            <label>{t.content} <span>*</span></label>
            <textarea
              className={errors[`${activeLanguage}.content`] ? "has-field-error" : ""}
              value={currentContent.content}
              onChange={(event) =>
                updateLocalizedField("title", "content", event.target.value)
              }
              placeholder={t.contentPlaceholder}
              rows={12}
            />
            {errors[`${activeLanguage}.content`] && (
              <span className="field-error-text">{errors[`${activeLanguage}.content`]}</span>
            )}
          </div>
        </section>

        <section className="create-news-card">
          <div className="create-news-card-heading">
            <div>
              <h2>{t.categoryTitle}</h2>
              <p>{t.categoryDescription}</p>
            </div>
          </div>

          <div className="create-news-two-columns">
            <div className="create-news-field">
              <label>{t.category} <span>*</span></label>
              <select
                className={errors.category ? "has-field-error" : ""}
                value={form.category}
                onChange={(event) => handleCategoryChange(event.target.value)}
                disabled={loadingOptions || submitting}
              >
                <option value="">
                  {loadingOptions ? t.loading : t.selectCategory}
                </option>

                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {getLocalizedName(category.name, activeLanguage)}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="field-error-text">{errors.category}</span>
              )}
            </div>

            <div className="create-news-field">
              <label>{t.subcategory}</label>
              <select
                value={form.subcategory}
                onChange={(event) =>
                  updateField("subcategory", event.target.value)
                }
                disabled={
                  !form.category ||
                  loadingSubcategories ||
                  submitting
                }
              >
                <option value="">
                  {loadingSubcategories ? t.loading : t.selectSubcategory}
                </option>

                {subcategories.map((subcategory) => (
                  <option key={subcategory._id} value={subcategory._id}>
                    {getLocalizedName(subcategory.name, activeLanguage)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="create-news-field">
            <label>{t.tags}</label>

            <div className="create-news-tags">
              {tags.length > 0 ? (
                tags.map((tag) => {
                  const tagName = formatTagName(tag);
                  const selected = form.tags.includes(tagName);

                  return (
                    <label key={tag._id} className="create-news-tag">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={
                          submitting ||
                          (!selected && form.tags.length >= 20)
                        }
                        onChange={() => handleTagChange(tagName)}
                      />
                      {getLocalizedName(tag.name, activeLanguage)}
                    </label>
                  );
                })
              ) : (
                <span className="create-news-muted">{t.noTags}</span>
              )}
            </div>
          </div>
        </section>

        <section className="create-news-card">
          <div className="create-news-card-heading">
            <div>
              <h2>{t.thumbnailTitle}</h2>
              <p>{t.thumbnailDescription}</p>
            </div>
          </div>

          <label className={`create-news-upload ${errors.thumbnail ? "has-field-error" : ""}`}>
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="Thumbnail preview" />
            ) : (
              <>
                <ImagePlus size={35} />
                <strong>{t.uploadImage}</strong>
                <span>{t.imageFormats}</span>
              </>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleThumbnailChange}
              disabled={submitting}
            />
          </label>
          {errors.thumbnail && (
            <span className="field-error-text" style={{ marginTop: "6px" }}>{errors.thumbnail}</span>
          )}

          {thumbnail && (
            <div className="create-news-selected-file">
              <span>{thumbnail.name}</span>

              <button
                type="button"
                onClick={handleThumbnailRemove}
                disabled={submitting}
                aria-label="Remove thumbnail"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="create-news-two-columns">
            {["en", "hi"].map((language) => (
              <div className="create-news-field" key={language}>
                <label>
                  {t.altText} ({language === "en" ? "English" : "हिंदी"})
                </label>

                <input
                  value={form.thumbnailAlt[language]}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      thumbnailAlt: {
                        ...previous.thumbnailAlt,
                        [language]: event.target.value,
                      },
                    }))
                  }
                  placeholder={t.altText}
                  maxLength={200}
                  disabled={submitting}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="create-news-card">
          <div className="create-news-card-heading">
            <div>
              <h2>{t.galleryTitle}</h2>
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
                disabled={submitting}
                onChange={(event) =>
                  handleArticleMediaChange(event, "image")
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
                disabled={submitting}
                onChange={(event) =>
                  handleArticleMediaChange(event, "video")
                }
              />
            </label>
          </div>

          <div className="create-news-media-limits">
            <span>{t.imageLimit}</span>
            <span>{t.videoLimit}</span>
          </div>

          {articleMedia.length > 0 && (
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
                      {item.type === "image" ? "Image" : "Video"} {index + 1}
                    </strong>

                    <span>{item.file.name}</span>

                    {item.type === "image" && (
                      <input
                        type="text"
                        value={item.alt}
                        onChange={(event) =>
                          updateArticleMediaAlt(item.id, event.target.value)
                        }
                        placeholder={t.mediaAlt}
                        maxLength={200}
                        disabled={submitting}
                      />
                    )}
                  </div>

                  <div className="create-news-media-controls">
                    <button
                      type="button"
                      aria-label={t.moveUp}
                      title={t.moveUp}
                      disabled={index === 0 || submitting}
                      onClick={() => moveArticleMedia(index, -1)}
                    >
                      <ChevronUp size={17} />
                    </button>

                    <button
                      type="button"
                      aria-label={t.moveDown}
                      title={t.moveDown}
                      disabled={
                        index === articleMedia.length - 1 || submitting
                      }
                      onClick={() => moveArticleMedia(index, 1)}
                    >
                      <ChevronDown size={17} />
                    </button>

                    <button
                      type="button"
                      aria-label={t.removeMedia}
                      title={t.removeMedia}
                      disabled={submitting}
                      onClick={() => removeArticleMedia(item.id)}
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="create-news-card">
          <div className="create-news-card-heading">
            <div>
              <h2>{t.seoTitle}</h2>
              <p>{t.seoDescription}</p>
            </div>
          </div>

          <div className="language-tabs">
            <button
              type="button"
              className={activeLanguage === "en" ? "active" : ""}
              onClick={() => setActiveLanguage("en")}
            >
              English
            </button>

            <button
              type="button"
              className={activeLanguage === "hi" ? "active" : ""}
              onClick={() => setActiveLanguage("hi")}
            >
              हिंदी
            </button>
          </div>

          <div className="create-news-field">
            <label>{t.seoTitleLabel}</label>
            <input
              value={currentSEO.title}
              onChange={(event) =>
                updateLocalizedField("seo", "title", event.target.value)
              }
              maxLength={70}
              disabled={submitting}
            />
          </div>

          <div className="create-news-field">
            <label>{t.seoDescriptionLabel}</label>
            <textarea
              value={currentSEO.description}
              onChange={(event) =>
                updateLocalizedField("seo", "description", event.target.value)
              }
              rows={3}
              maxLength={170}
              disabled={submitting}
            />
          </div>
        </section>

        <section className="create-news-card">
          <div className="create-news-card-heading">
            <div>
              <h2>{t.publishingTitle}</h2>
              <p>{t.publishingDescription}</p>
            </div>
          </div>

          <div className="create-news-field">
            <label>{t.articleStatus}</label>

            <select
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value)
              }
              disabled={submitting}
            >
              <option value="draft">{t.draft}</option>
              <option value="published">{t.published}</option>
              <option value="scheduled">{t.scheduled}</option>
            </select>
          </div>

          {form.status === "scheduled" && (
            <div className="create-news-field">
              <label>
                <CalendarDays size={15} />
                {t.scheduleDate}
              </label>

              <input
                type="datetime-local"
                className={errors.scheduledAt ? "has-field-error" : ""}
                min={localDateTime}
                value={form.scheduledAt}
                onChange={(event) =>
                  updateField("scheduledAt", event.target.value)
                }
                disabled={submitting}
              />
              {errors.scheduledAt && (
                <span className="field-error-text">{errors.scheduledAt}</span>
              )}
            </div>
          )}

          <div className="create-news-flags">
            <label>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  updateField("isFeatured", event.target.checked)
                }
                disabled={submitting}
              />
              {t.featured}
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isBreaking}
                onChange={(event) =>
                  updateField("isBreaking", event.target.checked)
                }
                disabled={submitting}
              />
              {t.breaking}
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isTrending}
                onChange={(event) =>
                  updateField("isTrending", event.target.checked)
                }
                disabled={submitting}
              />
              {t.trending}
            </label>
          </div>
        </section>

        <div className="create-news-submit">
          <button
            type="button"
            className="create-news-cancel"
            onClick={handleBackOrCancel}
            disabled={submitting}
          >
            {t.cancel}
          </button>

          <button
            type="submit"
            className="create-news-save"
            disabled={submitting || loadingOptions}
          >
            {form.status === "published" ? (
              <Send size={17} />
            ) : (
              <Save size={17} />
            )}

            {submitting
              ? t.saving
              : form.status === "published"
                ? t.publishArticle
                : form.status === "scheduled"
                  ? t.scheduleArticle
                  : t.saveDraft}
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

export default CreateNews;
