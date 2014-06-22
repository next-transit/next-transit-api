var fs = require('fs'),
	promise = require('promise'),
	csv = require('csv'),
	trim = require('trim'),
	extend = require('extend'),
	date_utils = require('date-utils'),
	timer = require('./timer'),
	transforms = require('./transforms'),
	sequential = require('./sequential'),
	config = require('../util/config'),
	batch_size = 100000;

function copy_to_database(importer, options) {
	return new promise(function(resolve, reject) {
		options = extend({ write_path:'', model:null, columns:[] }, options);

		var import_fn = options.truncate ? 'import' : 'import_only';

		options.model[import_fn](importer.options.agency.id, options.columns, options.write_path, function() {
			resolve();
		}, reject);
	});
}

function import_path(importer, agency_slug, type, read_path, write_stream, model, columns) {
	return new promise(function(resolve, reject) {
		var transform = transforms.get_transform(type, agency_slug),
			date_str = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');

		csv()
			.from(read_path, { columns:true, trim:true, rowDelimiter:'\n' })
			.to(write_stream, { delimiter:'\t', columns:columns })
			.transform(function(record, idx) {
				if(idx && (idx % batch_size === 0)) {
					console.log('Processed ' + idx + ' so far ...');
				}
				record.created_at = record.updated_at = date_str;
				record.agency_id = importer.options.agency.id;
				transform(record);
				return record;
			})
			.on('end', function() {
				resolve();
			})
			.on('error', function(err) {
				console.error('Error reading source file', err);
				reject();
			});
	});
}

function add_path_sequence(importer, first, path, agency_slug, file_name, write_path, model, columns) {
	return function(next, error) {
		var flags = first ? 'w' : 'a',
			read_path = path + '/' + file_name + '.txt',
			write_stream = fs.createWriteStream(write_path, { flags:flags });

		if(!first) {
			write_stream.write('\n');
		}

		import_path(importer, agency_slug, file_name, read_path, write_stream, model, columns).then(function() {
			write_stream.end();
		}, error);

		write_stream.on('finish', function() {
			next();
		});
	};
}

function Importer(opts) {
	var self = this;
	
	self.options = opts,
	self.paths = (self.options.agency.import_paths || '/').split(',');

	return self;
}

Importer.prototype.import_type = function(options) {
	var self = this;

	return new promise(function(resolve, reject) {
		import_options = extend({
			agency_slug: '',
			title: '',
			file_name: '',
			columns: '',
			model_name: '',
			truncate: true
		}, options);

		var model = require('../models/' + (import_options.model_name || import_options.file_name)),
			total_timer = timer('\nImporting ' + import_options.title, true),
			read_timer = timer(),
			write_timer = timer(),
			extended_columns = import_options.columns.concat(['created_at', 'updated_at', 'agency_id']);

		total_timer.start();

		var sequencer = sequential(),
			read_path = '',
			write_path = self.options.gtfs_path + '/stage/' + import_options.file_name + '.txt',
			first = true;

		read_timer.start();

		self.paths.forEach(function(path) {
			path = self.options.gtfs_path + trim(path);
			sequencer.add(add_path_sequence(self, first, path, import_options.agency_slug, import_options.file_name, write_path, model, extended_columns));
			first = false;
		});

		sequencer.then(function() {
			read_timer.stop();

			write_timer.start('Writing bulk file to database ...');
			copy_to_database(self, { write_path:write_path, model:model, columns:extended_columns, truncate:import_options.truncate }).then(function() {
				read_timer.total('Time spent reading source files');
				write_timer.interval('Time spent writing to database', true);
				total_timer.interval(import_options.title + ' Import Complete! Total time', true, true, '-');
				resolve();
			}, function(err) {
				console.log('Error copying data to database', err);
				reject();
			});
		});
	});
};

module.exports = function(options) {
	return new Importer(options);
};
