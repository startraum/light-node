import { Publisher, Subscriber } from 'cote'
import * as faker from 'faker'
import controller, { LightUpdate } from './LightController'

const light = {
  id: faker.random.uuid(),
  name: faker.name.title(),
  hue: faker.random.number(255),
  lightness: faker.random.number(100),
  power: faker.random.boolean(),
  intensity: 50 + faker.random.number(50),
  lastColors: [],
}

const subscriber = new Subscriber({ name: 'lightsBroadcast' })
const publisher = new Publisher({ name: 'lightsBroadcast' })

const publishLight = async () => {
  Object.keys(await controller.pull()).forEach(key => {
    // @ts-ignore
    light[key] = update[key]
  })
  // @ts-ignore
  publisher.publish('light', { light, time: new Date() })
}

// @ts-ignore
subscriber.on('update', ({ id, update }: { id: string, update: LightUpdate }) => {
  if (light.id !== id) return
  Object.keys(update).forEach(key => {
    // @ts-ignore
    light[key] = update[key]
  })
  controller.push(update)
  publishLight()
})

setInterval(publishLight, parseInt(process.env.UPDATE_INTERVAL || '30000', 10))
publishLight()
