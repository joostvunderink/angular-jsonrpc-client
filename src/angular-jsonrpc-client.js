(function() {
  'use strict';

  var jsonrpcModule = angular.module('angular-jsonrpc-client', []);

  jsonrpcModule.service('jsonrpc', jsonrpc);
  jsonrpcModule.provider('jsonrpcConfig', jsonrpcConfig);

  jsonrpc.$inject = ['$q', '$http', 'jsonrpcConfig'];

  var id = 0;
  var ERROR_TYPE_SERVER = 'JsonRpcServerError';
  var ERROR_TYPE_TRANSPORT = 'JsonRpcTransportError';

  function JsonRpcTransportError(error) {
      this.name = ERROR_TYPE_TRANSPORT;
      this.message = error;
  }
  JsonRpcTransportError.prototype = Error.prototype;  

  function JsonRpcServerError(error) {
      this.name    = ERROR_TYPE_SERVER;
      this.message = error.message;
      this.error   = error;
  }
  JsonRpcServerError.prototype = Error.prototype;  

  function jsonrpc($q, $http, jsonrpcConfig) {
    return {
      request              : request,
      ERROR_TYPE_SERVER    : ERROR_TYPE_SERVER,
      ERROR_TYPE_TRANSPORT : ERROR_TYPE_TRANSPORT,
      JsonRpcTransportError: JsonRpcTransportError,
      JsonRpcServerError   : JsonRpcServerError
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

    function request(methodName, args) {
      if (!jsonrpcConfig.url) {
        throw new Error('Please configure the jsonrpc client first.');
      }

      var inputData = _getInputData(methodName, args);

      var req = {
       method: 'POST',
       url: jsonrpcConfig.url,
       headers: {
         'Content-Type': 'application/json'
       },
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
        var deferred = $q.defer();
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
            err = 'Connection refused at ' + jsonrpcConfig.url;
          }
          else if (status === 404) {
            // Situation 3
            err = '404 not found at ' + jsonrpcConfig.url;
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
              err = '500 internal server error at ' + jsonrpcConfig.url + ': ' + data;
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
      url: null,
      returnHttpPromise: false
    };

    this.set = function(args) {
      if (typeof(args) !== 'object') {
        throw new Error('Argument of "set" must be an object.');
      }

      var allowedKeys = ['url', 'returnHttpPromise'];
      var keys = Object.keys(args);
      keys.forEach(function(key) {
        if (allowedKeys.indexOf(key) < 0) {
          throw new Error('Invalid configuration key "' + key + "'. Allowed keys are: " +
            allowedKeys.join(', '));
        }
        config[key] = args[key];
      });
    };

    this.$get = function() {
      return config;
    };
  }
}).call(this);
