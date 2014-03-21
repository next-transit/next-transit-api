var assert = require('assert'),
	moment = require('moment-timezone'),
	date = require('../../lib/util/date.js');

describe('Date', function() {
	var m = moment();

	describe('#time_str_to_date()', function() {
		it('should create a date', function() {
			assert.ok(date.time_str_to_date(m, '2:14'), 'Date object wasn\'t created');
		});

		it('should handle hours with 0s', function() {
			assert.ok(date.time_str_to_date(m, '02:14'), 'Date object wasn\'t created');
		});

		it('should return undefined if parse fails', function() {
			assert.equal(date.time_str_to_date(m, ''), undefined, 'Did not return undefined');
		});

		it('should gracefully fail on garbage input', function() {
			assert.equal(date.time_str_to_date(m, 'foo:bar'), undefined, 'Did not return undefined');
		});
	});

	describe('#from_now()', function() {
		var five_ago = moment(m).subtract('minutes', 5),
			less_than_one = moment(m).add('seconds', 30),
			five_from_now = moment(m).add('minutes', 5),
			thirty_from_now = moment(m).add('minutes', 30),
			sixty_from_now = moment(m).add('hours', 1),
			ninty_from_now = moment(m).add('hours', 1.5);

		it('should evaluate gone for past values', function() {
			assert.equal(date.from_now(five_ago, m), 'GONE', 'Did not return "GONE"');
		});

		it('should evaluate <1 for values less than one minutes', function() {
			assert.equal(date.from_now(less_than_one, m), '< 1m', 'Did not return < 1min');
		});

		it('should evaluate future values', function() {
			assert.equal(date.from_now(five_from_now, m), '5m', 'Did not display correct future date.');
			assert.equal(date.from_now(thirty_from_now, m), '30m', 'Did not display correct future date.');
			assert.equal(date.from_now(sixty_from_now, m), '1h', 'Did not display correct future date.');
			assert.equal(date.from_now(ninty_from_now, m), '1h 30m', 'Did not display correct future date.');
		});
	});
});
