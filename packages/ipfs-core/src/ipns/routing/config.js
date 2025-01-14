import { TieredDatastore } from 'datastore-core/tiered'
import get from 'dlv'
import { IpnsPubsubDatastore } from './pubsub-datastore.js'
import { OfflineDatastore } from './offline-datastore.js'

/**
 * @param {object} arg
 * @param {import('libp2p')} arg.libp2p
 * @param {import('ipfs-repo').IPFSRepo} arg.repo
 * @param {import('peer-id')} arg.peerId
 * @param {object} arg.options
 */
export function createRouting ({ libp2p, repo, peerId, options }) {
  // Setup online routing for IPNS with a tiered routing composed by a DHT and a Pubsub router (if properly enabled)
  const ipnsStores = []

  // Add IPNS pubsub if enabled
  let pubsubDs
  if (get(options, 'EXPERIMENTAL.ipnsPubsub', false)) {
    const pubsub = libp2p.pubsub
    const localDatastore = repo.datastore

    pubsubDs = new IpnsPubsubDatastore(pubsub, localDatastore, peerId)
    ipnsStores.push(pubsubDs)
  }

  // DHT should not be added as routing if we are offline or it is disabled
  if (get(options, 'offline') || !get(options, 'libp2p.config.dht.enabled', false)) {
    const offlineDatastore = new OfflineDatastore(repo)
    ipnsStores.push(offlineDatastore)
  } else {
    ipnsStores.push(libp2p._dht)
  }

  // Create ipns routing with a set of datastores
  return new TieredDatastore(ipnsStores)
}
