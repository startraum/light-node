import Color from 'color'

function fmod(a: number, b: number) {
  return Number((a - (Math.floor(a / b) * b)).toPrecision(8))
}

const convertToRGBW = ({ red, green, blue }: { red: number, green: number, blue: number }) => {
  // Get the maximum between R, G, and B
  const tM = Math.max(red, green, blue)

  // If the maximum value is 0, immediately return pure black.
  if (tM === 0) return { red: 0, green: 0, blue: 0, white: 0 }

  // This section serves to figure out what the color with 100% hue is
  const multiplier = 255 / tM
  const hR = red * multiplier
  const hG = green * multiplier
  const hB = blue * multiplier

  // This calculates the Whiteness (not strictly speaking Luminance) of the color
  const M = Math.max(hR, hG, hB)
  const m = Math.min(hR, hG, hB)
  const luminance = ((M + m) / 2 - 127.5) * (255 / 127.5) / multiplier

  // Calculate the output values and trim them so that they are all between 0 and 255
  const w = Math.max(0, Math.min(255, Math.round(luminance)))
  const r = Math.max(0, Math.min(255, Math.round(red - luminance)))
  const g = Math.max(0, Math.min(255, Math.round(green - luminance)))
  const b = Math.max(0, Math.min(255, Math.round(blue - luminance)))
  return { red: r, green: g, blue: b, white: w }
}

const convertToRGB = ({ red, green, blue, white }: { red: number, green: number, blue: number, white: number }) => {
  return {
    red: Math.min(255, red + white),
    green: Math.min(255, green + white),
    blue: Math.min(255, blue + white),
  }
}

export const convertFromRGBW = (col: { red: number, green: number, blue: number, white: number }) => {
  const { red: r, green: g, blue: b } = convertToRGB(col)
  const color = Color({ r, g, b })
  const hsv = color.hsv()

  return {
    hue: Math.round(hsv.hue()),
    saturation: Math.round(50 - ((hsv.saturationv() / 2) - 50)),
    value: Math.round(hsv.value()),
  }
}

export default ({ hue, saturation, value  }: { hue: number, saturation: number, value: number }) => {
  const h = fmod(hue, 360)
  const s = 100 - ((saturation * 2) - 100)
  const v = value
  const c = Color({ h, s, v })

  return convertToRGBW({
    red: c.red(),
    green: c.green(),
    blue: c.blue(),
  })
}
