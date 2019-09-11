"use strict";

const util = require("../util");
const logger = require("../util/logger");

// API 요청 logging
const logMiddleware = (req, res, next) => {
  const rowId = "APP_" + util.generateRowId(4);

  const { method, originalUrl, body } = req;
  logger.info(rowId, method, originalUrl);
  logger.info(rowId, "BODY:\n", JSON.stringify(body, null, 4));

  const doc = {
    rowId,
    url: originalUrl,
    req: {
      method, body
    },
    timestamp: new Date().getTime()
  };

  req.rowId = rowId;
  next();
};


module.exports = logMiddleware;