function ChunkDistributor(logger) {
  this.funcs = []

  setInterval(() => {
    if (this.funcs.length) {
      const func = this.funcs.shift()
      func()
      logger.addDistro()
    }
  }, 50)
}

ChunkDistributor.prototype.append = function(func) {
  this.funcs.push(func)
}

module.exports = ChunkDistributor
