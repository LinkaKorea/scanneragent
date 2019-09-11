"use strict";

const jwt = require("jsonwebtoken");
const util = require("../util");

const authMiddleware = async (req, res, next) => {
  const secret = req.app.get("jwt-secret");
  const token = req.headers["x-access-token"];

  if (token) {
    try {
      req.decoded = await jwt.verify(token, secret);
      next();

    } catch (error) {
      const apiResult = util.convertToApiResult(403, error.message);
      res.json(apiResult);
    }
  } else {
    const apiResult = util.convertToApiResult(401, "Unauthorized");
    res.json(apiResult);
  }
};

module.exports = authMiddleware;