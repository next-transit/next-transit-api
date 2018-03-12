var fs = require('fs');
	config = {},
	local = {};

if(fs.existsSync(__dirname + '/../../../config/local.json')) {
	local = require('../../../config/local.json');
}

config.verbose = process.env.VERBOSE || local.verbose;
config.debug_assets = process.env.DEBUG_ASSETS || local.debug_assets;
config.database_url = process.env.DATABASE_URL || local.database_url;

module.exports = config;