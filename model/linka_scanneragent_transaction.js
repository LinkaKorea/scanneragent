"use strict";

// linkaScannerAgentTransaction
module.exports = (sequelize, DataTypes) => {
  return sequelize.define("linkaScannerAgentTransaction", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    blockId: { type: DataTypes.INTEGER },
    txHash: { type: DataTypes.STRING },
    status: { type: DataTypes.INTEGER },
    createMspId: { type: DataTypes.STRING },
    endorserMspId: { type: DataTypes.STRING },
    readSet: { type: DataTypes.STRING },
    writeSet: { type: DataTypes.STRING },
    creatorNonce: { type: DataTypes.INTEGER },
    txResponse: { type: DataTypes.STRING },
    validationCode: { type: DataTypes.INTEGER },
    createDate: { type: DataTypes.DATE }
  }, {
    timestamps: false,
    tableName: "linkaScannerAgentTransaction"
  });
};