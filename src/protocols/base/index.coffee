###
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
###
_        = require( 'lodash' )
Q        = require( 'q' )
schemajs = require( 'schemajs' )

###*
@module joukou-fbpp/protocols/base
@author Fabian Cook <fabian.cook@joukou.com>
###

class BaseProtocol
  protocol: null
  filterCommands: null
  commands: null

  @include: ( cls, obj ) ->
    if not obj
      throw new Error( "Include requires object" )

    for key, value of obj::
      if not obj::.hasOwnProperty( key )
        contine
      if key is 'include'
        continue
      if cls.hasOwnProperty( key )
        continue
      cls::[ key ] = value

    cls

  constructor: (@protocol) ->
    @filterCommands = []
    @commands = {}

  getCommandKeys: ->
    return _.keys( @commands )

  getHandler: ( command ) ->
    if typeof command isnt 'string'
      return
    return @commands[ command.toLowerCase() ]

  addCommandSchemas: ( @commandSchemas ) ->
    @commandSchemasLower ?= {}
    for key, value of @commandSchemas
      if not @commandSchemas.hasOwnProperty( key )
        continue
      @commandSchemasLower[ key.toLowerCase() ] = value

  _resolvePromise: ( data ) ->
    deferred = Q.defer()
    if (
      not data or
      not data.then or
      not data.fail
    )
      return Q.resolve( data )
    data
    .then( deferred.resolve )
    .fail( deferred.reject )
    return deferred.promise

  send: ( command, payload, context ) ->
    if not context or context.socket
      return
    context.send({
      protocol: @protocol
      command: command.toLowerCase()
      payload: payload
    })

  sendAll: ( command, payload, context ) ->
    if not context or context.socket
      return
    context.sendAll({
      protocol: @protocol
      command: command.toLowerCase(),
      payload: payload
    })

  receive: (command, payload, context) ->
    deferred = Q.defer()
    handler = @commands[command]
    if not handler
      return Q.reject( )
    try
      promise = handler(payload, context)
      promise = @_resolvePromise( promise )
      promise
      .then( deferred.resolve )
      .fail( deferred.reject )
    catch e
      return Q.reject( e )
    return deferred.promise

  command: ( name, command, route, methods ) ->
    if not _.isArray( methods )
      methods = [ methods ]

    handler = ( payload, context ) =>
      ## Schema validation

      schema = @commandSchemasLower?[ name.toLowerCase() ]

      unless schema
        return command.call( @, payload, context )

      console.log( payload )

      form = schemajs.create(
        schema
      ).validate(
        payload
      )

      console.log( form.data )

      if not form.valid
        return Q.reject(
          form.errors
        )


      return command.call( @, form.data, context )


    handler.command = command
    handler.route = route
    handler.methods = methods

    @commands[ name.toLowerCase() ] = handler

    if @[ name ]
      @[ name ] = handler

  reject: ( error ) ->
    return Q.reject(
      error or new Error( "Unknown" )
    )



module.exports = BaseProtocol