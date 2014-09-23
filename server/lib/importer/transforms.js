var noop = function transforms_noop(record) { return record; },
	transforms = {};

transforms.stops = function(record) {
	record.parent_station = record.parent_station || 0;
	record.zone_id = parseInt(record.zone_id, 10) || 0;
};

transforms.trips = function(record) {
	record.block_id = record.block_id || 0;
};

transforms.stop_times = function(record) {
	var time_parts, hr;

	if(record.arrival_time) {
		time_parts = record.arrival_time.split(':');
		hr = parseInt(time_parts, 10);
		if(hr <= 3) {
			time_parts[0] = hr + 24;
			record.arrival_time = time_parts.join(':');
		} else if(hr < 10) {
			time_parts[0] = '0' + hr;
			record.arrival_time = time_parts.join(':');
		}
	}
	
	if(record.departure_time) {
		time_parts = record.departure_time.split(':');
		hr = parseInt(time_parts, 10);
		if(hr <= 3) {
			time_parts[0] = hr + 24;
			record.departure_time = time_parts.join(':');
		} else if(hr < 10) {
			time_parts[0] = '0' + hr;
			record.departure_time = time_parts.join(':');
		}
	}
};

transforms.calendar_dates = function(record) {
	var days_bool = record.exception_type === '1' ? 1 : 0;
	record.monday = record.tuesday = record.wednesday = record.thursday = record.friday = record.saturday = record.sunday = days_bool;
	record.exact_date = record.date;
};

module.exports = {
	get_transform: function(type, agency_slug) {
		var custom_transform;

		// Attempt to load agency-specific transform and run for type
		try {
			custom_transform = require('./agencies/' + agency_slug + '/transforms')[type] || noop;
		} catch(e) {
			custom_transform = noop;
		}

		return function (record) {
			// Run standard transform if it exists for type.
			(transforms[type] || noop)(record);
			custom_transform(record);
		};
	}
};
