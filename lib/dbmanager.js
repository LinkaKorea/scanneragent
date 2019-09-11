'use strict';

const sequelize = require("../config/sequelize");
const logger = require("../util/logger");
const utils = require("../util");

let transaction = null;

const dbInsert = async (req, objTable, values) => {
    try {
        transaction = await sequelize.db.transaction();

        await objTable.create(values, { transaction });
        await transaction.commit();

        return utils.convertToApiResult(true, "");

    } catch (error) {
        logger.error(error.stack);

        if (transaction) {
            await transaction.rollback();
        }

        return utils.convertToApiResult(false, error.message);
    }
};

const dbSelectAll = async (req, objTable, values) => {
    try {
        const options = {
            where: values
        };

        let result = await objTable.findAll(options);
        let result_code = (result == null) ? false : true;
        return utils.convertToApiResult(result_code, result);

    } catch (error) {
        logger.error(error.stack);

        return utils.convertToApiResult(false, error.message);
    }
};

const dbSelectOne = async (req, objTable, values) => {
    try {
        const options = {
            where: values
        };

        let result = await objTable.findOne(options);
        let result_code = (result == null) ? false : true;
        return utils.convertToApiResult(result_code, result);

    } catch (error) {
        logger.error(error.stack);

        if (transaction) {
            await transaction.rollback();
        }

        return utils.convertToApiResult(false, error.message);
    }
};

const dbUpdate = async (req, objTable, values, where) => {
    try {
        transaction = await sequelize.db.transaction();

        const options = {
            where: where
        };

        await objTable.update(values, options, { transaction });
        await transaction.commit();

        return utils.convertToApiResult(true, "");

    } catch (error) {
        logger.error(error.stack);

        if (transaction) {
            await transaction.rollback();
        }

        return utils.convertToApiResult(false, error.message);
    }
};

module.exports = {
    dbInsert
    , dbSelectAll
    , dbSelectOne
    , dbUpdate
};