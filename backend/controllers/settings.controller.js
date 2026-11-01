
const settingsService = require("../services/settings.service");

const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getPublicSettings();

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getAdminSettings();

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings(
      req.validatedData,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Website settings updated successfully",
      settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
};
