# Introduction

angular-jsonrpc-client provides a configurable client to perform [JSON-RPC 2.0][JSONRPC2] calls via HTTP.

[JSONRPC2]: http://www.jsonrpc.org/specification

JSON-RPC is a protocol where you send a JSON object with a method name and method parameters to a server, and you get a response with the result of the operation. Let's say you send the following JSON:

```
    {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "buy_fruit",
        "params": {
            "type": "banana",
            "amount": 42
        }
    }
```

The server might reply with an object like this:

```
    {
        "jsonrpc": "2.0",
        "id": "1",
        "result": {
            "cost": 24.65
        }
    }
```

Or, if an error happens, the server would reply with an object like this:

```
    {
        "jsonrpc": "2.0",
        "id": "1",
        "error": {
            "code": 666,
            "message": "There were not enough bananas.",
            "data": {
                "available_bananas": 17
            }
        }
    }
```

In addition to such a JSON-RPC server error, it could also happen that something goes wrong with sending the request to the server. For example, the server could be down, or the client could be configured with the wrong location of the server. In that case, you would also experience an error situation, although different from JSON-RPC errors.

# Description

This client takes care of the communication and the error handling when communicating with a JSON-RPC server. By default it returns a `$q` promise, which either resolves to a result value via `.then()` or results in an error via `.catch()`.

Currently, it can only handle JSON-RPC servers that are reachable via HTTP.

The client is configured in the Angular configuration phase via the `jsonrpcConfig` provider, and the client itself is injected as `jsonrpc`.

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

# Configuration

There are 2 configuration options.

Argument | Mandatory? | Type | Default | Description
---------|------------|------|---------|------------
url | mandatory | string | null | The URL of the JSON-RPC HTTP server.
returnHttpPromise | optional | boolean | false | Whether to return a `$http` promise or a `$q` promise.

The argument `url` is necessary to configure where the JSON-RPC server can be found.

The argument `returnHttpPromise` can be used to return a `$http` promise instead of a `$q` promise, if you want to handle the $http errors yourself. See the [Http Promise](#http-promise) section for more information.

# Return value

By default, the return value of `jsonrpc.request` is a `$q` promise, which resolves into the `result` value of the JSON-RPC response. If anything goes wrong with handling the request, the code ends up in `$q.catch()`.

# Handling errors

When dealing with JSON-RPC, there are 2 kinds of errors. The first kind is when your request did not arrive at the server, for example because it was down or because the wrong URL was used. The second kind of error is when the server has received the request and returns an error structure as specified by [JSON-RPC 2.0][JSONRPC2].

It would be possible to handle errors like this:

```
    // Note: this is NOT how this module works! Don't use this code!
    jsonrpc.request(methodName, params)
        .then(function(response) {
            if (response.result) {
                // The JSON-RPC call was successful.
                $scope.result = response.result;
            }
            else {
                // The request was received but an error occurred during processing.
                $scope.jsonError = response.error;
            }
        })
        .catch(function(error) {
            // This is an HTTP transport error, for example the wrong URL.
            $scope.httpError = error;
        });
```

The disadvantage of this method, is that you need to check for `response.result` or `response.error` in the `.then()` block for every single request you do.

This module moves the JSON-RPC error to the `.catch()` block. That means that if any error has occurred, the code flow ends up in the `.catch()` path. So, in the `.then()` block, you can be sure that the JSON-RPC call has been performed successfully. This leads to the following code flow on the client side:

```
    jsonrpc.request(methodName, params)
        .then(function(result) {
            // The JSON-RPC call was successful.
            $scope.result = result;
        })
        .catch(function(error) {
            // This could be either a JSON-RPC error or an HTTP transport error.
            $scope.error = error;
        });
```

This leads to simpler and less client code for the vast majority of the situations, where you are interested in what happens if the JSON-RPC call succeeds.

To differentiate between the two types of errors, we use the type of the `error` object that is rejected by `jsonrpc.request()` and thus is the only argument for `.catch(function(error) { ... })`. This `error` argument is an object and is either of type `JsonRpcTransportError` (for the first type of errors) or `JsonRpcServerError`.

In both cases, `error.message` is set. In case of a `JsonRpcServerError`, `error.error` contains the error object as it is specified by [JSON-RPC 2.0][JSONRPC2].

# Http Promise

If, for some reason, you want to handle the `$http` response yourself, you can do that via:

```
jsonrpcConfigProvider.set({
    returnHttpPromise: true
});
```

This changes the return value of `jsonrpc.request()` from a `$q` promise into the return value of `$http.request()`. See `examples/example2.html` for a working example of this. Doing this makes your client code more complex and is not recommended.

# Examples

In the `examples` dir, there are a few examples. You can look at the code there, and you can also see the code in action. To do that, you need to make sure that a the local example JSON-RPC server is running:

```
npm install
cd example
node jsonrpc.server.js
```

Now you can open the example html files in your browser and the calls should work.

# TODO

- Finish the documentation
- Add more examples
- Maybe add support for JSON-RPC v1?
- Add support for JSON-RPC over TCP

