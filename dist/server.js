
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

/**
@module joukou-fbpp/server
@author Fabian Cook <fabian.cook@joukou.com>
 */
var ApiTransport, SocketTransport, cors, restify, routes, server, transports;

restify = require('restify');

cors = require('./cors');

ApiTransport = require('./transports/api');

SocketTransport = require('./transports/socket');

server = restify.createServer();

server.pre(cors.preflight);

server.use(cors.actual);

server.use(restify.acceptParser(server.acceptable));

server.use(restify.dateParser());

server.use(restify.queryParser());

server.use(restify.jsonp());

server.use(restify.gzipResponse());

server.use(restify.bodyParser({
  mapParams: false
}));

transports = require('./index').initialize(server);

routes = transports.ApiTransport.getRoutes();


/*
for key of routes
  if not routes.hasOwnProperty( key )
    continue
  for val in routes[ key ]
    console.log( key, val )
 */

server.listen(process.env.JOUKOU_API_PORT || 2101, process.env.JOUKOU_API_HOST || 'localhost', function() {
  return console.log("socket.io server listening at " + server.url);
});

/*
//# sourceMappingURL=server.js.map
*/
