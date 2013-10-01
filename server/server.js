if(process.env.NODETIME_ACCOUNT_KEY) {
	require('nodetime').profile({ accountKey:process.env.NODETIME_ACCOUNT_KEY, appName:'next-transit-data' });
}

require('date-utils');

var express = require('express'),
	db = require('./lib/db'),
	router = require('./lib/router'),
	routes = require('./lib/models/routes'),
	port = process.env.PORT || 5001;

var app = express();
app.use(express.compress());

router.routes(app);

app.listen(port);
console.log('Server started on port', port);