var date = require('../util/date'),
	promise = require('promise'),
	stop_times = require('./model').create('stop_times');

var SERVICE_IDS_BUS = ['7', '1', '1', '1', '1', '1', '5'],
	SERVICE_IDS_RAIL = ['S3', 'S1', 'S1', 'S1', 'S1', 'S1', 'S2'],
	TIME_FORMAT = 'HH24:MI:SS',
	DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function get_stops(agency_id, route_id, direction_id, from_id, day, date_str, compare_time, compare_dir, sort_dir, limit, offset) {
	return new promise(function(resolve, reject) {
		sort_dir = sort_dir || 'asc';
		limit = limit || 0;
		offset = offset || 0;

		var q = stop_times.query()
			.select('DISTINCT stop_times.*, t.block_id, tv.stop_count, tv.first_stop_sequence, tv.last_stop_sequence')
			.join('JOIN trips t ON stop_times.trip_id = t.trip_id AND t.agency_id = ?')
			.join('LEFT OUTER JOIN trip_variants tv ON t.trip_variant_id = tv.id')
			.where('stop_times.agency_id = ? AND t.route_id = ? AND stop_id = ? AND t.direction_id = ?', [agency_id, agency_id, route_id, from_id, direction_id])
			.where_if('service_id IN (SELECT service_id FROM calendar_dates WHERE agency_id = ? AND (exact_date = ? OR (' + day + ' = true AND start_date <= ? AND end_date > ?)))', [agency_id, date_str, date_str, date_str], date_str)
			.where_if('service_id IN (SELECT service_id FROM calendar_dates WHERE agency_id = ? AND ' + day + ' = true', [], !date_str)
			.where_if('departure_time ' + compare_dir + ' ?', [compare_time], compare_time)
			.orders('departure_time ' + sort_dir)
			.error(reject);

		if(limit) {
			q.limit(limit).offset(Math.abs(offset));
		} else {
			q.count(true);
		}

		q.done(function(times, count) {
			if(sort_dir === 'desc') {
				times.reverse();
			}
			resolve(times, count);
		});
	});
};

stop_times.get_by_day = function(agency_id, is_rail, route_id, direction_id, from_id, day_of_week) {
	return new promise(function(resolve, reject) {
		if(typeof day_of_week === 'string') {
			var string_dow = DAYS.indexOf(day_of_week);
			if(string_dow > -1) {
				day_of_week = string_dow;
			}
		}
		if(typeof day_of_week !== 'number' || day_of_week < 0 || day_of_week > 6) {
			day_of_week = (new Date()).getDay();
		}

		get_stops(agency_id, route_id, direction_id, from_id, DAYS[day_of_week], date_str).then(resolve, reject);
	});
};

stop_times.get_by_time = function(agency_id, is_rail, route_id, direction_id, from_id, offset, success, error) {
	var now = date().add({ minutes:-5 }),
		day = DAYS[now.getDay()],
		date_str = now.toDateFormat(),
		sort_dir = 'asc',
		compare_dir = '>',
		compare_time = now.toFormat(TIME_FORMAT),
		limit = 5;

	var hour = now.getHours();
	if(hour < 5) {
		compare_time = now.toFormat((hour + 24) + ':MI:SS');
	}

	// handles "backwards" paging
	// if a negative offset is detected, we reverse the time comparison, reverse the sort order, and then reverse the results
	if(offset) {
		if(offset < 0) {
			offset += 5; // this is because an offset of -5 actually means reverse order and start from 0
			sort_dir = 'desc';
			compare_dir = '<';
		}

		offset = Math.abs(offset);
	}

	get_stops(agency_id, route_id, direction_id, from_id, day, date_str, compare_time, compare_dir, sort_dir, limit, offset).then(success, error);
};

module.exports = stop_times;
