"use strict";

// linkaScannerAgentBlock
module.exports = (sequelize, DataTypes) => {
  return sequelize.define("linkaScannerAgentBlock", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    blockNum: { type: DataTypes.INTEGER },
    dataHash: { type: DataTypes.STRING },
    preHash: { type: DataTypes.STRING },
    txCount: { type: DataTypes.INTEGER },
    prevBlockHash: { type: DataTypes.STRING },
    blockHash: { type: DataTypes.STRING },
    channelName: { type: DataTypes.STRING },
    createDate: { type: DataTypes.DATE }
  }, {
      timestamps: false,
      tableName: "linkaScannerAgentBlock"
    });
};