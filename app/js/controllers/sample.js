sour.module('next-transit-api').controller('sample-ctrl', ['$elem', function($elem) {
	var $api_key_input = $('#api_key', $elem),
		$fields_input = $('#fields', $elem),
		$submit = $('#submit-btn', $elem),
		$results = $('#results', $elem),
		input_ids = ['req-param-1', 'req-param-2', 'req-param-3', 'req-param-4', 'req-param-5', 'req-param-6', 'req-param-7', 'req-param-8'];

	function render_data(data) {
		if(!data.length) {
			data = [data];
		}

		var html = '',
			head = '<thead>',
			body = '<tbody>';

		head += '<tr>';

		var first = true;
		data.forEach(function(datum) {
			body += '<tr>';
			for(var p in datum) {
				if(first) {
					head += '<th>' + p + '</th>';
				}
				body += '<td>' + datum[p] + '</td>';
			}
			body += '</tr>';
			first = false;
		});

		head += '</tr>';
		head += '</thead>';

		body += '</tbody>';

		html = '<table class="table table-striped">' + head + body + '</table>';

		$results.html(html);
	}

	$submit.click(function() {
		var url_parts = [],
			url = '/',
			api_key = $api_key_input.val();

		input_ids.forEach(function(input_id) {
			var input_val = $('#' + input_id, $elem).val();
			if(input_val) {
				url_parts.push(input_val);
			}
		});

		url += url_parts.join('/') + '?api_key=' + api_key;

		$.ajax({
			url: url,
			success: function(resp) {
				render_data(resp.data);
			},
			error: function() {
				console.error('Error!', arguments);
			}
		});
	});
}]);
