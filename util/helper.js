
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('Helper');
logger.setLevel('DEBUG');

var path = require('path');
var util = require('util');
var fs = require('fs');

const sha = require('js-sha256');
const asn = require('asn1.js');

var hfc = require('fabric-client');
hfc.setLogger(logger);
hfc.addConfigFile(path.join(__dirname, '../config/config.json'));

async function getClientForOrg(userorg) {
	logger.debug('getClientForOrg - ****** START %s ', userorg)

	let config = userorg + '-networkconnection';

	let configsetting = hfc.getConfigSetting(config);

	if (util.isNullOrUndefined(configsetting)) {
		configsetting = path.join(__dirname, '../gateway', config + '.yaml');
		logger.debug('set Config %s of %s', configsetting, userorg)
		hfc.setConfigSetting(config, configsetting);
	}

	let client = hfc.loadFromConfig(hfc.getConfigSetting(config));

	await client.initCredentialStores();

	return client;
}
async function getClientForPeerOrg(userorg) {

	let config = userorg + '-networkconnection';

	let configsetting = hfc.getConfigSetting(config);

	if (util.isNullOrUndefined(configsetting)) {
		configsetting = path.join(__dirname, '../gateway', config + '.yaml');
		hfc.setConfigSetting(config, configsetting);
	}

	let client = hfc.loadFromConfig(hfc.getConfigSetting(config));
	// /*
	// * 클라이언트 멤버 설정

	let clientConfig = client.getClientConfig();
	let clientKey = fs.readFileSync(clientConfig.privateKey.path);
	let clientCert = fs.readFileSync(clientConfig.signedCert.path);

	await client.initCredentialStores();
	let member = await client.createUser({
		username: 'memberClient',
		mspid: client.getMspid(),
		cryptoContent: { privateKeyPEM: Buffer.from(clientKey), signedCertPEM: Buffer.from(clientCert) }
	});
	await client.setUserContext(member, true);
	// *
	// */

	return client;
}

var getLogger = function (moduleName) {
	var logger = log4js.getLogger(moduleName);
	logger.setLevel('DEBUG');
	return logger;
};

var generateBlockHash = function (header) {
	const headerAsn = asn.define('headerAsn', function () {
		this.seq().obj(
			this.key('Number').int(),
			this.key('PreviousHash').octstr(),
			this.key('DataHash').octstr()
		);
	});
	const output = headerAsn.encode(
		{
			Number: parseInt(header.number),
			PreviousHash: Buffer.from(header.previous_hash, 'hex'),
			DataHash: Buffer.from(header.data_hash, 'hex')
		},
		'der'
	);
	return sha.sha256(output);
}

exports.getClientForOrg = getClientForOrg;
exports.getClientForPeerOrg = getClientForPeerOrg;
exports.getLogger = getLogger;
exports.generateBlockHash = generateBlockHash;