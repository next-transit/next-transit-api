// A helper for Array iterations on promises
function promise_each(items, iterator) {
	var all = [];

	items.forEach(function(item) {
		all.push(new Promise((resolve, reject) => { iterator(item, resolve, reject); }));
	});

	return Promise.all(all);
}

module.exports = {
	promise_each: promise_each
};
