import config from 'console-stamp'
import { throttle } from 'lodash'
import { Publisher, Subscriber } from 'cote'
import controller, { LightUpdate } from './LightController'

config(console)

const light = {
  id: process.env.LIGHT_ID || 'default',
  name: process.env.LIGHT_NAME || 'default',
  hue: 0,
  lightness: 0,
  power: false,
  intensity: 50,
  lastColors: [],
}

const subscriber = new Subscriber({ name: 'lightsBroadcast' })
const publisher = new Publisher({ name: 'lightsBroadcast' })

const publishLight = async (pull = true) => {
  if (pull) {
    const update = await controller.pull()
    Object.keys(update).forEach(key => {
      // @ts-ignore
      light[key] = update[key]
    })
    light.power = light.lightness > 0
  }
  // @ts-ignore
  publisher.publish('light', { light, time: new Date() })
}

const pushThrottled = throttle(l => controller.push(l).catch(e => console.error(e)), parseInt(process.env.LIGHT_THROTTLE || '50', 10))

// @ts-ignore
subscriber.on('update', ({ id, update }: { id: string, update: LightUpdate }) => {
  if (light.id !== id) return
  Object.keys(update).forEach(key => {
    // @ts-ignore
    light[key] = update[key]
  })
  pushThrottled({
    hue: light.hue,
    lightness: light.lightness,
    intensity: light.power ? light.intensity : 0,
  })
  publishLight(false).catch(e => console.error(e))
})

setInterval(publishLight, parseInt(process.env.UPDATE_INTERVAL || '30000', 10))
publishLight().catch(e => console.error(e))
