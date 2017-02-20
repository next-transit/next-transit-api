var ctrl = require('./controller').create('trips'),
	trips = require('../models').trips;

ctrl.action('index', function(req, res, success) {
	var block_id = req.query.block_id;

	trips.select(req.agency.id)
		.where_if('block_id = ?', [block_id], block_id)
		.count(true)
		.limit(ctrl.limit)
		.error(res.internal_error)
		.all(function(results, count) {
			success({
				data: results,
				count: results.length,
				total_count: count
			});
		});
});

module.exports = ctrl;