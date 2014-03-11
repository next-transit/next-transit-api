var promise = require('promise');

// A helper for Array iterations on promises
function promise_each(items, iterator) {
	var all = [];

	items.forEach(function(item) {
		all.push(new promise(function(resolve, reject) { iterator(item, resolve, reject); }));
	});

	return promise.all(all);
}

module.exports = {
	promise_each: promise_each
};
