import Helpers from '../../utils/helpers'
import Config from '../../../../config/config'

const INTERVAL = Config.server.chunk.logger.interval

function ChunkLogger() {
  this.chunkCount = 0
  this.chunkDistro = 0

  setInterval(() => {
    if (this.chunkCount !== 0) {
      Helpers.log('redis', `Saved ${this.chunkCount} chunks into redis cache.`)
      this.chunkCount = 0
    }
    if (this.chunkDistro !== 0) {
      Helpers.log('redis', `Distributed ${this.chunkDistro} chunks.`)
      this.chunkDistro = 0
    }
  }, INTERVAL)
}

ChunkLogger.prototype.addChunk = function() {
  this.chunkCount++
}

ChunkLogger.prototype.addDistro = function() {
  this.chunkDistro++
}

export default ChunkLogger
