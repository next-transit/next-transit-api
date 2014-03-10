var promise = require('promise'),
	directions = require('./directions'),
	stops = require('./stops'),
	trips = require('./trips'),
	stop_times = require('./stop_times'),
	simplified_stops = require('./model').create('simplified_stops');

function merge_stops_arrays(stops_arrays) {
	var merged = [];
	stops_arrays.forEach(function(direction_stops) {
		merged = merged.concat(direction_stops);
	});
	return merged;
}

function stop_results_to_simplified_stops(direction, stop_results) {
	var stops = [];
	stop_results.forEach(function(stop) {
		if(stop.stop_name) {
			stops.push({
				route_id: direction.route_id,
				route_direction_id: direction.id,
				direction_id: direction.direction_id,
				stop_id: stop.stop_id,
				stop_sequence: stop.stop_sequence,
				stop_name: stop.stop_name,
				stop_lat: stop.stop_lat,
				stop_lon: stop.stop_lon
			});
		}
	});
	return stops;
}

function get_bus_stops_for_direction(agency_id, direction) {
	return new promise(function(resolve, reject) {
		trips.get_longest_trip(agency_id, direction.route_id, direction.direction_id, function(longest_trip) {
			if(longest_trip) {
				stop_times.query()
					.select('s.*, stop_times.stop_sequence')
					.join('JOIN stops s ON stop_times.stop_id = s.stop_id')
					.where('s.agency_id = ? AND stop_times.trip_id = ?', [agency_id, longest_trip.trip_id])
					.orders('stop_times.stop_sequence')
					.done(function(stop_results) {
						resolve(stop_results_to_simplified_stops(direction, stop_results));
					}, reject);
			} else {
				resolve([]);
			}
		}, reject);
	});
}

function get_rail_stops_for_direction(agency_id, direction) {
	return new promise(function(resolve, reject) {
		trips.get_longest_trip(agency_id, direction.route_id, direction.direction_id, function(longest_trip) {
			if(longest_trip) {
				stop_times.query()
					.select('s.*, stop_times.stop_sequence')
					.join('JOIN stops s ON stop_times.stop_id = s.stop_id')
					.where('s.agency_id = ? AND stop_times.trip_id = ?', [agency_id, longest_trip.trip_id])
					.orders('stop_times.stop_sequence')
					.done(function(stop_results) {
						resolve(stop_results_to_simplified_stops(direction, stop_results));
					}, reject);
			} else {
				resolve([]);
			}
		}, reject);
	});
}

function generate_bus_stops(agency_id) {
	return new promise(function(resolve, reject) {
		directions.query()
			.join('JOIN routes ON routes.route_id = route_directions.route_id AND routes.agency_id = route_directions.agency_id')
			.where('route_directions.agency_id = ?', [agency_id])
			.error(reject)
			.done(function(direction_results) {
				var promises = [];
				direction_results.forEach(function(direction) {
					promises.push(get_bus_stops_for_direction(agency_id, direction));
				});
				promise.all(promises).then(function(stops_arrays) {
					resolve(merge_stops_arrays(stops_arrays));
				}, reject);
			});
	});
}

function generate_rail_stops(agency_id) {
	return new promise(function(resolve, reject) {
		directions.query()
			.join('JOIN routes ON routes.route_id = route_directions.route_id')
			.where('routes.agency_id = ? AND routes.route_type = ?', [agency_id, 2])
			.error(reject)
			.done(function(direction_results) {
				var promises = [];
				direction_results.forEach(function(direction) {
					promises.push(get_rail_stops_for_direction(agency_id, direction));
				});
				promise.all(promises).then(function(stops_arrays) {
					resolve(merge_stops_arrays(stops_arrays));
				}, reject);
			});
	});
}

simplified_stops.generate_stops = function(agency_id) {
	return new promise(function(resolve, reject) {
		promise.all([
			generate_bus_stops(agency_id)//,
			//generate_rail_stops(agency_id)
		]).then(function(stops_arrays) {
			resolve(merge_stops_arrays(stops_arrays));
		}, reject);
	});
};

module.exports = simplified_stops;
