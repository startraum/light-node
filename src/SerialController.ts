// @ts-ignore
import { init } from 'raspi'
// @ts-ignore
import { Serial } from 'raspi-serial'

function randomId() {
  const id = Math.floor(Math.random() * 1e17).toString(16)
  return id.toString()
}

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
    return rgbw
  },
})

export const setStatic = ({ red, green, blue, white, animate }: { red: number, green: number, blue: number, white: number, animate: boolean }): Mode => {
  const data = [0x000001, red, green, blue, white, animate ? 1 : 0]
  return {
    sendLength: 5,
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
  private sendQueue: { id: string, mode: Mode, resolve: (data?: any) => void }[] = []
  private sending = false

  public async send<T>(mode: Mode): Promise<T> {
    await this.open()

    return new Promise((resolve, reject) => {
      const id = randomId()
      const abortTimeout = setTimeout(() => {
        reject()
      }, parseInt(process.env.ABORT_TIMEOUT || '1000', 10))
      this.sendQueue.push({
        id,
        mode,
        resolve: () => {
          clearTimeout(abortTimeout)
          resolve()
        },
      })
      this.startSending()
    })
  }

  private async startSending() {
    if (this.sending) return
    if (this.sendQueue.length <= 0) return
    this.sending = true

    let item: { id: string, mode: Mode, resolve: (data?: any) => void } | undefined
    do {
      item = this.sendQueue.shift()
      if (item) {
        await new Promise(resolveItem => {
          const { mode, resolve, id } = item as { id: string, mode: Mode, resolve: (data?: any) => void }
          const { payload, getPayload, receiveLength } = mode
          const s = this.serial as Serial

          if (receiveLength > 0) {
            let received: Buffer | undefined
            const receive = (data: Buffer) => {
              received = received ? Buffer.concat([received, data]) : data
              if (received.length < receiveLength) {
                return
              }
              s.removeListener('data', receive)
              console.log('receive', id, received)
              resolveItem()
              resolve(getPayload(received as Buffer))
            }
            s.addListener('data', receive)
          }

          console.log('send', id, payload)
          s.write(payload)

          if (receiveLength <= 0) {
            resolveItem()
            resolve()
          }
        })
      }
    } while (item)
    this.sending = false
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
