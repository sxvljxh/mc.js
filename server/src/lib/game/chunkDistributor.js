import Config from '../../../../config/config'

const DISTRO_INTERVAL = Config.server.chunk.distro.interval

function ChunkDistributor(logger) {
  this.funcs = []

  setInterval(() => {
    if (this.funcs.length) {
      const func = this.funcs.shift()
      func()
      logger.addDistro()
    }
  }, DISTRO_INTERVAL)
}

ChunkDistributor.prototype.append = function(func) {
  this.funcs.push(func)
}

module.exports = ChunkDistributor
