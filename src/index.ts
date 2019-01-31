import { Publisher, Subscriber } from 'cote'
import * as faker from 'faker'

interface LightUpdate {
  hue?: number
  lightness?: number
  power?: boolean
  intensity?: number
}

const light = {
  id: faker.random.uuid(),
  name: faker.name.title(),
  hue: faker.random.number(255),
  lightness: faker.random.number(255),
  power: faker.random.boolean(),
  intensity: faker.random.number(100),
  lastColors: [],
}

const subscriber = new Subscriber({ name: 'lightsBroadcast' })
const publisher = new Publisher({ name: 'lightsBroadcast' })

const publishLight = () => {
  // @ts-ignore
  publisher.publish('light', { light, time: new Date() })
}

// @ts-ignore
subscriber.on('update', ({ id, update }: { id: string, update: LightUpdate }) => {
  if (light.id !== id) return
  console.log('update', update)
  Object.keys(update).forEach(key => {
    // @ts-ignore
    light[key] = update[key]
  })
  publishLight()
})

setInterval(publishLight, parseInt(process.env.UPDATE_INTERVAL || '30000', 10))
publishLight()
