/**
 * @class event
 * @constructor
 * @param {galaxyvis<any>} 初始化
 */

class EventEmitter {
    _maxListeners: number
    _events: any

    constructor() {
        this._events = Object.create(null)
        this._maxListeners = 50
    }

    _bind(event: string | number, listener: { (...rest: any[]): void; fn: any }, method = 'push') {
        ;(this._events[event] || (this._events[event] = []))[method](listener)
        return this
    }
    /**
     * 为指定事件添加一个监听器到监听器数组的尾部。
     * @param event
     * @param listener
     * @returns
     */
    addListener(event: any, listener: any) {
        return this._bind(event, listener)
    }
    /**
     * 为指定事件添加一个监听器到监听器数组的尾部
     * @param event
     * @param listener
     * @returns
     */
    on(event: any, listener: any) {
        return this.addListener(event, listener)
    }
    /**
     * 与addListener相对，为指定事件添加一个监听器到监听器数组的头部。
     * @param event
     * @param listener
     */
    prependListener(event: any, listener: any) {
        this._bind(event, listener, 'unshift')
    }
    /**
     * 为指定事件注册一个单次监听器，即 监听器最多只会触发一次，触发后立刻解除该监听器。
     * @param event
     * @param listener
     * @param method
     * @returns
     */
    _once(event: any, listener: any, method = 'push') {
        const foo = (...rest: any[]) => {
            this.removeListener(event, foo)
            listener.apply(this, rest)
        }

        foo.fn = listener

        return this._bind(event, foo, method)
    }
    /**
     * 为指定事件注册一个单次监听器，即 监听器最多只会触发一次，触发后立刻解除该监听器。
     * @param event
     * @param listener
     * @param method
     * @returns
     */
    once(event: any, listener: any) {
        return this._once(event, listener, 'push')
    }
    /**
     * 添加单次监听器 listener 到名为 eventName 的事件的监听器数组的开头。
     * @param event
     * @param listener
     * @returns
     */
    prependOnceListener(event: any, listener: any) {
        return this._once(event, listener, 'unshift')
    }
    /**
     * 移除指定事件的某个监听器，监听器必须是该事件已经注册过的监听器
     * @param event
     * @param listener
     * @returns
     */
    removeListener(event: string | number, listener: { (...rest: any[]): void; fn: any }) {
        if (!arguments.length) {
            this._events = Object.create(null)

            return this
        }

        const cbs = this._events[event]

        if (!cbs) return this
        if (!listener) {
            this._events[event] = null
            return this
        }
        this._events[event] = cbs.filter((cb: { fn: any }) => {
            return !(cb === listener || cb.fn === listener)
        })

        return this
    }
    /**
     * 移除指定事件的某个监听器，监听器必须是该事件已经注册过的监听器
     * @param event
     * @param listener
     * @returns
     */
    off(event: any, listener: any) {
        return this.removeListener(event, listener)
    }
    /**
     * 按参数的顺序执行每个监听器，如果事件有注册监听返回 true，否则返回 false。
     * @param event
     * @param args
     * @returns
     */
    emit(event: string | number, ...args: any[]) {
        const cbs = this._events[event]

        if (cbs) {
            const len = cbs.length
            const { _maxListeners } = this
            cbs.forEach((cb: any) => {
                cb.apply(this, args)
            })

            if (!(_maxListeners !== 0 || _maxListeners !== Infinity)) {
                if (len > _maxListeners) {
                    console.error(`超出监听个数请，通过setMaxListeners扩充监听个数`)
                }
            }
        }

        return this
    }
    /**
     * 返回指定事件的监听器数组。
     * @param event
     * @returns
     */
    listeners(event: string | number) {
        return this._events[event]
    }
    /**
     * 默认情况下， EventEmitters 如果你添加的监听器超过 50 个就会输出警告信息。
     * setMaxListeners 函数用于提高监听器的默认限制的数量
     * @param limit
     */
    setMaxListeners(limit: number) {
        this._maxListeners = limit
    }
}
export default EventEmitter
