const apiai = require('apiai');

const $KEY = require('../key/token.js').getToken();

const app = apiai($KEY);

var sendMessage = (msg, session, callback) => {
  let request = app.textRequest(msg, {
    sessionId: session
  });
  
  request.on('response', res => {
    callback(res);
  });

  request.on('error', err => {
    console.log(err);
    callback();
  });
  
  request.end();
}

exports.sendMessage = sendMessage;