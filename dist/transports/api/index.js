
/*
Copyright 2014 Joukou Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var ApiTransport, BaseTransport, MessageSchema, RuntimeContext, authenticate,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseTransport = require('../base');

MessageSchema = require('../../message/schema');

RuntimeContext = require('../../runtime');

authenticate = require('../../authentication').authenticate;

ApiTransport = (function(_super) {
  __extends(ApiTransport, _super);

  function ApiTransport(server, routePrefix) {
    this.server = server;
    this.routePrefix = routePrefix != null ? routePrefix : '';
    this.registerRoutes();
  }

  ApiTransport.prototype.getRoutes = function() {
    var k, key, res, val, _i, _len, _ref;
    res = {};
    for (key in this.server.router.routes) {
      if (!this.server.router.routes.hasOwnProperty(key)) {
        continue;
      }
      k = [];
      _ref = this.server.router.routes[key];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        val = _ref[_i];
        k.push(val.spec.path);
      }
      res[key] = k;
    }
    return res;
  };

  ApiTransport.prototype.registerRoutes = function() {
    var key, protocols, _results;
    protocols = new RuntimeContext().getProtocols();
    _results = [];
    for (key in protocols) {
      if (!protocols.hasOwnProperty(key)) {
        continue;
      }
      _results.push(this.registerProtocolRoutes(key, protocols[key]));
    }
    return _results;
  };

  ApiTransport.prototype.registerProtocolRoutes = function(key, protocol) {
    var command, _i, _len, _ref, _results;
    _ref = protocol.getCommandKeys();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      command = _ref[_i];
      _results.push(this.registerCommandRoutes(key, protocol, command));
    }
    return _results;
  };

  ApiTransport.prototype.registerCommandRoutes = function(key, protocol, command) {
    var addHandler, anyHandlers, commandHandler, doAuth, map, method, methods, _i, _len;
    if (!protocol) {
      return;
    }
    commandHandler = protocol.getHandler(command);
    if (!commandHandler) {
      return;
    }
    if (typeof commandHandler.route !== 'string') {
      return;
    }
    methods = [];
    if (commandHandler.methods) {
      methods = commandHandler.methods;
    }
    map = {
      'POST': this.server.post,
      'GET': this.server.get,
      'PUT': this.server.put,
      'DELETE': this.server.del
    };
    doAuth = true;
    if (commandHandler.authentication === false) {
      doAuth = false;
    }
    anyHandlers = false;
    addHandler = (function(_this) {
      return function(method) {
        var args, handler;
        if (typeof method !== 'string') {
          retun;
        }
        handler = map[method.toUpperCase()];
        if (!handler) {
          return;
        }
        args = ["" + _this.routePrefix + "/" + key + "/" + commandHandler.route];
        if (doAuth) {
          args.push(authenticate);
        }
        args.push(_this.route(key, command));
        handler.apply(_this.server, args);
        return anyHandlers = true;
      };
    })(this);
    for (_i = 0, _len = methods.length; _i < _len; _i++) {
      method = methods[_i];
      addHandler(method);
    }
    if (!anyHandlers) {
      addHandler('POST');
      return addHandler('GET');
    }
  };

  ApiTransport.prototype.route = function(key, command) {
    return function(req, res, next) {
      var context, err, payload, promise, protocol;
      context = new RuntimeContext();
      context.user = req.user;
      context.authorized = true;
      protocol = context.getProtocol(key);
      payload = _.cloneDeep(req.body);
      _.assign(payload, req.params || {});
      promise = null;
      try {
        promise = protocol.receive(command, payload, context);
      } catch (_error) {
        err = _error;
        return next(err);
      }
      return promise.then(function(payload) {
        return res.send(200, payload != null ? payload : req.body);
      }).fail(function(err) {
        return next(err || 'Failed to process request');
      });
    };
  };

  return ApiTransport;

})(BaseTransport);

module.exports = ApiTransport;

/*
//# sourceMappingURL=index.js.map
*/
