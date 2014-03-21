var trim = require('trim'),
	moment = require('moment-timezone'),
	date = {};

date.DEFAULT_TIMEZONE = 'America/New_York';
date.DATE_FORMAT = 'YYYY-MM-DD';
date.TIME_FORMAT = 'HH:mm:ss';
date.DAY_OF_WEEK_FORMAT = 'dddd';

date.format = {};
date.format.date = function(m) {
	return m.format(date.DATE_FORMAT);
};
date.format.time = function(m) {
	return m.format(date.TIME_FORMAT);
};
date.format.time_next_day = function(m, limit_hour) {
	var hour = m.hour();
	if(hour < limit_hour) {
		return (hour + 24) + ':' + m.format('mm:ss');
	}
	return date.format.time(m);
};
date.format.day_of_week = function(m) {
	return m.format(date.DAY_OF_WEEK_FORMAT);
};

// Takes "time" in string form and turns it into a Date using the current (supplied) date
// Expects time in HH:MM format. Seconds will be ignored.
// Returns a new Date or undefined if time value cannot be parsed.
date.time_str_to_date = function(m, time) {
	var parts = time.split(':');
	if(parts.length > 1) {
		var hours = parseInt(parts[0], 10),
			minutes = parseInt(parts[1], 10);

		var new_m = moment(m).hour(hours).minute(minutes);

		if(new_m.isValid()) {
			return new_m;
		}
	}
}

// Compares two dates and prints a "from now" text representation
// Negative (past) comparisons will return "GONE"
// Future comparisons less than 1 minute will return "< 1m"
// Future comparisons greater than 1 minute will return the smallest units possible in "1w 1d 1h 1m" notation.
date.from_now = function(departure_datetime, now) {
	var interval_array = [{ label:'w', time:604800 }, { label:'d', time:86400 }, { label:'h', time:3600 }, { label:'m', time:60 }],
		diff = (departure_datetime - now) / 1000,
		time_str = '';

	if(diff < 0) {
		time_str = 'GONE'
	} else if(diff < 60) {
		time_str = '< 1m'
	} else {
		interval_array.forEach(function(interval) {
			if(diff >= interval.time) {
				var time_val = Math.floor(diff / interval.time);
				
				diff -= time_val * interval.time;

				if(time_str) {
					time_str += ' ';
				}

				time_str += time_val + interval.label;
			}
		});
	}

	return time_str;
}

// Create a new "moment" object in the given timezone.
// Falls back to US Eastern Time if nothing is provided.
date.get_timezone_moment = function(timezone_str) {
	return moment().tz(timezone_str || date.DEFAULT_TIMEZONE);
};

module.exports = date;
