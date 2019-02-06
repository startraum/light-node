import convertToRGBW, { convertFromRGBW } from './convertToRGBW'
import serialController, { getData, setStatic } from './SerialController'

export interface LightUpdate {
  hue?: number
  lightness?: number
  power?: boolean
  intensity?: number
}

class LightController {
  public async push(update: LightUpdate) {
    const mode = setStatic(convertToRGBW({
      hue: update.hue || 0,
      saturation: update.lightness || 0,
      value: update.intensity || 0,
    }))
    return serialController.send(mode)
  }

  public async pull(): Promise<LightUpdate> {
    const data = await serialController.send<{ red: number, green: number, blue: number, white: number }>(getData())
    const hsv = convertFromRGBW(data)
    return {
      hue: hsv.hue,
      lightness: hsv.saturation,
      intensity: hsv.value,
    }
  }
}

export default new LightController()
