var ctrl = require('./controller').create('search', true),
	routes = require('../models').routes;

ctrl.action('index', function(req, res, callback) {
	var term = (req.params.term || '').toLowerCase();

	if(term) {
		var param = term + '%';
		routes.select(req.agency.id)
			.where('(lower(route_short_name) like ? OR lower(route_long_name) like ?)', [param, param])
			.count(true)
			.limit(ctrl.limit)
			.all(function(results, count) {
				routes.sort_by_short_name(results);

				callback({
					data: results,
					count: results.length,
					total_count: count
				});
			});
	} else {
		callback({ data:[], count:0, total_count:0 });
	}
});

module.exports = ctrl;