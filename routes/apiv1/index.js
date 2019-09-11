"use strict";

const router = require("express").Router();

const util = require("../../util");

// APP layer 요청 처리
const app = require("./agent");
router.use("/app", app);

// for ELB
router.get("/ping", (req, res) => {
  const apiResult = util.convertToApiResult(200, "OK");
  res.json(apiResult);
});

module.exports = router;