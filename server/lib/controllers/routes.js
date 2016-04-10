const models = require('../models');
const route_types = require('../models/route_types');
const ctrl = require('./controller').create('route_types', true);
const routes = models.routes;

function get_route_type(req) {
	return new Promise(function(resolve, reject) {
		var route_type_slug = (req.query.route_type || req.params.route_type || '').toLowerCase();

		if(route_type_slug) {
			route_types
				.where('agency_id = ? AND slug = ?', [req.agency.id, route_type_slug])
				.error(reject)
				.first(resolve);
		} else {
			resolve();
		}
	});
}

ctrl.action('index', function(req, res, callback) {
	get_route_type(req).then(function(route_type) {
		routes.select(req.agency.id)
			.where_if('route_type = ?', (route_type || {}).route_type_id, route_type)
			.limit(ctrl.limit)
			.count(true)
			.error(res.internal_error)
			.all(function(results, count) {
				routes.sort_by_short_name(results);
				callback({
					data: results,
					count: results.length,
					total_count: count
				});
			});
	}, res.internal_error);
});

ctrl.action('show', function(req, res, callback) {
	var route_id = (req.params.route_id || '');
	routes.select(req.agency.id)
		.where('(lower(route_id) = ? OR lower(route_short_name) = ?)', [route_id, route_id])
		.error(res.internal_error)
		.first(function(route) {
			if(route) {
				callback({ data:route });
			} else {
				console.log('Route could not be found.')
				res.error('Route could not be found.', 404);
			}
		});
});

module.exports = ctrl;
