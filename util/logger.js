"use strict";


const winston = require("winston");
const moment = require("moment-timezone");


const tsFormat = () => {
  return moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
};

// define the custom settings for each transport (file, console)
const options = {
  console: {
    level: "debug",
    handleExceptions: true,
    json: false,
    colorize: true,
    timestamp: tsFormat
  },
};

// instantiate a new Winston Logger with the settings defined above
const logger = new winston.Logger({
  transports: [
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});


module.exports = logger;