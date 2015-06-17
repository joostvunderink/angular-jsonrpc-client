# Introduction

angular-jsonrpc-client provides a configurable client to perform [JSON-RPC 2.0][JSONRPC2] calls with via HTTP.

The client is configured in the Angular configuration phase via the `jsonrpcConfig` provider, and the client itself is injected as `jsonrpc`.

[JSONRPC2]: http://www.jsonrpc.org/specification

# Getting started

```
angular
    .module('MyApp', ['angular-jsonrpc-client'])
    .config(function(jsonrpcConfigProvider) {
        jsonrpcConfigProvider.set({
            url: 'http://example.com:8080/rpc'
        });
    })
    .controller('MyController', ['$scope', 'jsonrpc', function($scope, jsonrpc) {
        jsonrpc.request('version', {})
            .then(function(result) {
                $scope.result = result;
            })
            .catch(function(error) {
                $scope.error = error;
            });
    }]);
```

# Return value

By default, the return value of `jsonrpc.request` is a `$q` promise, which resolves into the `result` value of the JSON-RPC response. If anything goes wrong with handling the request, the code ends up in `$q.catch()`.

If you want to handle the http response yourself, you can do that via:

```
jsonrpcConfigProvider.set({
    returnHttpPromise: true
});
```

This changes the return value of `jsonrpc.request()` from a `$q` promise into the return value of `$http.request()`.

# Handling errors

When dealing with JSON-RPC, there are 2 kinds of errors. The first is when your request did not arrive at the server, for example because it was down or because the wrong URL was used. The second type of error is when the server has received the request and returns an error structure as specified by [JSON-RPC 2.0][JSONRPC2].

To differentiate between these two types, we use the `error` object that is rejected by `jsonrpc.request()`. It is either of type `JsonRpcTransportError` (for the first type of errors) or `JsonRpcServerError`.

In both cases, `error.message` is set. In case of a `JsonRpcServerError`, `error.error` contains the error object as it is specified by [JSON-RPC 2.0][JSONRPC2].

# TODO

- Finish the documentation
- Add more examples
- Maybe add support for JSON-RPC v1?
- Add support for JSON-RPC over TCP

