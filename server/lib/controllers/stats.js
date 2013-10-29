var ctrl = require('./controller').create('stats', true),
	stats = require('../models/stats');

ctrl.action('index', function(req, res, callback) {
	stats.where('agency_id = ?', [req.agency.id])
		.orders('created_at DESC')
		.error(res.internal_error)
		.limit(ctrl.limit)
		.count(true)
		.done(function(stats, count) {
			callback({
				data: stats,
				count: stats.count,
				total_count: count
			})
		});
});

module.exports = ctrl;