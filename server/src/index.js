import { resolvers } from './resolvers'
import { prisma, socketIO, redisClient } from './modules/server'
import Helpers from './utils/helpers'
import ChunkDistributor from './lib/game/chunkDistributor'
import ChunkLogger from './lib/game/chunkLogger'

import Pool from 'worker-threads-pool'
import { GraphQLServer, PubSub } from 'graphql-yoga'

const pubsub = new PubSub()
const chunkLogger = new ChunkLogger()
const chunkDistro = new ChunkDistributor(chunkLogger)
const workerPool = new Pool({ max: 10 })

const server = new GraphQLServer({
  typeDefs: 'server/src/schema.graphql',
  resolvers,
  context(request) {
    return {
      pubsub,
      prisma,
      socketIO,
      redisClient,
      request,
      chunkDistro,
      chunkLogger,
      workerPool
    }
  }
})

server.start({ port: process.env.PORT | 4000 }, ({ port }) => {
  // eslint-disable-next-line no-console
  Helpers.log('server', `The server is up and running on port ${port}.`)
})
