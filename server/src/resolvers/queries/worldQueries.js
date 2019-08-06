import Helpers from '../../utils/helpers'

import LZString from 'lz-string'

const WorldQueries = {
  myWorlds(parent, args, { prisma, request }, info) {
    const userId = Helpers.getUserId(request)
    return prisma.query.user({ where: { id: userId } }, info)
  },
  async world(parent, args, { prisma }, info) {
    const id = args.query

    await prisma.mutation.updateWorld({
      data: {
        lastPlayed: new Date().toISOString()
      },
      where: {
        id
      }
    })
    return prisma.query.world({ where: { id } }, info)
  },
  async getChunk(
    parent,
    {
      data: { worldId, x, y, z }
    },
    { redisClient }
  ) {
    const redisRepData = Helpers.getRedisRep(x, y, z, 'data')
    const redisRepMesh = Helpers.getRedisRep(x, y, z, 'mesh')
    const chunkData = await redisClient.hgetAsync(worldId, redisRepData)
    const chunkMesh = await redisClient.hgetAsync(worldId, redisRepMesh)
    const parsedData = JSON.parse(chunkData)
    const parsedMesh = JSON.parse(chunkMesh)

    if (!parsedData || !parsedMesh) return ''

    return LZString.compress(
      JSON.stringify({
        data: parsedData,
        meshData: parsedMesh
      })
    )
  }
}

export default WorldQueries
