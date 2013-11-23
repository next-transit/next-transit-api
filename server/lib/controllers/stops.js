var ctrl = require('./controller').create('stops', true),
	stops = require('../models/stops');

ctrl.action('index', function(req, res, success) {
	var route_id = (req.query.route_id || req.params.route_id || '').toLowerCase(),
		direction_id = (req.query.direction_id || req.params.direction_id || ''),
		min_sequence = (req.query.min_sequence || ''),
		bbox = '', left = 0, bottom = 0, right = 0, top = 0;

	if(req.query.bbox) {
		bbox = req.query.bbox.split(',');
		left = parseFloat(bbox[0]);
		bottom = parseFloat(bbox[1]);
		right = parseFloat(bbox[2]);
		top = parseFloat(bbox[3]);	
	}

	stops
		.where('agency_id = ?', [req.agency.id])
		.where_if('stop_lon > ? AND stop_lon < ? AND stop_lat > ? AND stop_lat < ?', [left, right, bottom, top], bbox)
		.orders('stop_name')
		.limit(ctrl.limit)
		.count(true)
		.error(req.internal_error)
		.done(function(results, count) {
			success({
				stops: stops.public(results),
				count: results.count,
				total_count: count
			});
		});
});

ctrl.action('item', function(req, res, success) {
	var id = (req.params.id || ''),
		stop_id = (req.params.stop_id || '');

	stops
		.error(req.internal_error)
		.where('agency_id = ?', [req.agency.id])
		.where_if('id = ?', [parseInt(id, 10) || 0], id)
		.where_if('stop_id = ?', [parseInt(stop_id, 10) || 0], stop_id)
		.first(function(results) {
			success({
				stop: stops.public(results)
			});
		});
});

module.exports = ctrl;