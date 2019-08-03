import { Prisma } from 'prisma-binding'
// import { fragmentReplacements } from './resolvers/index'

const prisma = new Prisma({
  typeDefs: 'server/src/generated/prisma.graphql',
  endpoint: process.env.PRISMA_IP || 'http://localhost:4466',
  secret: 'thisismysupersecrettext'
  // fragmentReplacements
})

export default prisma
