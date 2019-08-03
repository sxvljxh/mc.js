import { resolvers } from './resolvers'
import { prisma, socketIO } from './lib/server'

import debug from 'debug'
import session from 'express-session'
import { GraphQLServer, PubSub } from 'graphql-yoga'

const log = output => debug('server')(JSON.stringify(output, null, 2))

const pubsub = new PubSub()

const server = new GraphQLServer({
  typeDefs: 'server/src/schema.graphql',
  resolvers,
  context(request) {
    return {
      pubsub,
      prisma,
      socketIO,
      request
    }
  }
})

const opts = {
  port: 4000,
  cors: {
    credentials: true,
    origin: ['http://localhost:80', 'http://localhost:3000']
  }
}

const SESSION_SECRET = 'alskjdhflkajshflkashjfdl'

server.express.use(
  session({
    name: 'qid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
)

server.start(opts, ({ port }) => {
  // eslint-disable-next-line no-console
  log(`The server is up and running on port ${port}.`)
})
