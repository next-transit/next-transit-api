const http = require('http');

function request(url) {
  return new Promise((resolve, reject) => {
    http.get(url, function(res) {
      res.setEncoding('utf8');

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      }).on('end', function() {
        let data_obj = null;
        try {
          data_obj = JSON.parse(data);
        } catch(e) {
          return reject('Could not parse realtime response from ' + url);
        }
        
        resolve(data_obj);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = request;
