import { resolvers } from './resolvers'
import { prisma, socketIO } from './lib/server'

import fs from 'fs'
import debug from 'debug'
import http from 'http'
import { Server as ColyseusServer } from 'colyseus'
import { GraphQLServer, PubSub } from 'graphql-yoga'
import { fileLoader, mergeTypes } from 'merge-graphql-schemas'

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS AND HELPERS                           */
/* -------------------------------------------------------------------------- */
const PORT = process.env.port | 4000
const MULTIPLAYER_PORT = 2567
const log = output => debug('server')(JSON.stringify(output, null, 2))

/* -------------------------------------------------------------------------- */
/*                               LOADING SCHEMA                               */
/* -------------------------------------------------------------------------- */
let baseSchema

const schemaFile = `${__dirname}/generated/prisma.graphql`

if (fs.existsSync(schemaFile)) {
  baseSchema = fs.readFileSync(schemaFile, 'utf-8')
}

const schema = fileLoader(`${__dirname}/schema/api/`, {
  recursive: true
})
const apiSchema = mergeTypes([baseSchema].concat(schema), { all: true })

/* -------------------------------------------------------------------------- */
/*                           CONTEXT INITIALIZATION                           */
/* -------------------------------------------------------------------------- */
const pubsub = new PubSub()

/* -------------------------------------------------------------------------- */
/*                               ACTUAL SERVERS                               */
/* -------------------------------------------------------------------------- */

const multiplayer = new ColyseusServer({
  server: http.createServer(),
  verifyClient(info, next) {
    // TODO: Implement handshake verification
    next(true)
  }
})

const server = new GraphQLServer({
  // typeDefs: 'server/src/schema.graphql',
  typeDefs: apiSchema,
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false
  },
  context(request) {
    return {
      pubsub,
      prisma,
      socketIO,
      request,
      multiplayer
    }
  }
})

multiplayer.listen(MULTIPLAYER_PORT)

server.start({ port: PORT }, ({ port }) => {
  // eslint-disable-next-line no-console
  log('server', `The server is up and running on port ${port}.`)
})
