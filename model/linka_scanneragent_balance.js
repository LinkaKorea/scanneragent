"use strict";

// linkaScannerAgentBalance
module.exports = (sequelize, DataTypes) => {
  return sequelize.define("linkaScannerAgentBalance", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    currencyType: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    balance: { type: DataTypes.DECIMAL(28) },
    createDate: { type: DataTypes.DATE },
    updateDate: { type: DataTypes.DATE }
  }, {
      timestamps: false,
      tableName: "linkaScannerAgentBalance"
    });
}; 