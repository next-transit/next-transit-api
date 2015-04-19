var config = require('./util/config'),
    models = require('next-transit-data')(config.database_url);

module.exports = exports = models;
