"use strict";

const crypto = require("crypto");
const _ = require("lodash");

const convertToApiResult = (code, data) => {
  let resultData = null;

  if (data) {
    if (Array.isArray(data)) {
      resultData = data.map(value => {
        return value.dataValues ? value.dataValues : value;
      });
    } else {
      resultData = data.dataValues ? data.dataValues : data;
    }
  }

  return { "result_code": code, "result_data": resultData };
};

const getRequestId = (methodId) => {
  return `${methodId}_${randomString(10)}_${new Date().getTime().toString()}`;
};


const generateRowId = (subid) => {
  const EPOCH = 1300000000000;
  const randid = Math.floor(Math.random() * 512);

  let ts = new Date().getTime() - EPOCH; // limit to recent
  ts = (ts * 64);   // bit-shift << 6
  ts = ts + subid;
  return (ts * 512) + (randid % 512);
};


const randomString = (length) => {
  return crypto.randomBytes(Math.ceil(length * 3 / 4))
    .toString("base64").slice(0, length).replace(/\+/g, "0").replace(/\//g, "0");
};

//-- start : Date 관련 format 재정의 --//
Date.prototype.format = function (f) {
  if (!this.valueOf()) return " ";

  var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  var d = this;
  var h = 102;

  return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function ($1) {
    switch ($1) {
      case "yyyy": return d.getFullYear();
      case "yy": return (d.getFullYear() % 1000).zf(2);
      case "MM": return (d.getMonth() + 1).zf(2);
      case "dd": return d.getDate().zf(2);
      case "E": return weekName[d.getDay()];
      case "HH": return d.getHours().zf(2);
      case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
      case "mm": return d.getMinutes().zf(2);
      case "ss": return d.getSeconds().zf(2);
      case "a/p": return d.getHours() < 12 ? "오전" : "오후";
      default: return $1;
    }
  });
};

String.prototype.string = function (len) { var s = '', i = 0; while (i++ < len) { s += this; } return s; };
String.prototype.zf = function (len) { return "0".string(len - this.length) + this; };
Number.prototype.zf = function (len) { return this.toString().zf(len); };
//-- end : Date 관련 format 재정의 --//

const getCurrentDate = (requestId) => {
  // return new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '');
  return new Date().format("yyyy-MM-dd HH:mm:ss");
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateAppLogs = (db, rowId, result) => {
  if (!rowId) return;

  const collection = process.env.ENV === "prod" ? "AppLogs" : "AppLogsDev";
  const doc = {};
  doc.rowId = rowId;
  doc.res = _.cloneDeep(result);
  db.collection(collection).findOneAndUpdate({ rowId }, { $set: doc }, { upsert: true }, (error, result) => {
    if (error) {
      logger.error("logMiddleware", error.stack);
    }
  });
};


module.exports = {
  convertToApiResult,
  getRequestId,
  generateRowId,
  delay,
  getCurrentDate,
  updateAppLogs
};