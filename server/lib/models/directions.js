var promise = require('promise'),
	routes = require('./routes'),
	simplified_stops = require('./simplified_stops'),
	directions = require('./model').create('route_directions'),
	dir_names = {
		NorthSouth: ['Southbound', 'Northbound'],
		EastWest: ['Westbound', 'Eastbound']
	};

function get_direction_name(route, first_stop, last_stop, direction_id) {
	var direction_name = direction_id.toString();

	if(route.is_rail) {
		direction_name = direction_id === 0 ? 'Outbound' : 'Inbound';
	} else if(first_stop && last_stop) {
		var delta_x = Math.abs(first_stop.stop_lon - last_stop.stop_lon),
			delta_y = Math.abs(first_stop.stop_lat - last_stop.stop_lat),
			cardinal = delta_x > delta_y ? 'EastWest' : 'NorthSouth';

		direction_id = 0;
		if((delta_x > delta_y && last_stop.stop_lon < first_stop.stop_lon) ||
			(delta_y > delta_x && last_stop.stop_lat > first_stop.stop_lat)) {
			direction_id = 1;
		}
		direction_name = dir_names[cardinal][direction_id];
	}

	return direction_name;
}

function get_stop_by_direction(agency_id, first, route, direction_id) {
	return new promise(function(resolve, reject) {
		var sort_dir = first ? '' : ' DESC';

		simplified_stops.query()
			.error(reject)
			.select('ss.stop_id, ss.stop_name, ss.stop_sequence, ss.stop_lat, ss.stop_lon')
			.where('ss.agency_id = ? AND ss.route_id = ? AND ss.direction_id = ?', [
				agency_id, route.route_id, direction_id
			])
			.orders('ss.stop_sequence' + sort_dir)
			.first(function(stop) {
				resolve(stop);
			}, true);
	});
}

function get_route_direction(agency_id, route, direction_id) {
	return new promise(function (resolve, reject) {
		promise.all([
			get_stop_by_direction(agency_id, true, route, direction_id),
			get_stop_by_direction(agency_id, false, route, direction_id)
		]).then(function(stops) {
			var direction_name = get_direction_name(route, stops[0], stops[1], direction_id),
				direction_long_name = stops[1] ? stops[1].stop_name : null;

			resolve({
				route_id: route.route_id,
				route_short_name: route.route_short_name,
				direction_id: direction_id,
				direction_name: direction_name,
				direction_long_name: direction_long_name
			});
		}, reject);
	});
}

function get_directions_from_route(agency_id, route) {
	return new promise(function(resolve, reject) {
		promise.all([
			get_route_direction(agency_id, route, 0),
			get_route_direction(agency_id, route, 1)
		]).then(function(first, second) {
			resolve(first, second);
		}, reject);
	});
}

directions.generate_directions = function(agency_id) {
	return new promise(function(resolve, reject) {
		routes
			.query(agency_id)
			.where('agency_id = ?', [agency_id])
			.error(reject)
			.done(function(rts) {
				var promises = [];
				rts.forEach(function(route) {
					promises.push(get_directions_from_route(agency_id, route));
				});
				promise.all(promises).then(function(results) {
					var new_directions = [];
					results.forEach(function(result) {
						new_directions.push(result[0]);
						new_directions.push(result[1]);
					});
					resolve(new_directions);
				}, reject);
			});
	});
};

module.exports = directions;