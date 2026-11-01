
const allowedFields = [
  "name",
  "slug",
  "description",
  "category",
  "displayOrder",
];

const isValidText = (value, min, max) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.trim().length <= max;

const isValidSlug = (value) =>
  typeof value === "string" &&
  value.length <= 120 &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const isValidObjectId = (value) =>
  typeof value === "string" &&
  /^[a-fA-F0-9]{24}$/.test(value);

const validateLocalizedField = (
  value,
  field,
  required = true
) => {
  const errors = [];

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return required
      ? [`${field} must contain English and Hindi values`]
      : [];
  }

  const allowedLanguages = ["en", "hi"];

  const unknownLanguages = Object.keys(value).filter(
    (language) => !allowedLanguages.includes(language)
  );

  if (unknownLanguages.length) {
    errors.push(`Unsupported languages in ${field}`);
  }

  for (const language of allowedLanguages) {
    const item = value[language];

    if (item === undefined && !required) continue;

    if (field === "slug" && !isValidSlug(item)) {
      errors.push(`Invalid ${language} slug`);
    }

    if (
      field === "name" &&
      !isValidText(item, 2, 100)
    ) {
      errors.push(
        `${language} name must be between 2 and 100 characters`
      );
    }

    if (
      field === "description" &&
      item !== undefined &&
      item !== "" &&
      !isValidText(item, 1, 500)
    ) {
      errors.push(
        `${language} description must not exceed 500 characters`
      );
    }
  }

  return errors;
};

const validateSubcategoryData = (body, isUpdate = false) => {
  const errors = [];

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    errors.push(
      `Unknown fields: ${unknownFields.join(", ")}`
    );
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
      ...validateLocalizedField(
        body.description,
        "description",
        false
      )
    );
  }

  if (
    (!isUpdate || body.category !== undefined) &&
    !isValidObjectId(body.category)
  ) {
    errors.push("A valid category ID is required");
  }

  if (
    body.displayOrder !== undefined &&
    (!Number.isInteger(body.displayOrder) ||
      body.displayOrder < 0 ||
      body.displayOrder > 10000)
  ) {
    errors.push(
      "Display order must be an integer between 0 and 10000"
    );
  }

  return errors;
};

const validateSubcategory = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const errors = validateSubcategoryData(body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Subcategory validation failed",
      errors,
    });
  }

  req.validatedData = body;
  next();
};

const validateSubcategoryUpdate = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const errors = validateSubcategoryData(body, true);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Subcategory update validation failed",
      errors,
    });
  }

  req.validatedData = body;
  next();
};

module.exports = {
  validateSubcategory,
  validateSubcategoryUpdate,
};
