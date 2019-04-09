import { promisify } from 'util'
import { createClient } from 'redis'
import { Light, LightUpdate } from './LightController'

if (!process.env.REDIS_URL) throw new Error('REDIS_URL not provided!')

const subscriber = createClient({
  url: process.env.REDIS_URL,
})
const publisher = createClient({
  url: process.env.REDIS_URL,
})

subscriber.subscribe('update-light')

interface LightUpdateEvent {
  id: string
  update: LightUpdate
}

export function subscribe(fn: (data: LightUpdateEvent) => void) {
  subscriber.on('message', (channel, message) => {
    if (channel !== 'update-light') return
    const update: { id: string, update: LightUpdate } = JSON.parse(message)
    fn(update)
  })
}

const p = promisify(publisher.publish.bind(publisher))
export function publish(light: Light) {
  return p('light-updated', JSON.stringify(light))
}
