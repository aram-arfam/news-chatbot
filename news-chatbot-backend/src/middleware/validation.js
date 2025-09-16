export const validateMessage = (req, res, next) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      message: "Valid message is required",
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Message too long",
    });
  }

  next();
};
