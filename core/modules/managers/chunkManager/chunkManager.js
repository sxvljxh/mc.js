import Helpers from '../../../utils/helpers'

import Mesher from './mesher'
import Chunk from './chunk'
import ChunkGenWorker from './chunkGen.worker'

import Config from 'mcjs-config/config'
import * as THREE from 'three'
import workerize from 'workerize'

const HORZ_D = Config.player.render.horzD
const VERT_D = Config.player.render.vertD

const parser = workerize(`
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js')

  function parseMaterial(mat) {
    const split = mat.split(':')
    split[0] = parseInt(split[0])
    return split
  }

  export function parse(data) {
    const decompressed = LZString.decompress(data)
    const parsed = JSON.parse(decompressed)

    parsed.meshData[1] = parsed.meshData[1].split(';')
    parsed.meshData[1].pop()
    parsed.meshData[1] = parsed.meshData[1].map(parseMaterial)

    return parsed
  }
`)

class ChunkManager {
  constructor(scene, seed, resourceManager, workerManager, changedBlocks) {
    this.scene = scene
    this.seed = seed

    this.resourceManager = resourceManager
    this.workerManager = workerManager

    this.dirtyChunks = []
    this.chunks = {}

    this.isReady = false

    this.prepare(changedBlocks)
  }

  prepare = changedBlocks => {
    /**
     * changedBlock sample:
     * [
     *  {
     *    type: 1,
     *    x: 0,
     *    y: 12,
     *    z: 14
     *  },
     *  {
     *    type: 2,
     *    x: 1,
     *    y: 12,
     *    z: 14
     *  }
     * ]
     */
    this.cbDict = {}

    changedBlocks.forEach(cb => this.markCB(cb))

    /** WORKER */
    this.workerManager.initChunkPool(ChunkGenWorker, this, {
      seed: this.seed,
      changedBlocks
    })

    // this.workerManager.queueGeneralChunk({
    //   cmd: 'GET_HIGHEST',
    //   x: 0,
    //   z: 0
    // })
  }

  update = () => {
    if (this.dirtyChunks.length === 0) return

    // do the updates one by one
    this.setupChunk(...this.dirtyChunks.shift())
  }

  surroundingChunksCheck = (coordx, coordy, coordz) => {
    const updatedChunks = {}

    for (let x = coordx - HORZ_D; x <= coordx + HORZ_D; x++) {
      for (let z = coordz - HORZ_D; z <= coordz + HORZ_D; z++) {
        for (let y = coordy - VERT_D; y <= coordy + VERT_D; y++) {
          updatedChunks[this.getChunkRep(x, y, z)] = true

          const tempChunk = this.getChunkFromCoords(x, y, z)

          if (!tempChunk) continue

          if (!tempChunk.getIsInScene()) {
            // IF NOT YET ADDED TO SCENE
            if (tempChunk.getMesh() instanceof THREE.Object3D) {
              tempChunk.addSelf(this.scene)
              tempChunk.setIsInScene(true)
            }
          }
        }
      }
    }

    const shouldBeRemoved = []
    this.scene.children.forEach(child => {
      if (!updatedChunks[child.name] && child.isChunk) {
        shouldBeRemoved.push(child)
        this.chunks[child.name].setIsInScene(false)
      }
    })
    shouldBeRemoved.forEach(obj => this.scene.remove(obj))
  }

  handleNewChunk = async (cx, cy, cz, ioData) => {
    const rep = Helpers.get3DCoordsRep(cx, cy, cz)
    // This means chunk ain't new
    if (this.getChunkFromCoords(cx, cy, cz)) return

    const newChunk = new Chunk(cx, cy, cz)

    if (!ioData) {
      this.chunks[rep] = newChunk
      return
    }

    const { data, meshData } = await parser.parse(ioData)

    newChunk.setData(data)
    this.meshChunk(newChunk, meshData)

    this.chunks[rep] = newChunk
  }

  markCB = ({ type, x, y, z }) => {
    if (type === 0) return

    this.cbDict[this.getChunkRep(x, y, z)] = type
  }

  makeChunk = (x, y, z) => {
    const newChunk = new Chunk(x, y, z)
    this.chunks[this.getChunkRep(x, y, z)] = newChunk

    this.tagDirtyChunk(x, y, z)
  }

  setupChunk = (cx, cy, cz) => {
    this.workerManager.queueGeneralChunk({
      cmd: 'GET_CHUNK',
      chunkRep: this.getChunkRep(cx, cy, cz),
      coords: { coordx: cx, coordy: cy, coordz: cz }
    })
  }

  meshChunk = (chunk, meshData) => {
    chunk.setLoading(false)

    if (!meshData) return

    const [geoJSON, materials] = meshData

    const mesh = Mesher.processMeshData(
      geoJSON,
      materials,
      this.resourceManager
    )

    if (!mesh) return

    chunk.setMesh(mesh)
  }

  tagDirtyChunk = (x, y, z) => this.dirtyChunks.push([x, y, z])

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getChunkRep = (x, y, z) => Helpers.get3DCoordsRep(x, y, z)

  getChunkFromCoords = (cx, cy, cz) => this.chunks[this.getChunkRep(cx, cy, cz)]

  getChunkFromRep = rep => this.chunks[rep]

  getTypeAt = (x, y, z) => {
    const { coordx, coordy, coordz } = Helpers.globalBlockToChunkCoords({
      x,
      y,
      z
    })
    const { x: bx, y: by, z: bz } = Helpers.globalBlockToChunkBlock({ x, y, z })
    const chunk = this.getChunkFromCoords(coordx, coordy, coordz)

    if (!chunk || !chunk.getDataExists()) return undefined

    return chunk.getBlock(bx, by, bz)
  }
}

export default ChunkManager
