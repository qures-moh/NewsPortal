
const mongoose = require("mongoose");

const allowedLanguages = ["en", "hi"];
const allowedStatuses = ["draft", "published", "scheduled", "archived"];
const allowedMediaTypes = ["image", "video"];

const isValidText = (value, min, max) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.trim().length <= max;

const isOptionalText = (value, max) =>
  value === "" ||
  (typeof value === "string" && value.trim().length <= max);

const containsDevanagari = (value) =>
  typeof value === "string" && /[\u0900-\u097F]/u.test(value);

const isValidObjectId = (value) =>
  typeof value === "string" &&
  mongoose.Types.ObjectId.isValid(value) &&
  new mongoose.Types.ObjectId(value).toString() === value;

const isValidUploadPath = (value, type) => {
  if (typeof value !== "string" || value.length > 1000) {
    return false;
  }

  const folder = type === "image" ? "images" : "videos";

  return new RegExp(
    `^/?uploads/${folder}/[a-zA-Z0-9._-]+$`
  ).test(value);
};

const validateLocalizedContent = (content, language) => {
  const errors = [];

  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return [`${language} content must be an object`];
  }

  const allowedFields = ["title", "excerpt", "content"];

  const unknownFields = Object.keys(content).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    errors.push(`${language} content contains unsupported fields`);
  }

  if (!isValidText(content.title, 5, 200)) {
    errors.push(`${language} title must be between 5 and 200 characters`);
  }

  if (!isValidText(content.excerpt, 20, 500)) {
    errors.push(`${language} excerpt must be between 20 and 500 characters`);
  }

  if (!isValidText(content.content, 50, 100000)) {
    errors.push(`${language} content must be between 50 and 100000 characters`);
  }

  if (language === "hi") {
    if (isValidText(content.title, 5, 200) && !containsDevanagari(content.title)) {
      errors.push("Hindi title must contain Devanagari characters");
    }

    if (
      isValidText(content.excerpt, 20, 500) &&
      !containsDevanagari(content.excerpt)
    ) {
      errors.push("Hindi excerpt must contain Devanagari characters");
    }

    if (
      isValidText(content.content, 50, 100000) &&
      !containsDevanagari(content.content)
    ) {
      errors.push("Hindi content must contain Devanagari characters");
    }
  }

  return errors;
};

const validateSeo = (seo, language) => {
  const errors = [];

  if (!seo || typeof seo !== "object" || Array.isArray(seo)) {
    return [`${language} SEO must be an object`];
  }

  const allowedFields = ["title", "description"];

  const unknownFields = Object.keys(seo).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    errors.push(`${language} SEO contains unsupported fields`);
  }

  if (seo.title !== undefined && !isOptionalText(seo.title, 200)) {
    errors.push(`${language} SEO title must not exceed 200 characters`);
  }

  if (
    seo.description !== undefined &&
    !isOptionalText(seo.description, 300)
  ) {
    errors.push(`${language} SEO description must not exceed 300 characters`);
  }

  return errors;
};

const validateLocalizedOptionalText = (
  value,
  fieldName,
  maxLength
) => {
  const errors = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [`${fieldName} must be an object`];
  }

  const unknownLanguages = Object.keys(value).filter(
    (language) => !allowedLanguages.includes(language)
  );

  if (unknownLanguages.length) {
    errors.push(`${fieldName} contains unsupported languages`);
  }

  for (const language of Object.keys(value)) {
    if (!isOptionalText(value[language], maxLength)) {
      errors.push(
        `${fieldName}.${language} must not exceed ${maxLength} characters`
      );
    }
  }

  return errors;
};

const validateMedia = (media) => {
  const errors = [];

  if (!Array.isArray(media)) {
    return ["Media must be an array"];
  }

  if (media.length > 13) {
    errors.push("An article can contain at most 13 media files");
  }

  const imageCount = media.filter(
    (item) => item?.type === "image"
  ).length;

  const videoCount = media.filter(
    (item) => item?.type === "video"
  ).length;

  if (imageCount > 10) {
    errors.push("An article can contain at most 10 images");
  }

  if (videoCount > 3) {
    errors.push("An article can contain at most 3 videos");
  }

  const allowedFields = ["_id", "type", "url", "alt", "order"];
  const usedOrders = new Set();

  media.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`Media item ${index + 1} must be an object`);
      return;
    }

    const unknownFields = Object.keys(item).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length) {
      errors.push(`Media item ${index + 1} contains unsupported fields`);
    }

    if (item._id !== undefined && !isValidObjectId(item._id)) {
      errors.push(`Media item ${index + 1} has an invalid ID`);
    }

    if (!allowedMediaTypes.includes(item.type)) {
      errors.push(`Media item ${index + 1} has an invalid media type`);
      return;
    }

    if (!isValidUploadPath(item.url, item.type)) {
      errors.push(
        `Media item ${index + 1} has an invalid ${item.type} upload path`
      );
    }

    if (item.alt !== undefined && !isOptionalText(item.alt, 200)) {
      errors.push(`Media item ${index + 1} alt text is invalid`);
    }

    if (
      item.order !== undefined &&
      (!Number.isInteger(item.order) ||
        item.order < 0 ||
        item.order > 12)
    ) {
      errors.push(`Media item ${index + 1} has an invalid order`);
    }

    if (item.order !== undefined) {
      if (usedOrders.has(item.order)) {
        errors.push("Media order values must be unique");
      }

      usedOrders.add(item.order);
    }
  });

  return errors;
};

const validateAvailableLanguages = (languages) => {
  return (
    Array.isArray(languages) &&
    languages.length > 0 &&
    languages.every((language) => allowedLanguages.includes(language)) &&
    new Set(languages).size === languages.length
  );
};

const validateScheduledDate = (scheduledAt) => {
  if (typeof scheduledAt !== "string") return false;

  const scheduledDate = new Date(scheduledAt);

  return (
    !Number.isNaN(scheduledDate.getTime()) &&
    scheduledDate > new Date()
  );
};

const validateCommonFields = (body, errors, isUpdate = false) => {
  const allowedFields = [
    "title",
    "availableLanguages",
    "category",
    "subcategory",
    "thumbnail",
    "thumbnailAlt",
    "media",
    "tags",
    "status",
    "seo",
    "isFeatured",
    "isBreaking",
    "isTrending",
    "scheduledAt",
  ];

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  if (body.title !== undefined) {
    if (
      typeof body.title !== "object" ||
      body.title === null ||
      Array.isArray(body.title)
    ) {
      errors.push("Title must be an object");
    } else {
      for (const language of Object.keys(body.title)) {
        if (!allowedLanguages.includes(language)) {
          errors.push(`Unsupported language: ${language}`);
          continue;
        }

        errors.push(
          ...validateLocalizedContent(body.title[language], language)
        );
      }
    }
  } else if (!isUpdate) {
    errors.push("Article title and content are required");
  }

  if (body.availableLanguages !== undefined) {
    if (!validateAvailableLanguages(body.availableLanguages)) {
      errors.push("Select valid and unique available languages");
    } else if (body.title !== undefined) {
      const missingLanguages = body.availableLanguages.filter(
        (language) => body.title[language] === undefined
      );

      if (missingLanguages.length) {
        errors.push(
          `Missing article content for: ${missingLanguages.join(", ")}`
        );
      }

      const unusedLanguages = Object.keys(body.title).filter(
        (language) => !body.availableLanguages.includes(language)
      );

      if (unusedLanguages.length) {
        errors.push("Content contains languages not listed as available");
      }
    }
  }

  if (!isUpdate && !validateAvailableLanguages(body.availableLanguages)) {
    errors.push("Select valid and unique available languages");
  }

  if (body.category !== undefined && !isValidObjectId(body.category)) {
    errors.push("Invalid category ID");
  } else if (!isUpdate && body.category === undefined) {
    errors.push("A valid category ID is required");
  }

  if (
    body.subcategory !== undefined &&
    body.subcategory !== null &&
    !isValidObjectId(body.subcategory)
  ) {
    errors.push("Invalid subcategory ID");
  }

  if (body.thumbnail !== undefined) {
    if (!isValidUploadPath(body.thumbnail, "image")) {
      errors.push("Invalid thumbnail upload path");
    }
  } else if (!isUpdate) {
    errors.push("A thumbnail image is required");
  }

  if (body.thumbnailAlt !== undefined) {
    errors.push(
      ...validateLocalizedOptionalText(
        body.thumbnailAlt,
        "Thumbnail alt text",
        200
      )
    );
  }

  if (body.media !== undefined) {
    errors.push(...validateMedia(body.media));
  }

  if (
    body.status !== undefined &&
    !allowedStatuses.includes(body.status)
  ) {
    errors.push("Invalid news publishing status");
  }

  if (!isUpdate && body.status === undefined) {
    errors.push("News publishing status is required");
  }

  if (
    body.tags !== undefined &&
    (!Array.isArray(body.tags) ||
      body.tags.length > 20 ||
      body.tags.some((tag) => !isValidText(tag, 1, 40)))
  ) {
    errors.push("Tags must be an array containing at most 20 valid tags");
  }

  for (const field of ["isFeatured", "isBreaking", "isTrending"]) {
    if (body[field] !== undefined && typeof body[field] !== "boolean") {
      errors.push(`${field} must be a boolean`);
    }
  }

  if (body.seo !== undefined) {
    if (
      typeof body.seo !== "object" ||
      body.seo === null ||
      Array.isArray(body.seo)
    ) {
      errors.push("SEO must be an object");
    } else {
      for (const [language, seo] of Object.entries(body.seo)) {
        if (!allowedLanguages.includes(language)) {
          errors.push(`Unsupported SEO language: ${language}`);
          continue;
        }

        errors.push(...validateSeo(seo, language));
      }
    }
  }

  if (body.scheduledAt !== undefined) {
    if (
      body.status !== "scheduled" ||
      !validateScheduledDate(body.scheduledAt)
    ) {
      errors.push("Provide a valid future scheduled date for scheduled news");
    }
  } else if (!isUpdate && body.status === "scheduled") {
    errors.push("A scheduled date is required for scheduled news");
  }
};

const validateNews = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const errors = [];

  validateCommonFields(body, errors);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "News validation failed",
      errors,
    });
  }

  req.validatedData = body;
  next();
};

const validateNewsUpdate = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const errors = [];

  if (Object.keys(body).length === 0) {
    errors.push("At least one field is required");
  }

  validateCommonFields(body, errors, true);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "News update validation failed",
      errors,
    });
  }

  req.validatedData = body;
  next();
};

module.exports = {
  validateNews,
  validateNewsUpdate,
};
