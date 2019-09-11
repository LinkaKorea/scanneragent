"use strict";

var fs = require('fs');
var hfc = require('fabric-client');
var schedule = require("node-schedule");

const logger = require("../../../util/logger");
const sequelize = require("../../../config/sequelize");
const dbmanager = require("../../../lib/dbmanager");
const constants = require("../../../util/constants");
const utils = require("../../../util");
const helper = require("../../../util/helper");

const env = process.env.ENV === "prod" ? "prod" : "dev";
const configInfo = require("../../../config/config.json")[env];
const mainnetInfo = configInfo["mainnet"];
const nodesdk = require("linka-node-sdk");

const LinkaScannerAgentBalance = sequelize.db.linkaScannerAgentBalance;
const LinkaScannerAgentBlock = sequelize.db.linkaScannerAgentBlock;
const LinkaScannerAgentTransaction = sequelize.db.linkaScannerAgentTransaction;

const configPath = mainnetInfo.configPath;

const orgName = mainnetInfo.orgName;
const channelName = mainnetInfo.channelName;
const peer = mainnetInfo.peers[0];


// 변수 초기화
const client = new hfc();
let channel = null;
let blockSyncLastNumberFile = "./config/blockSyncLastNumber.txt";
var lastBlockNumber = 0;
var currentLastBlockNumber = 0;



exports.blockScheduleJob = async (req) => {

    let isInit = await nodesdk.initConfig(orgName, configPath);


    lastBlockNumber = fs.readFileSync(blockSyncLastNumberFile);
    lastBlockNumber = parseInt(lastBlockNumber);


    var scheduleJob = schedule.scheduleJob(configInfo.linkScannerSyncAgent.interval, function () {
        blockScheduleJobWork(req);
    });
}


const blockScheduleJobWork = async (req) => {


    // invoke with nodesdk
    let response = await nodesdk.getChainInfo(peer, channelName, orgName);
    if (response.code == 0) {

        currentLastBlockNumber = parseInt(response.data.height.low);
    } else {
        logger.debug("Can not get chaininfo from blockchain");
    }

    for (var k = lastBlockNumber; k <= currentLastBlockNumber; k++) {

        if ((lastBlockNumber + 1) != currentLastBlockNumber) {

            let response_blockbynumber = await nodesdk.getBlockByNumber(peer, channelName, orgName, k);

            try {
                let block = response_blockbynumber.data;


                const block_hash = helper.generateBlockHash(block.header);


                let block_number = block.header.number;
                let block_previous_hash = block.header.previous_hash;
                let block_data_hash = block.header.data_hash;



                //--> start : insert block data into linkaScannerAgentBlock <--//
                let where_block = {
                    blockNum: block_number
                }
                let result_db_block = await dbmanager.dbSelectOne(req, LinkaScannerAgentBlock, where_block);
                if (result_db_block.result_code == true) {
                    continue;
                }

                let value_block = {
                    blockNum: block_number,
                    dataHash: block_data_hash,
                    preHash: "",
                    txCount: block.data.data.length,
                    prevBlockHash: block_previous_hash,
                    blockHash: block_hash,
                    channelName: block.data.data[0].payload.header.channel_header.channel_id,
                    createDate: utils.getCurrentDate("")
                };
                let result_db_linkascanneragentblock_insert = await dbmanager.dbInsert(req, LinkaScannerAgentBlock, value_block);

                if (result_db_linkascanneragentblock_insert.result_code == false) {
                    throw new Error(result_db_linkascanneragentblock_insert.result_data);
                }

                let metadata = block.metadata.metadata;
                logger.debug("metadata:->" + JSON.stringify(metadata));
                var txValidationCodes = metadata[2];

                let objTx = block.data.data;
                for (var i = 0; i < objTx.length; i++) {
                    let tx = objTx[i];

                    logger.debug("tx:->" + JSON.stringify(tx));
                    let header = tx.payload.header;
                    let channel_id = header.channel_header.channel_id;
                    if (channelName !== channel_id) return;

                    let tx_id = header.channel_header.tx_id;
                    let type_string = header.channel_header.typeString;
                    logger.debug("block-txid:->" + tx_id);
                    logger.debug("block-typestring:->" + type_string);

                    // CONFIG 블럭은 패스
                    if (type_string == "CONFIG") continue;

                    let txpayload = tx.payload.data.actions[0].payload;

                    let proposalresponse = txpayload.action.proposal_response_payload.extension;
                    let rwset = proposalresponse.results.ns_rwset[0];
                    let sender = null;
                    let receiver = null;
                    let nonce = null;
                    let balance_sender = 0;
                    let balance_receiver = 0;

                    let status = proposalresponse.response.status;
                    let creatorMspId = tx.payload.data.actions[0].header.creator.Mspid;
                    let endorserMspId = txpayload.action.endorsements[0].endorser.Mspid;
                    let readSet = JSON.stringify(rwset.rwset.reads);
                    let writeSet = JSON.stringify(rwset.rwset.writes);
                    let creatorNonce = 0;
                    let txResponse = JSON.stringify(txpayload);

                    try {

                        let writeCount = rwset.rwset.writes.length;
                        if (writeCount == 2) {


                            let sender = rwset.rwset.writes[0].key;
                            let balance_sender = rwset.rwset.writes[0].value;

                            if (sender.substr(0, 2) == "0x") {

                                let where_tx = {
                                    blockId: block_number,
                                    txHash: tx_id
                                }
                                let result_db_tx = await dbmanager.dbSelectOne(req, LinkaScannerAgentTransaction, where_tx);
                                if (result_db_tx.result_code == true) {
                                    return;
                                }

                                let value_tx = {
                                    blockId: block_number,
                                    txHash: tx_id,
                                    status: status,
                                    createMspId: creatorMspId,
                                    endorserMspId: endorserMspId,
                                    readSet: readSet,
                                    writeSet: writeSet,
                                    creatorNonce: 0,
                                    txResponse: txResponse,
                                    validationCode: txValidationCodes[i],
                                    createDate: utils.getCurrentDate("")
                                };
                                let result_db_linkascanneragenttx_insert = await dbmanager.dbInsert(req, LinkaScannerAgentTransaction, value_tx);
                                if (result_db_linkascanneragenttx_insert.result_code == false) {
                                    throw new Error(result_db_linkascanneragenttx_insert.result_data);
                                }
                                try {

                                    ////--> sender <--////
                                    if (sender) {
                                        let transaction = await sequelize.db.transaction();
                                        // TODO: move to Model
                                        var query = `replace into linkaScannerAgentBalance(currencyType, address, balance, createDate, updateDate) values('${constants.MAINNET_LINKA}', '${sender}', ${balance_sender}, '${utils.getCurrentDate("")}', '${utils.getCurrentDate("")}');`;

                                        await sequelize.db.query(query, { transaction });
                                        await transaction.commit();
                                    }

                                } catch (error) {
                                    if (transaction) {
                                        await transaction.rollback();
                                    }
                                }

                            }


                        } else if (writeCount == 3) {

                            let objnonce = rwset.rwset.writes[2].key;
                            if (objnonce.substr(0, 5) == "NONCE") {

                                let objnonce_sender = objnonce.substr(5, (objnonce.length - 5));
                                let tmp_sender = rwset.rwset.writes[0].key;
                                let tmp_receiver = rwset.rwset.writes[1].key;

                                let tmp_balance_sender = rwset.rwset.writes[0].value;
                                let tmp_balance_receiver = rwset.rwset.writes[1].value;

                                if (rwset.rwset.reads[0].key == "LINKA_OWNER") {
                                    if (objnonce_sender == tmp_sender) {
                                        sender = tmp_sender;
                                        receiver = null;
                                        balance_sender = tmp_balance_sender;
                                        balance_receiver = null;
                                    } else if (objnonce_sender == tmp_receiver) {
                                        sender = tmp_receiver;
                                        receiver = null;
                                        balance_sender = tmp_balance_receiver;
                                        balance_receiver = null;
                                    } else {
                                        // return;
                                    }
                                }
                                else if (tmp_sender.substr(0, 2) == "0x" && tmp_receiver.substr(0, 2) == "0x") {

                                    if (objnonce_sender == tmp_sender) {
                                        sender = tmp_sender;
                                        receiver = tmp_receiver;
                                        balance_sender = tmp_balance_sender;
                                        balance_receiver = tmp_balance_receiver;
                                    } else if (objnonce_sender == tmp_receiver) {
                                        sender = tmp_receiver;
                                        receiver = tmp_sender;
                                        balance_sender = tmp_balance_receiver;
                                        balance_receiver = tmp_balance_sender;
                                    } else {
                                        // return;
                                    }
                                }

                                nonce = rwset.rwset.writes[2].value;
                                creatorNonce = nonce;


                                //--> start : insert transaction data into linkaScannerAgentTransaction <--//
                                let where_tx = {
                                    blockId: block_number,
                                    txHash: tx_id
                                }
                                let result_db_tx = await dbmanager.dbSelectOne(req, LinkaScannerAgentTransaction, where_tx);
                                if (result_db_tx.result_code == true) {
                                    return;
                                }

                                let value_tx = {
                                    blockId: block_number,
                                    txHash: tx_id,
                                    status: status,
                                    createMspId: creatorMspId,
                                    endorserMspId: endorserMspId,
                                    readSet: readSet,
                                    writeSet: writeSet,
                                    creatorNonce: creatorNonce,
                                    txResponse: txResponse,
                                    validationCode: txValidationCodes[i],
                                    createDate: utils.getCurrentDate("")
                                };
                                let result_db_linkascanneragenttx_insert = await dbmanager.dbInsert(req, LinkaScannerAgentTransaction, value_tx);
                                if (result_db_linkascanneragenttx_insert.result_code == false) {
                                    throw new Error(result_db_linkascanneragenttx_insert.result_data);
                                }
                                //--> end : insert transaction data into linkaScannerAgentTransaction <--//


                                //--> start : insert balance data into linkaScannerAgentBalance <--//
                                let transaction = await sequelize.db.transaction();
                                try {

                                    ////--> sender <--////
                                    if (sender) {
                                        // TODO: move to Model
                                        var query = `replace into linkaScannerAgentBalance(currencyType, address, balance, createDate, updateDate) values('${constants.MAINNET_LINKA}', '${sender}', ${balance_sender}, '${utils.getCurrentDate("")}', '${utils.getCurrentDate("")}');`;

                                        await sequelize.db.query(query, { transaction });
                                    }
                                    ////--> receiver <--////
                                    if (receiver) {
                                        // TODO: move to Model
                                        var query = `replace into linkaScannerAgentBalance(currencyType, address, balance, createDate, updateDate) values('${constants.MAINNET_LINKA}', '${receiver}', ${balance_receiver}, '${utils.getCurrentDate("")}', '${utils.getCurrentDate("")}');`;

                                        await sequelize.db.query(query, { transaction });
                                    }
                                    await transaction.commit();
                                    //--> end : insert balance data into linkaScannerAgentBalance <--//
                                } catch (error) {
                                    if (transaction) {
                                        await transaction.rollback();
                                    }
                                }

                            }

                        }


                    } catch (error) {
                        logger.debug("error:->" + error.message);
                    }
                }

            } catch (err) {
                logger.debug("err:->" + err);
            }

            logger.debug("lastBlockNumber:->" + k);
            fs.writeFileSync(blockSyncLastNumberFile, k, function (err) {
                if (err) {
                    return console.log(err);
                }
            });

        } else {
            break;
        }
    }

}