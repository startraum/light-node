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
    const rgbw = {
      red: data[0],
      green: data[1],
      blue: data[2],
      white: data[3],
    }
    console.log(rgbw)
    return rgbw
  },
})

export const setStatic = ({ red, green, blue, white }: { red: number, green: number, blue: number, white: number }): Mode => {
  const data = [0x000001, red, green, blue, white]
  console.log('setStatic', data)
  return {
    sendLength: 4,
    receiveLength: 0,
    payload: Buffer.from(data),
    getPayload: () => null,
  }
}

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
  private _sendPromise: Promise<any> | undefined

  public async send<T>(mode: Mode): Promise<T> {
    await this.open()
    const { payload, getPayload, receiveLength } = mode
    const s = this.serial as Serial

    if (this._sendPromise) {
      await this._sendPromise
      return this.send(mode)
    }
    this._sendPromise = new Promise(resolve => {
      if (receiveLength > 0) {
        let received: Buffer | undefined
        const receive = (data: Buffer) => {
          received = received ? Buffer.concat([received, data]) : data
          if (received.length < receiveLength) {
            return
          }
          s.removeListener('data', receive)
          console.log('receive', received)
          resolve(getPayload(received as Buffer))
        }
        s.addListener('data', receive)
      }

      console.log('send', payload)
      s.write(payload)

      if (receiveLength <= 0) resolve()
    }).then(res => {
      this._sendPromise = undefined
      return res
    })
    return this._sendPromise
  }

  private open() {
    if (!this._openPromise) {
      this.serial = new Serial({
        portId: process.env.LIGHT_DEVICE || '',
        baudRate: parseInt(process.env.BAUDRATE || '9600', 10),
      })

      this._openPromise = new Promise(resolve => {
        init(() => {
          const s = this.serial as Serial
          s.open(() => {
            setTimeout(() => {
              console.log('opened serial connection to arduino')
              resolve()
            }, 3000)
          })
        })
      })
    }
    return this._openPromise
  }
}

export default new SerialController()
