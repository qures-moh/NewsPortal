
const allowedFields = [
  "name",
  "slug",
  "description",
  "image",
  "displayOrder",
];

const isValidText = (value, min, max) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.trim().length <= max;

// const isValidSlug = (value) =>
//   typeof value === "string" &&
//   value.length <= 120 &&
//   /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const isValidSlug = (value) =>
  typeof value === "string" &&
  value.length <= 120 &&
  /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value);

const validateLocalizedField = (value, field, required = true) => {
  const errors = [];

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return required ? [`${field} must contain English and Hindi values`] : [];
  }

  for (const language of ["en", "hi"]) {
    const item = value[language];

    if (item === undefined && !required) continue;

    if (field === "slug") {
      if (!isValidSlug(item)) {
        errors.push(`Invalid ${language} slug`);
      }
    } else if (field === "name") {
      if (!isValidText(item, 2, 100)) {
        errors.push(`${language} name must be between 2 and 100 characters`);
      }
    } else if (field === "description") {
      if (
        item !== undefined &&
        item !== "" &&
        !isValidText(item, 1, 500)
      ) {
        errors.push(`${language} description must not exceed 500 characters`);
      }
    }
  }

  const unknownLanguages = Object.keys(value).filter(
    (language) => !["en", "hi"].includes(language)
  );

  if (unknownLanguages.length) {
    errors.push(`Unsupported languages in ${field}`);
  }

  return errors;
};

const validateCategoryData = (body, isUpdate = false) => {
  const errors = [];

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  if (isUpdate && Object.keys(body).length === 0) {
    errors.push("At least one field is required");
  }

  if (!isUpdate || body.name !== undefined) {
    errors.push(
      ...validateLocalizedField(body.name, "name")
    );
  }

  if (!isUpdate || body.slug !== undefined) {
    errors.push(
      ...validateLocalizedField(body.slug, "slug")
    );
  }

  if (body.description !== undefined) {
    errors.push(
      ...validateLocalizedField(body.description, "description", false)
    );
  }

  if (
    body.image !== undefined &&
    body.image !== null &&
    !isValidText(body.image, 1, 500)
  ) {
    errors.push("Image must be a valid path or URL");
  }

  if (
    body.displayOrder !== undefined &&
    (!Number.isInteger(body.displayOrder) ||
      body.displayOrder < 0 ||
      body.displayOrder > 10000)
  ) {
    errors.push("Display order must be an integer between 0 and 10000");
  }

  return errors;
};

const validateCategory = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const errors = validateCategoryData(body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Category validation failed",
      errors,
    });
  }

  req.validatedData = body;
  next();
};

const validateCategoryUpdate = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const errors = validateCategoryData(body, true);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Category update validation failed",
      errors,
    });
  }

  req.validatedData = body;
  next();
};

module.exports = {
  validateCategory,
  validateCategoryUpdate,
};
