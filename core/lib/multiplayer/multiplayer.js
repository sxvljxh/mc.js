import Config from '../../config/config'
import Helpers from '../../../server/src/utils/helpers'

import { Client } from 'colyseus.js'

const MULTIPLAYER_ENDPOINT = Config.tech.multiplayerEndpoint

class Multiplayer {
  constructor() {
    this.setupClient()
  }

  setupClient = () => {
    this.client = new Client(MULTIPLAYER_ENDPOINT)

    this.client.onOpen.add(() => {
      Helpers.log('Connected to multiplayer server!', true)
    })

    this.client.onError.add(err => {
      Helpers.log(`An error occured on multiplayer: ${err}`)
    })
  }
}

export default Multiplayer
