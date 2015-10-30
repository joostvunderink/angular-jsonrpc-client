var jsonrpc          = require('multitransport-jsonrpc');
var Server           = jsonrpc.server;
var ServerMiddleware = jsonrpc.transports.server.middleware;
var express          = require('express');
var bodyParser       = require('body-parser');

function startFirstServer() {
  var app = express();
  app.use(CORSHeaders);
  app.use(bodyParser());

  var jsonRpcMiddlewareServer = new Server(new ServerMiddleware(), {
    version: function(obj, callback) {
      console.info('RPC method "version" called.');
      callback(undefined, { version: '0.42.666' });
    }
  });

  app.use('/rpc', jsonRpcMiddlewareServer.transport.middleware);
  app.listen(5080);
  console.info('Starting first server on http://localhost:5080...');
}

function startSecondServer() {
  var app = express();
  app.use(CORSHeaders);
  app.use(bodyParser());

  var jsonRpcMiddlewareServer = new Server(new ServerMiddleware(), {
    version: function(obj, callback) {
      console.info('RPC method "version" called.');
      callback(undefined, { version: '6.1.23' });
    }
  });

  app.use('/rpc', jsonRpcMiddlewareServer.transport.middleware);
  app.listen(6123);
  console.info('Starting second server on http://localhost:6123...');
}


function CORSHeaders(req, res, next) {
  if (req.headers.origin) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
  }
  if(req.headers['access-control-request-method']) {
    res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
  }
  if(req.headers['access-control-request-headers']) {
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  // intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    res.status(200).send();
  }
  else {
    next();
  }
}

function main() {
  startFirstServer();
  startSecondServer();
  console.info('Please open the example html files in your browser now.');
}

main();
