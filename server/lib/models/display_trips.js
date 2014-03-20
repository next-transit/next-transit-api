var promise = require('promise'),
	date = require('../util/date'),
	stop_times = require('./stop_times'),
	machine_format = 'YYYY-MM-DD HH24:MI',
	time_format = 'H:MI P';

function DisplayTrip(stop_time) {
	stop_time = stop_time || {};
	this.trip_id = stop_time.trip_id || '';
	this.block_id = stop_time.block_id || '';
	this.departure_stop_time = stop_time || null;
	this.departure_time_formatted = '';
	this.arrival_stop_time = null;
	this.arrival_time_formatted = '';
	this.from_now = '';
	this.gone = false;
	this.coverage = {
		left: ((stop_time.first_stop_sequence - 1) / stop_time.stop_count) * 100,
		right: (1 - (stop_time.last_stop_sequence / stop_time.stop_count)) * 100
	};

	if(this.coverage.left < 0) {
		this.coverage.left = 0;
	}
	if(this.coverage.right < 0) {
		this.coverage.right = 0;
	}

	this.coverage.full = !this.coverage.left && !this.coverage.right;
}

function add_to_stop_time(agency_id, now, trip, to_id) {
	return new promise(function(resolve, reject) {
		if(to_id) {
			stop_times.query().where('agency_id = ? AND trip_id = ? AND stop_id = ?', [agency_id, trip.trip_id, to_id]).first(function(to_stop_time) {
				if(to_stop_time) {
					trip.arrival_stop_time = to_stop_time;
					trip.arrival_time_formatted = now.dateFromTime(to_stop_time.departure_time).toFormat(time_format);
				}
				resolve(trip);
			});
		} else {
			resolve(trip);	
		}
	});
}

function convert(agency_id, now, stop_time, to_id) {
	var trip = new DisplayTrip(stop_time, now),
		departure_datetime = now.dateFromTime(stop_time.departure_time),
		diff = departure_datetime - now._dt;

	trip.departure_datetime = departure_datetime.toFormat(machine_format);
	trip.departure_time_formatted = departure_datetime.toFormat(time_format);
	trip.from_now = now.time_period(diff);
	trip.gone = trip.from_now === 'GONE';

	return add_to_stop_time(agency_id, now, trip, to_id);
}

function convert_list(agency_id, stop_times, to_id, callback) {
	var now = date(), 
		promises = [];

	stop_times.forEach(function(stop_time) {
		promises.push(convert(agency_id, now, stop_time, to_id));
	});

	promise.all(promises).done(function(trips) {
		callback(trips);
	});
}

var trips = {};

trips.get_by_day = function(agency_id, is_rail, route_id, direction_id, from_id, day_of_week) {
	return new promise(function(resolve, reject) {
		stop_times.get_by_day(agency_id, is_rail, route_id, direction_id, from_id, day_of_week).then(function(times, count) {
			convert_list(agency_id, times, null, function(trips) {
				resolve(trips, count);
			});
		}, reject);
	});
};

trips.get_by_time = function(agency, is_rail, route_id, direction_id, from_id, offset, to_id, success, error) {
	stop_times.get_by_time(agency, is_rail, route_id, direction_id, from_id, offset, function(times) {
		convert_list(agency.id, times, to_id, function(trips) {
			success(trips);
		});
	}, error);
};

module.exports = trips;