var api_keys = require('../models/api_keys'),
	agencies = require('../models/agencies');

function get_agency(req, success, error) {
	if(req.api_key) {
		agencies.where('id = ?', [req.api_key.agency_id])
			.first(function(agency) {
				if(agency) {
					req.agency = agency;
					success();
				} else {
					error('Could not find agency ' + req.params.agency, 404);
				}
			});
	} else {
		success();
	}
}

function get_api_key(req, success, error) {
	if(req.query.api_key) {
		api_keys.where('key = ?', [req.query.api_key])
			.error(function() {
				error('Error getting api key.');
			})
			.first(function(api_key) {
				if(api_key) {
					req.api_key = api_key;
					get_agency(req, success, error);
				} else {
					error('Could not find api key.');
				}
			});
	} else {
		success();
	}
}

function before(req, res, next) {
	if(config.verbose) {
		console.log('GET', req.path)	
	}

	req.api_key = null;

	res.error = function(message, status_code) {
		res.send(status_code || 500, {
			success: false,
			message: message || '',
			status_code: status_code || 500
		});
	};

	res.internal_error = function(err) {
		console.log('Internal error', err);
		res.error('Internal error');
	}

	get_api_key(req, next, res.error);
}

module.exports = {
	before: before
};