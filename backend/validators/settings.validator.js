
const allowedPlatforms = [
  "facebook",
  "instagram",
  "youtube",
  "whatsapp",
  "twitter",
];

const allowedTopLevelFields = [
  "websiteName",
  "branding",
  "contact",
  "socialLinks",
  "socialDisplay",
];

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const isValidBoolean = (value) =>
  typeof value === "boolean";

const isValidEmail = (value) =>
  typeof value === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhone = (value) =>
  typeof value === "string" &&
  /^[+0-9()\s-]{7,20}$/.test(value);

const isValidUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const isValidMediaPath = (value) => {
  if (value === null) return true;

  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  if (value.startsWith("/uploads/")) {
    return !value.includes("..") &&
      !value.includes("\\");
  }

  return isValidUrl(value);
};

const validateLocalized = (value, fieldName, errors) => {
  if (!isPlainObject(value)) {
    errors.push(`${fieldName} must be an object`);
    return;
  }

  const allowedLanguages = ["en", "hi"];

  Object.keys(value).forEach((language) => {
    if (!allowedLanguages.includes(language)) {
      errors.push(`${fieldName}.${language} is not allowed`);
    }
  });

  allowedLanguages.forEach((language) => {
    if (value[language] !== undefined &&
        typeof value[language] !== "string") {
      errors.push(`${fieldName}.${language} must be a string`);
    }

    if (
      typeof value[language] === "string" &&
      value[language].length > 500
    ) {
      errors.push(`${fieldName}.${language} is too long`);
    }
  });
};

const validateVisibilityObject = (
  value,
  allowedFields,
  fieldName,
  errors
) => {
  if (!isPlainObject(value)) {
    errors.push(`${fieldName} must be an object`);
    return;
  }

  Object.keys(value).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push(`${fieldName}.${key} is not allowed`);
    } else if (!isValidBoolean(value[key])) {
      errors.push(`${fieldName}.${key} must be a boolean`);
    }
  });
};

const validateSettings = (req, res, next) => {
  const data = req.body;
  const errors = [];

  if (!isPlainObject(data)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be an object",
    });
  }

  const unknownFields = Object.keys(data).filter(
    (field) => !allowedTopLevelFields.includes(field)
  );

  if (unknownFields.length) {
    errors.push(
      `Unknown fields: ${unknownFields.join(", ")}`
    );
  }

  if (data.websiteName !== undefined) {
    validateLocalized(data.websiteName, "websiteName", errors);
  }

  if (data.branding !== undefined) {
    const allowedBrandingFields = [
      "logo",
      "mobileLogo",
      "footerLogo",
      "favicon",
    ];

    if (!isPlainObject(data.branding)) {
      errors.push("branding must be an object");
    } else {
      Object.keys(data.branding).forEach((key) => {
        if (!allowedBrandingFields.includes(key)) {
          errors.push(`branding.${key} is not allowed`);
          return;
        }

        const item = data.branding[key];

        if (!isPlainObject(item)) {
          errors.push(`branding.${key} must be an object`);
          return;
        }

        Object.keys(item).forEach((property) => {
          if (!["url", "isVisible"].includes(property)) {
            errors.push(
              `branding.${key}.${property} is not allowed`
            );
          }
        });

        if (
          item.url !== undefined &&
          !isValidMediaPath(item.url)
        ) {
          errors.push(
            `branding.${key}.url must be a valid media path or HTTP(S) URL`
          );
        }

        if (
          item.isVisible !== undefined &&
          !isValidBoolean(item.isVisible)
        ) {
          errors.push(
            `branding.${key}.isVisible must be a boolean`
          );
        }
      });
    }
  }

  if (data.contact !== undefined) {
    const allowedContactFields = [
      "mobile",
      "whatsapp",
      "email",
      "address",
      "showContactInFooter",
      "showFloatingWhatsapp",
    ];

    if (!isPlainObject(data.contact)) {
      errors.push("contact must be an object");
    } else {
      Object.keys(data.contact).forEach((key) => {
        if (!allowedContactFields.includes(key)) {
          errors.push(`contact.${key} is not allowed`);
        }
      });

      ["mobile", "whatsapp", "email"].forEach((field) => {
        const item = data.contact[field];

        if (item === undefined) return;

        if (!isPlainObject(item)) {
          errors.push(`contact.${field} must be an object`);
          return;
        }

        Object.keys(item).forEach((key) => {
          if (!["value", "isVisible"].includes(key)) {
            errors.push(`contact.${field}.${key} is not allowed`);
          }
        });

        if (item.value !== undefined) {
          if (
            field === "email" &&
            item.value !== "" &&
            !isValidEmail(item.value)
          ) {
            errors.push("Invalid contact email address");
          }

          if (
            ["mobile", "whatsapp"].includes(field) &&
            item.value !== "" &&
            !isValidPhone(item.value)
          ) {
            errors.push(`Invalid ${field} number`);
          }
        }

        if (
          item.isVisible !== undefined &&
          !isValidBoolean(item.isVisible)
        ) {
          errors.push(
            `contact.${field}.isVisible must be a boolean`
          );
        }
      });

      if (data.contact.address !== undefined) {
        const address = data.contact.address;

        if (!isPlainObject(address)) {
          errors.push("contact.address must be an object");
        } else {
          Object.keys(address).forEach((key) => {
            if (!["value", "isVisible"].includes(key)) {
              errors.push(`contact.address.${key} is not allowed`);
            }
          });

          if (address.value !== undefined) {
            validateLocalized(
              address.value,
              "contact.address.value",
              errors
            );
          }

          if (
            address.isVisible !== undefined &&
            !isValidBoolean(address.isVisible)
          ) {
            errors.push(
              "contact.address.isVisible must be a boolean"
            );
          }
        }
      }

      ["showContactInFooter", "showFloatingWhatsapp"].forEach(
        (field) => {
          if (
            data.contact[field] !== undefined &&
            !isValidBoolean(data.contact[field])
          ) {
            errors.push(`contact.${field} must be a boolean`);
          }
        }
      );
    }
  }

  if (data.socialLinks !== undefined) {
    if (!Array.isArray(data.socialLinks)) {
      errors.push("socialLinks must be an array");
    } else {
      const seenPlatforms = new Set();

      data.socialLinks.forEach((item, index) => {
        const prefix = `socialLinks.${index}`;

        if (!isPlainObject(item)) {
          errors.push(`${prefix} must be an object`);
          return;
        }

        const allowedSocialFields = [
          "platform",
          "url",
          "isActive",
          "showInHeader",
          "showInFooter",
        ];

        Object.keys(item).forEach((key) => {
          if (!allowedSocialFields.includes(key)) {
            errors.push(`${prefix}.${key} is not allowed`);
          }
        });

        if (!allowedPlatforms.includes(item.platform)) {
          errors.push(`${prefix}.platform is invalid`);
        } else if (seenPlatforms.has(item.platform)) {
          errors.push(`${prefix}.platform is duplicated`);
        } else {
          seenPlatforms.add(item.platform);
        }

        if (
          item.url !== undefined &&
          item.url !== "" &&
          !isValidUrl(item.url)
        ) {
          errors.push(`${prefix}.url must be a valid HTTP(S) URL`);
        }

        ["isActive", "showInHeader", "showInFooter"].forEach(
          (field) => {
            if (
              item[field] !== undefined &&
              !isValidBoolean(item[field])
            ) {
              errors.push(`${prefix}.${field} must be a boolean`);
            }
          }
        );

        if (
          item.isActive === true &&
          (!item.url || !isValidUrl(item.url))
        ) {
          errors.push(
            `${prefix}.url is required when the social link is active`
          );
        }
      });
    }
  }

  if (data.socialDisplay !== undefined) {
    validateVisibilityObject(
      data.socialDisplay,
      ["showInHeader", "showInFooter"],
      "socialDisplay",
      errors
    );
  }

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Settings validation failed",
      errors,
    });
  }

  req.validatedData = data;

  next();
};

module.exports = {
  validateSettings,
};
