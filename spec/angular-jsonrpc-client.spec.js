'use strict';
describe('jsonrpc module', function() {
  beforeEach(module('angular-jsonrpc-client'));

  describe('jsonrpcConfig read', function() {
    it('should have the default configuration', function(done) {
      inject(function(jsonrpcConfig) {
        expect(Object.keys(jsonrpcConfig).length).to.equal(2);
        expect(jsonrpcConfig.servers.length).to.equal(0);
        expect(jsonrpcConfig.returnHttpPromise).to.be.false;
        done();
      });
    });
  });

  describe('jsonrpc.request normal scenarios', function() {
    var methodName = 'version';
    var args = { };
    var url = 'http://example.com:80/rpc';

    function _getHttpData(id) {
      return {
        expected: {
          method: 'POST',
          url: url,
          body: {
            jsonrpc: "2.0",
            method: methodName,
            params: {},
            id: id
          }
        },
        returnValue: {
          jsonrpc: "2.0",
          id: id,
          result: { version: '1.7.9' }
        }
      };
    }

    describe('jsonrpc.request with jsonrpc promise return value', function() {
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should perform a jsonrpc call successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(httpData.returnValue);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              // In this case, we get a resolved 'result' object. Therefore, we can call
              // .version on it directly.
              expect(typeof(data)).to.equal('object');
              expect(Object.keys(data).length).to.equal(1);
              expect(data.version).to.equal('1.7.9');
              done();
            })
            .catch(function(err) {
              // should not come here
              console.log(err);
              done(err);
            });

          $httpBackend.flush();
        });
      });
    });


    describe('jsonrpc.request with http promise return value using then/catch', function() {
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
        }],
        returnHttpPromise: true
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should perform a jsonrpc call successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(httpData.returnValue);

          jsonrpc.request(methodName, args)
            .then(function(response) {
              // In this case, we get the $http response. In this, there is a 'data'
              // object which contains the version.
              expect(response.data.result.version).to.equal('1.7.9');
              done();
            })
            .catch(function(err) {
              // should not come here
              console.log(err);
              done(err);
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request with http promise return value using success/error', function() {
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
        }],
        returnHttpPromise: true
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should perform a jsonrpc call successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(httpData.returnValue);

          jsonrpc.request(methodName, args)
            .success(function(data, status, headers, config) {
              expect(status).to.equal(200);
              expect(data.id).to.equal(id);
              expect(data.result.version).to.equal('1.7.9');
              done();
            })
            .error(function(err) {
              // should not come here
              console.log(err);
              done(err);
            });

          $httpBackend.flush();
        });
      });
    });
  });

  describe('jsonrpc.request error scenarios', function() {
    var methodName = 'version';
    var args = { };
    var url = 'http://example.com:80/rpc';

    function _getHttpData(id) {
      return {
        expected: {
          method: 'POST',
          url: url,
          body: {
            jsonrpc: "2.0",
            method: methodName,
            params: {},
            id: id
          }
        }
      };
    }

    describe('jsonrpc.request with jsonrpc promise return value for server error', function() {
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should handle a server error successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var errorData = {
            jsonrpc: '2.0',
            id: id,
            error: {
              code: 1,
              message: 'Item not found',
              data: { item: 'black hole', reason: 'Hawking radiation' }
            }
          };
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(500, errorData);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              // should not come here
              var err = 'Call succeeded instead of causing an error!';
              console.log(err);
              done(err);
            })
            .catch(function(err) {
              expect(err.name).to.equal(jsonrpc.ERROR_TYPE_SERVER);
              expect(err.message).to.equal(errorData.error.message);
              expect(Object.keys(err.error).length).to.equal(Object.keys(errorData).length);
              expect(err.error.code).to.equal(errorData.error.code);
              expect(err.error.message).to.equal(errorData.error.message);
              expect(err.error.data.item).to.equal(errorData.error.data.item);
              expect(err.error.data.reason).to.equal(errorData.error.data.reason);
              done();
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request with jsonrpc promise return value for connection refused', function() {
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should handle a server error successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(0, null);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              // should not come here
              var err = 'Call succeeded instead of causing an error!';
              console.log(err);
              done(err);
            })
            .catch(function(err) {
              expect(err.name).to.equal(jsonrpc.ERROR_TYPE_TRANSPORT);
              expect(err.message).to.equal('Connection refused at ' + url);
              done();
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request with jsonrpc promise return value for 404', function() {
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should handle a server error successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(404, null);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              // should not come here
              var err = 'Call succeeded instead of causing an error!';
              console.log(err);
              done(err);
            })
            .catch(function(err) {
              expect(err.name).to.equal(jsonrpc.ERROR_TYPE_TRANSPORT);
              expect(err.message).to.equal('404 not found at ' + url);
              done();
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request with jsonrpc promise return value for 500 other error', function() {
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should handle a server error successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var errorMessage = 'Server is misconfigured';
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(500, errorMessage);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              // should not come here
              var err = 'Call succeeded instead of causing an error!';
              console.log(err);
              done(err);
            })
            .catch(function(err) {
              expect(err.name).to.equal(jsonrpc.ERROR_TYPE_TRANSPORT);
              expect(err.message).to.equal('500 internal server error at ' + url + ': ' + errorMessage);
              done();
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request with jsonrpc promise return value for an unknown error', function() {
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should handle a server error successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var errorMessage = 'Database corrupt';
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(501, errorMessage);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              // should not come here
              var err = 'Call succeeded instead of causing an error!';
              console.log(err);
              done(err);
            })
            .catch(function(err) {
              expect(err.name).to.equal(jsonrpc.ERROR_TYPE_TRANSPORT);
              expect(err.message).to.equal('Unknown error. HTTP status: 501, data: ' + errorMessage);
              done();
            });

          $httpBackend.flush();
        });
      });
    });
  });

  describe('jsonrpc.request for multiple servers', function() {
    var methodName = 'version';
    var args = {};
    function _getHttpData(id) {
      return {
        expected: {
          method: 'POST',
          url: url,
          body: {
            jsonrpc: "2.0",
            method: methodName,
            params: {},
            id: id
          }
        },
        returnValue: {
          jsonrpc: "2.0",
          id: id,
          result: { version: '1.7.9' }
        }
      };
    }

    var url = 'http://example.com:80/rpc';
    describe('jsonrpc.request with jsonrpc promise return value', function() {
      var firstServerName = 'first';
      var secondServerName = 'second';
      var mockConfig = {
        servers: [{
          name: firstServerName,
          url: 'http://does.not.matter'
        },
        {
          name: secondServerName,
          url: url
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should perform a jsonrpc call successfully', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(httpData.returnValue);

          jsonrpc.request(secondServerName, methodName, args)
            .then(function(data) {
              // In this case, we get a resolved 'result' object. Therefore, we can call
              // .version on it directly.
              expect(typeof(data)).to.equal('object');
              expect(Object.keys(data).length).to.equal(1);
              expect(data.version).to.equal('1.7.9');
              done();
            })
            .catch(function(err) {
              // should not come here
              console.log(err);
              done(err);
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request to invalid server', function() {
      var invalidServerName = 'invalid';
      var mockConfig = {
        servers: [{
          name: 'first',
          url: 'http://does.not.matter'
        },
        {
          name: 'second',
          url: 'http://also.matters.not'
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should error on request', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.when(httpData.expected.method, httpData.expected.url, httpData.expected.body)
                                                  .respond(httpData.returnValue);

          jsonrpc.request(invalidServerName, methodName, args)
            .then(function(data) {
              done('should not get here');
            })
            .catch(function(err) {
              expect(err.name).to.equal(jsonrpc.ERROR_TYPE_CONFIG);
              expect(err.message).to.equal('Server "invalid" has not been configured.');
              done();
            });

          $httpBackend.flush();
        });
      });

    });


  });
});

var id = 0;
function getNextId() {
  id++;
  return id;
}