"use strict";

const env = process.env.ENV === "prod" ? "prod" : "dev";
const sequelize = require("sequelize");
const logger = require("../util/logger");

const config = require("./config.json")[env];
config.mysql.logging = (msg) => {
  logger.debug(msg);
};

const db = new sequelize(config.mysql.database, config.mysql.user, config.mysql.password, config.mysql);

db.linkaScannerAgentBalance = db.import("../model/linka_scanneragent_balance");
db.linkaScannerAgentBlock = db.import("../model/linka_scanneragent_block");
db.linkaScannerAgentTransaction = db.import("../model/linka_scanneragent_transaction");

module.exports.db = db;