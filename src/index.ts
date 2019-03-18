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
  animation: false,
  colors: [{
    hue: 0,
    intensity: 100,
    lightness: 50,
  }, {
    hue: 50,
    intensity: 100,
    lightness: 60,
  }, {
    hue: 150,
    intensity: 75,
    lightness: 80,
  }, {
    hue: 327.39,
    lightness: 50,
    intensity: 100,
  }],
}

const subscriber = new Subscriber({ name: 'lightsBroadcast' })
const publisher = new Publisher({ name: 'lightsBroadcast' })

const logAndCrash = (error: Error) => {
  console.error(error)
  process.exit(1)
}

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

const pushThrottled = throttle(l => controller.push(l), parseInt(process.env.LIGHT_THROTTLE || '50', 10))

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
    animation: light.animation,
  }).catch(logAndCrash)
  publishLight(false).catch(logAndCrash)
})

setInterval(publishLight, parseInt(process.env.UPDATE_INTERVAL || '30000', 10))
publishLight().catch(logAndCrash)
