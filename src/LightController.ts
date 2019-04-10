import convertToRGBW, { convertFromRGBW } from './convertToRGBW'
import serialController, { getData, setStatic, animation } from './SerialController'

const maxDist = parseInt(process.env.MAX_DIST || '50', 10)

export interface LightUpdate {
  hue?: number
  lightness?: number
  power?: boolean
  intensity?: number
  animation?: boolean
  locked?: boolean
  colors?: { hue: number, intensity: number, lightness: number }[]
}

export interface Light {
  id: string
  name: string
  hue: number
  lightness: number
  power: boolean
  intensity: number
  animation: boolean
  locked: boolean
  colors: { hue: number, intensity: number, lightness: number }[]
}

interface Color { red: number, green: number, blue: number, white: number }

let currentColor = { red: 0, green: 0, blue: 0, white: 255 }
const square = (a: number) => a * a
const distance = (v1: Color, v2: Color) =>
  Math.sqrt(square(v1.red - v2.red)
    + square(v1.green - v2.green)
    + square(v1.blue - v2.blue)
    + square(v1.white - v2.white))

class LightController {
  public async push(update: LightUpdate) {
    if (update.animation) {
      return serialController.send(animation())
    } else {
      const newColor = convertToRGBW({
        hue: update.hue || 0,
        saturation: update.lightness || 0,
        value: update.intensity || 0,
      })
      const mode = setStatic({
        ...newColor,
        animate: distance(currentColor, newColor) > maxDist,
      })
      currentColor = newColor
      return serialController.send(mode)
    }
  }

  public async pull(): Promise<LightUpdate> {
    const data = await serialController.send<{ red: number, green: number, blue: number, white: number }>(getData())
    const hsv = convertFromRGBW(data)
    return {
      hue: hsv.hue,
      lightness: hsv.saturation,
      intensity: hsv.value,
      animation: false,
    }
  }
}

export default new LightController()
