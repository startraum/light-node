import config from 'console-stamp'
import { throttle } from 'lodash'
import { subscribe, publish } from './redis'
import controller, { Light, LightUpdate } from './LightController'

config(console)

const light: Light = {
  id: process.env.LIGHT_ID || 'default',
  name: process.env.LIGHT_NAME || 'default',
  hue: 0,
  lightness: 0,
  power: false,
  intensity: 50,
  animation: false,
  locked: false,
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

const logAndCrash = (error: Error) => {
  console.error(error)
  process.exit(1)
}

const publishLight = async (pull = true) => {
  if (pull) {
    const update = await controller.pull()
    if (update.hue != null) light.hue = update.hue
    if (update.lightness != null) light.lightness = update.lightness
    if (update.power != null) light.power = update.power
    if (update.intensity != null) light.intensity = update.intensity
    if (update.animation != null) light.animation = update.animation
    if (update.locked != null) light.locked = update.locked
    light.power = light.lightness > 0
  }
  return publish(light)
}

const pushThrottled = throttle(l => controller.push(l), parseInt(process.env.LIGHT_THROTTLE || '50', 10))

subscribe(({ id, update }: { id: string, update: LightUpdate }) => {
  console.log(id, light.id, update)
  if (light.id !== id) return
  if (update.hue != null) light.hue = update.hue
  if (update.lightness != null) light.lightness = update.lightness
  if (update.power != null) light.power = update.power
  if (update.intensity != null) light.intensity = update.intensity
  if (update.animation != null) light.animation = update.animation
  if (update.locked != null) light.locked = update.locked
  console.log('pushing')
  pushThrottled({
    hue: light.hue,
    lightness: light.lightness,
    intensity: light.power ? light.intensity : 0,
    animation: light.animation,
  }).catch(logAndCrash)
  console.log('pushing finished')
  publishLight(false).catch(logAndCrash)
})

setInterval(publishLight, parseInt(process.env.UPDATE_INTERVAL || '30000', 10))
publishLight().catch(logAndCrash)
