var promise = require('promise'),
	ctrl = require('./controller').create('route_types', true),
	route_types = require('../models/route_types'),
	routes = require('../models/routes');

function get_route_type(req) {
	return new promise(function(resolve, reject) {
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
		if(route_type) {
			routes.query(req.agency.id)
				.error(res.internal_error)
				.where('agency_id = ?', [req.agency.id])
				.where_if('route_type = ?', [(route_type || {}).route_type_id], route_type)
				.limit(ctrl.limit)
				.count(true)
				.done(function(results, count) {
					routes.sort_by_short_name(results);
					callback({
						data: routes.public(results),
						count: results.length,
						total_count: count
					});
				});
		} else {
			res.error('Could not find route type.', 404);
		}
	}, res.internal_error);
});

ctrl.action('show', function(req, res, callback) {
	var route_id = (req.params.route_id || '');
	routes.query(req.agency.id)
		.where('agency_id = ? AND (lower(route_id) = ? OR lower(route_short_name) = ?)', [req.agency.id, route_id, route_id])
		.error(res.internal_error)
		.first(function(route) {
			if(route) {
				callback({ data:routes.public(route) });	
			} else {
				console.log('Route could not be found.')
				res.error('Route could not be found.', 404);
			}
		});
});

module.exports = ctrl;
