var noop = function(record) { return record; },
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
		}
	}
	
	if(record.departure_time) {
		time_parts = record.departure_time.split(':');
		hr = parseInt(time_parts, 10);
		if(hr <= 3) {
			time_parts[0] = hr + 24;
			record.departure_time = time_parts.join(':');
		}
	}
};

module.exports = {
	get_transform: function(type) {
		return transforms[type] || noop
	}
};