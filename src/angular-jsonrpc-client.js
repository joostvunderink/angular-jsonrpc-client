(function() {
  'use strict';

  var jsonrpcModule = angular.module('angular-jsonrpc-client', []);

  jsonrpcModule.service('jsonrpc', jsonrpc);
  jsonrpcModule.provider('jsonrpcConfig', jsonrpcConfig);

  jsonrpc.$inject = ['$q', '$http', 'jsonrpcConfig'];

  var id = 0;
  var ERROR_TYPE_SERVER = 'JsonRpcServerError';
  var ERROR_TYPE_TRANSPORT = 'JsonRpcTransportError';
  var ERROR_TYPE_CONFIG = 'JsonRpcConfigError';

  function JsonRpcTransportError(error) {
      this.name = ERROR_TYPE_TRANSPORT;
      this.message = error;
  }
  JsonRpcTransportError.prototype = Error.prototype;  

  function JsonRpcServerError(error) {
      this.name    = ERROR_TYPE_SERVER;
      this.message = error.message;
      this.error   = error;
      this.data    = error.data;
  }
  JsonRpcServerError.prototype = Error.prototype;  

  function JsonRpcConfigError(error) {
      this.name = ERROR_TYPE_CONFIG;
      this.message = error;
  }
  JsonRpcConfigError.prototype = Error.prototype;  

  function jsonrpc($q, $http, jsonrpcConfig) {
    return {
      request              : request,
      ERROR_TYPE_SERVER    : ERROR_TYPE_SERVER,
      ERROR_TYPE_TRANSPORT : ERROR_TYPE_TRANSPORT,
      ERROR_TYPE_CONFIG    : ERROR_TYPE_CONFIG,
      JsonRpcTransportError: JsonRpcTransportError,
      JsonRpcServerError   : JsonRpcServerError,
      JsonRpcConfigError   : JsonRpcConfigError
    };

    function _getInputData(methodName, args) {
      id += 1;
      return {
        jsonrpc: '2.0',
        id     : id,
        method : methodName,
        params : args
      }
    }

    function _findServer(serverName) {
      for (var i = 0; i < jsonrpcConfig.servers.length; i++) {
        if (jsonrpcConfig.servers[i].name === serverName) {
          return jsonrpcConfig.servers[i];
        }
      }
      return null;
    }

    function request(arg1, arg2, arg3) {
      var serverName = 'main';
      var methodName, args;
      if (arguments.length === 2) {
        methodName = arg1;
        args = arg2;
      }
      else {
        serverName = arg1;
        methodName = arg2;
        args = arg3;
      }

      var deferred = $q.defer();

      if (jsonrpcConfig.servers.length === 0) {
        deferred.reject(new JsonRpcConfigError('Please configure the jsonrpc client first.'));
        return deferred.promise;
      }

      var backend = _findServer(serverName);

      if (!backend) {
        deferred.reject(new JsonRpcConfigError('Server "' + serverName + '" has not been configured.'));
        return deferred.promise;
      }

      var inputData = _getInputData(methodName, args);
      var headers = angular.extend(
        backend.headers,
        {
           'Content-Type': 'application/json',
        }
      );

      var req = {
       method: 'POST',
       url: backend.url,
       headers: headers,
       data: inputData
      };

      var promise = $http(req);

      if (jsonrpcConfig.returnHttpPromise) {
        return promise;
      }
      else {
        // Here, we determine which situation we are in:
        // 1. Call was a success.
        // 2. Call was received by the server. Server returned an error.
        // 3. Call did not arrive at the server.
        // 
        // 2 is a JsonRpcServerError, 3 is a JsonRpcTransportError.
        // 
        // We are assuming that the server can use either 200 or 500 as
        // http return code in situation 2. That depends on the server
        // implementation and is not determined by the JSON-RPC spec.
        promise.success(function(data, status, headers, config) {
          if (data.result) {
            // Situation 1
            deferred.resolve(data.result);
          }
          else {
            // Situation 2
            deferred.reject(new JsonRpcServerError(data.error));
          }
        })
        .error(function(data, status, headers, config) {
          var errorType = ERROR_TYPE_TRANSPORT;
          var err;
          if (status === 0) {
            // Situation 3
            err = 'Connection refused at ' + backend.url;
          }
          else if (status === 404) {
            // Situation 3
            err = '404 not found at ' + backend.url;
          }
          else if (status === 500) {
            // This could be either 2 or 3. We have to look at the returned data
            // to determine which one.
            if (data.jsonrpc && data.jsonrpc === '2.0') {
              // Situation 2
              errorType = ERROR_TYPE_SERVER;
              err = data.error;
            }
            else {
              // Situation 3
              err = '500 internal server error at ' + backend.url + ': ' + data;
            }
          }
          else {
            // Situation 3
            err = 'Unknown error. HTTP status: ' + status + ', data: ' + data;
          }

          if (errorType === ERROR_TYPE_TRANSPORT) {
            deferred.reject(new JsonRpcTransportError(err));
          }
          else {
            deferred.reject(new JsonRpcServerError(err));
          }
        });
      }

      return deferred.promise;
    }    
  }

  function jsonrpcConfig() {
    var config = {
      servers: [],
      returnHttpPromise: false
    };

    this.set = function(args) {
      if (typeof(args) !== 'object') {
        throw new Error('Argument of "set" must be an object.');
      }

      var allowedKeys = ['url', 'servers', 'returnHttpPromise'];
      var keys = Object.keys(args);
      keys.forEach(function(key) {
        if (allowedKeys.indexOf(key) < 0) {
          throw new JsonRpcConfigError('Invalid configuration key "' + key + '". Allowed keys are: ' +
            allowedKeys.join(', '));
        }
        
        if (key === 'url') {
          config.servers = [{
            name: 'main',
            url: args[key],
            headers: {}
          }];
        }
        else if (key === 'servers') {
          config.servers = getServers(args[key]);
        }
        else {
          config[key] = args[key];
        }
      });
    };

    function getServers(data) {
      if (!(data instanceof Array)) {
        throw new JsonRpcConfigError('Argument "servers" must be an array.');
      }
      var servers = [];

      data.forEach(function(d) {
        if (!d.name) {
          throw new JsonRpcConfigError('Item in "servers" argument must contain "name" field.');
        }
        if (!d.url) {
          throw new JsonRpcConfigError('Item in "servers" argument must contain "url" field.');
        }
        var server = {
          name: d.name,
          url: d.url,
        };
        if (d.hasOwnProperty('headers')) {
          server.headers = d.headers;
        }
        else {
          server.headers = {};
        }
        servers.push(server);
      });

      return servers;
    }

    this.$get = function() {
      return config;
    };
  }
}).call(this);
