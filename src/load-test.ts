const http = require('http');

const url: string = 'http://localhost:5000/test/loadtest';
setInterval(() => {
  http.get(url, function(res: any) {
    console.log('done');
  });
}, 500);
