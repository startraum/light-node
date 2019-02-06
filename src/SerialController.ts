// @ts-ignore
import { init } from 'raspi'
// @ts-ignore
import { Serial } from 'raspi-serial'

interface Mode {
  sendLength: number
  receiveLength: number
  payload: Buffer
  getPayload(data: Buffer): any
}

export const getData = (): Mode => ({
  sendLength: 0,
  receiveLength: 4,
  payload: Buffer.from([0x000000]),
  getPayload: data => {
    return {
      red: data[0],
      green: data[1],
      blue: data[2],
      white: data[3],
    }
  },
})

export const setStatic = ({ red, green, blue, white }: { red: number, green: number, blue: number, white: number }): Mode => ({
  sendLength: 4,
  receiveLength: 0,
  payload: Buffer.from([0x000001, red, green, blue, white]),
  getPayload: () => null,
})

export const animation = (): Mode => ({
  sendLength: 0,
  receiveLength: 0,
  payload: Buffer.from([0x000002]),
  getPayload: () => null,
})

export class SerialController {
  public device: string | undefined
  public serial: Serial | undefined

  private _openPromise: Promise<void> | undefined

  public async send<T>(mode: Mode): Promise<T> {
    await this.open()
    const { payload, getPayload } = mode
    const s = this.serial as Serial

    return new Promise(resolve => {
      const receive = (data: Buffer) => {
        resolve(getPayload(data))
      }
      s.once('data', receive)

      s.write(payload)
    })
  }

  private open() {
    if (!this._openPromise) {
      this.serial = new Serial({
        portId: process.env.LIGHT_DEVICE || '',
        baudRate: parseInt(process.env.BAUDRATE || '9600', 10),
      })

      this._openPromise = new Promise(resolve => {
        init(() => (this.serial as Serial).open(() => resolve))
      })
    }
    return this._openPromise
  }
}

export default new SerialController()
