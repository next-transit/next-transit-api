const { Pool, Client } = require('pg');
const config = require('../util/config');

const connectionString = config.database_url;

const pool = new Pool({ connectionString });

function query(query, params, success, error) {
	if(typeof params === 'function') {
		error = success;
		sucess = params;
		params = [];
	}

	pool.query(query, params, (err, res) => {
		if(err) {
			console.error('Error running query', query, '\n', err);
			return error && error(err);
		}

		success && success(res);
	});
};

module.exports = {
	query: query
};
