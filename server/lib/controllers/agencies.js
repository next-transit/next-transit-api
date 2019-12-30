var ctrl = require('./controller').create('agencies'),
	route_types = require('../models/route_types'),
	agencies = require('../models/agencies');

ctrl.action('index', function(req, res, callback) {
	agencies.query()
		.error(res.internal_error)
		.orders('agency_name')
		.limit(ctrl.limit)
		.count(true)
		.done(function(results, count) {
			callback({
				data: agencies.public(results),
				count: results.length,
				total_count: count
			});
		});
});

ctrl.action('item', function(req, res, callback) {
	agencies.where('slug = ?', [req.params.agency_slug])
		.error(res.internal_error)
		.first(function(agency) {
			if(agency) {
				callback({ data:agencies.public(agency) });
			} else {
				res.error('Could not find agency ' + req.params.agency_slug, 404);
			}
		});
});

module.exports = ctrl;