const ctrl = require('./controller').create('agencies');
const models = require('../models.js');
const agencies = models.agencies;

ctrl.action('index', function(req, res, callback) {
	agencies.select()
		.orders('agency_name')
		.limit(ctrl.limit)
		.count(true)
		.error(res.internal_error)
		.all(function(results, count) {
			callback({
				data: results,
				count: results.length,
				total_count: count
			});
		});
});

ctrl.action('item', function(req, res, callback) {
	agencies.select()
		.where('slug = ?', [req.params.agency_slug])
		.error(res.internal_error)
		.first(function(agency) {
			if(agency) {
				callback({ data:agency });
			} else {
				res.error('Could not find agency ' + req.params.agency_slug, 404);
			}
		});
});

module.exports = ctrl;
