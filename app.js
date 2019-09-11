"use strict";

const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const env = process.env.ENV === "prod" ? "prod" : "dev";
const config = require("./config/config.json")[env];
const util = require("./util");
const logger = require("./util/logger");

const blockScheduleJob = require("./routes/apiv1/agent/agentScheduleJob");

const app = express();
// // cors
app.use(cors());
// parse JSON and url-encoded query
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// set the secret key variable for jwt
app.set("jwt-secret", config.jwtSecret);


logger.info("CONFIG:\n", JSON.stringify(config, null, 4));
logger.info("ENVIRONMENT:", env);


app.listen(7091, blockScheduleJob.blockScheduleJob);


// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// // error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "dev" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(util.convertToApiResult(err.status || 500, err.message));
});

module.exports = app;