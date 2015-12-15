'use strict';
describe('jsonrpc module', function() {
  var cfg;
  beforeEach(module('angular-jsonrpc-client', function(jsonrpcConfigProvider) {
    cfg = jsonrpcConfigProvider;
  }));


  describe('jsonrpcConfig read', function() {
    it('should have the default configuration', function(done) {
      inject(function(jsonrpcConfig) {
        jsonrpcConfig.should.have.keys(['servers', 'returnHttpPromise']);
        jsonrpcConfig.servers.should.have.length(0);
        jsonrpcConfig.returnHttpPromise.should.be.false;
        done();
      });
    });

    var testData = [
      {
        name: 'setting URL',
        args: {
          url: 'http://example.com'
        },
        expectedConfig: {
          servers: [{
            name: 'main',
            url: 'http://example.com',
            headers: {}
          }],
          returnHttpPromise: false
        }
      },
      {
        name: 'setting URL and returnHttpPromise',
        args: {
          url: 'http://example.com',
          returnHttpPromise: true
        },
        expectedConfig: {
          servers: [{
            name: 'main',
            url: 'http://example.com',
            headers: {}
          }],
          returnHttpPromise: true
        }
      },
      {
        name: 'setting servers',
        args: {
          servers: [{
            name: 'first',
            url: 'http://example.com/1',
            headers: {
              'first': 'yes'
            }
          }]
        },
        expectedConfig: {
          servers: [{
            name: 'first',
            url: 'http://example.com/1',
            headers: {
              'first': 'yes'
            }
          }],
          returnHttpPromise: false
        }
      },
    ];

    testData.forEach(function(tc) {
      it('should have correct config: ' + tc.name, function(done) {
        inject(function(jsonrpcConfig) {
          cfg.set(tc.args);
          cfg.$get().should.eql(tc.expectedConfig);
          done();
        });
      });
    });

    var testDataErrors = [
      {
        name: 'invalid key',
        args: {
          invalid: 'value'
        },
        expectedError: /Invalid configuration key "invalid"./,
      },
      {
        name: 'server with missing name',
        args: {
          servers: [{
            'url': 'http://example.com/api'
          }]
        },
        expectedError: /must contain "name" field/,
      },
      {
        name: 'server with missing url',
        args: {
          servers: [{
            'name': 'test'
          }]
        },
        expectedError: /must contain "url" field/,
      },
    ];

    testDataErrors.forEach(function(tc) {
      it('should error for: ' + tc.name, function(done) {
        inject(function(jsonrpcConfig) {
          try {
            cfg.set(tc.args);
          }
          catch(e) {
            e.name.should.equal('JsonRpcConfigError');
            e.message.should.match(tc.expectedError);
          }
          done();
        });
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
          headers: {},
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
              // In this case, we get a resolved 'result' object. Therefore, it contains
              // only the version key with its value.
              data.should.eql({ version: '1.7.9' });
              done();
            })
            .catch(function(err) {
              // should not come here
              console.error(err);
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
          headers: {},
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
              response.data.should.eql({
                jsonrpc: '2.0',
                id: 2,
                result: { version: '1.7.9' }
              });
              done();
            })
            .catch(function(err) {
              // should not come here
              console.error(err);
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
          headers: {},
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
              status.should.equal(200);
              data.id.should.equal(id);
              data.result.should.eql({ version: '1.7.9' });
              done();
            })
            .error(function(err) {
              // should not come here
              console.error(err);
              done(err);
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request with extra headers via config', function() {
      var configuredHeaders = {
        test: 'one two three'
      }
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
          headers: configuredHeaders,
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should perform a jsonrpc call with extra headers', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.expect(
            httpData.expected.method,
            httpData.expected.url,
            httpData.expected.body, function(headers) {
              return headers.test === configuredHeaders.test
            })
            .respond(httpData.returnValue);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              data.should.eql({ version: '1.7.9' });
              done();
            })
            .catch(function(err) {
              // should not come here
              console.error(err);
              done(err);
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request with extra headers via setExtraHeaders', function() {
      var extraHeaders = {
        test: 'four five six'
      }
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
          headers: [],
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should perform a jsonrpc call with extra headers', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.expect(
            httpData.expected.method,
            httpData.expected.url,
            httpData.expected.body, function(headers) {
              return headers.test === extraHeaders.test
            })
            .respond(httpData.returnValue);

          jsonrpc.setExtraHeaders('main', extraHeaders);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              data.should.eql({ version: '1.7.9' });
              done();
            })
            .catch(function(err) {
              // should not come here
              console.error(err);
              done(err);
            });

          $httpBackend.flush();
        });
      });
    });

    describe('jsonrpc.request with extra headers should ignore Content-Type header', function() {
      var configuredHeaders = {
        'Content-Type': 'text/xml'
      }
      var mockConfig = {
        servers: [{
          name: 'main',
          url: url,
          headers: configuredHeaders,
        }],
        returnHttpPromise: false
      };

      beforeEach(function () {
          module(function ($provide) {
              $provide.value('jsonrpcConfig', mockConfig);
          });
      });

      it('should not overwrite the "Content-Type" header', function(done) {
        inject(function(jsonrpc, $injector, $http) {
          var id = getNextId();
          var httpData = _getHttpData(id);
          var $httpBackend = $injector.get('$httpBackend');
          var jsonrpcRequestHandler = $httpBackend.expect(
            httpData.expected.method,
            httpData.expected.url,
            httpData.expected.body, function(headers) {
              return headers['Content-Type'] === 'application/json'
            })
            .respond(httpData.returnValue);

          jsonrpc.request(methodName, args)
            .then(function(data) {
              data.should.eql({ version: '1.7.9' });
              done();
            })
            .catch(function(err) {
              // should not come here
              console.error(err);
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
          headers: {},
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
              console.error(err);
              done(err);
            })
            .catch(function(err) {
              err.should.eql({
                name: jsonrpc.ERROR_TYPE_SERVER,
                message: errorData.error.message,
                error: errorData.error,
                data: errorData.error.data
              });
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
          headers: {},
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
              console.error(err);
              done(err);
            })
            .catch(function(err) {
              err.should.eql({
                name: jsonrpc.ERROR_TYPE_TRANSPORT,
                message: 'Connection refused at ' + url
              });
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
          headers: {},
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
              console.error(err);
              done(err);
            })
            .catch(function(err) {
              err.should.eql({
                name: jsonrpc.ERROR_TYPE_TRANSPORT,
                message: '404 not found at ' + url
              });
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
          headers: {},
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
              console.error(err);
              done(err);
            })
            .catch(function(err) {
              err.should.eql({
                name: jsonrpc.ERROR_TYPE_TRANSPORT,
                message: '500 internal server error at ' + url + ': ' + errorMessage
              });
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
          headers: {},
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
              console.error(err);
              done(err);
            })
            .catch(function(err) {
              err.should.eql({
                name: jsonrpc.ERROR_TYPE_TRANSPORT,
                message: 'Unknown error. HTTP status: 501, data: ' + errorMessage
              });
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
          url: 'http://does.not.matter',
          headers: {},
        },
        {
          name: secondServerName,
          url: url,
          headers: {},
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
              data.should.eql({ version: '1.7.9' });
              done();
            })
            .catch(function(err) {
              // should not come here
              console.error(err);
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
          url: 'http://does.not.matter',
          headers: {},
        },
        {
          name: 'second',
          url: 'http://also.matters.not',
          headers: {},
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
              err.should.eql({
                name: jsonrpc.ERROR_TYPE_CONFIG,
                message: 'Server "invalid" has not been configured.'
              });
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