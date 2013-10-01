var ctrl = require('./controller').create('index');

ctrl.action('index', function(req, res, callback) {
	callback({});
});

module.exports = ctrl;