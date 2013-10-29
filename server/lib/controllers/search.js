var ctrl = require('./controller').create('search', true),
	routes = require('../models/routes');

ctrl.action('index', function(req, res, callback) {
	var term = (req.params.term || '').toLowerCase();

	if(term) {
		var param = term + '%';
		routes.query(req.agency.id)
			.where('agency_id = ? AND (lower(route_short_name) like ? OR lower(route_long_name) like ?)', [req.agency.id, param, param])
			.count(true)
			.limit(ctrl.limit)
			.done(function(results, count) {
				routes.sort_by_short_name(results);

				callback({
					data: routes.public(results),
					count: results.length,
					total_count: count
				});
			});
	} else {
		callback({ data:[], count:0, total_count:0 });
	}
});

module.exports = ctrl;