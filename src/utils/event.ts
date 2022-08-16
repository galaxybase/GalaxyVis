import { PlainObject } from '../types'

class Event<T, K> {
    clientList: PlainObject<any>
    constructor() {
        this.clientList = {}
    }
    listen(key: any, handler: any) {
        if (!this.clientList[key]) {
            this.clientList[key] = []
        }
        this.clientList[key].push(handler)
    }
    trigger(event: string | number, ...args: any[]) {
        const key = event
        const handlers = this.clientList[key]

        if (!handlers || handlers.length === 0) {
            return false
        }

        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i]
            handler.apply(null, args)
        }
    }
    remove(key: any, handler: any) {
        const handlers = this.clientList[key]

        if (!handlers) {
            return false
        }
        if (!handler) {
            handlers && (handlers.length = 0)
        } else {
            for (let i = 0; i < handlers.length; i++) {
                const _handler = handlers[i]
                _handler === handler && handlers.splice(i, 1)
            }
        }
    }
}

export default new Event()
