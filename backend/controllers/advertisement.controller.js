
const advertisementService = require("../services/advertisement.service");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createAdvertisement = async (req, res, next) => {
  try {
    const advertisement = await advertisementService.createAdvertisement(
      req.validatedData,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: "Advertisement created successfully",
      advertisement,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminAdvertisements = async (req, res, next) => {
  try {
    const { page, limit, search, pageType, position, isActive } = req.query;

    let activeFilter;

    if (isActive !== undefined && isActive !== "") {
      if (isActive !== "true" && isActive !== "false") {
        throw createError("isActive must be true or false");
      }

      activeFilter = isActive === "true";
    }

    const result = await advertisementService.getAdminAdvertisements({
      page,
      limit,
      search,
      pageType,
      position,
      isActive: activeFilter,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getAdvertisementById = async (req, res, next) => {
  try {
    const advertisement = await advertisementService.getAdvertisementById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      advertisement,
    });
  } catch (error) {
    next(error);
  }
};

const updateAdvertisement = async (req, res, next) => {
  try {
    const advertisement = await advertisementService.updateAdvertisement(
      req.params.id,
      req.validatedData,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Advertisement updated successfully",
      advertisement,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAdvertisement = async (req, res, next) => {
  try {
    await advertisementService.deleteAdvertisement(req.params.id);

    res.status(200).json({
      success: true,
      message: "Advertisement deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getPublicAdvertisements = async (req, res, next) => {
  try {
    const { page, position, device } = req.query;

    const advertisements =
      await advertisementService.getPublicAdvertisements({
        page,
        position,
        device,
      });

    res.status(200).json({
      success: true,
      advertisements,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAdvertisement,
  getAdminAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
  getPublicAdvertisements,
};
