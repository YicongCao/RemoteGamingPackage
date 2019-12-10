const BaseConnection = require('./BaseConnection')
const EventArgs = require('./EventArgs')
// const WebSocket = require('ws') // 浏览器上自带 websocket

class RGPModelClient {
    constructor() {
        // 连接
        this.conn = new BaseConnection()
        // 回调函数
        // 游戏客户端应当覆写以下回调函数，以实现按需连接等逻辑
        // 1. 连接时
        this.onconnected = null
        this._onconnected = (onConnectedEvent) => {
            if (!(onConnectedEvent instanceof EventArgs.OnConnectedEvent)) {
                console.error("event arg not instance of OnConnectedEvent")
                return
            }
            if (this.onconnected) {
                this.onconnected(onConnectedEvent)
            }
        }
        // 2. 业务包通信回调
        this.ondata = null
        this._ondata = (onDataEvent) => {
            if (this.ondata) {
                this.ondata(onDataEvent)
            }
        }
        // 3. 连接关闭回调
        this.onclose = null
        this._onclose = (onCloseEvent) => {
            if (!(onCloseEvent instanceof EventArgs.OnCloseEvent)) {
                console.error("event arg not instance of OnCloseEvent")
                return
            }
            if (this.onclose) {
                this.onclose(onCloseEvent)
            }
        }
        // 4. 连接出错回调
        this.onerror = null
        this._onerror = (onErrorEvent) => {
            if (!(onErrorEvent instanceof EventArgs.OnErrorEvent)) {
                console.error("event arg not instance of OnErrorEvent")
                return
            }
            if (this.onerror) {
                this.onerror(onErrorEvent)
            }
        }
        // 5. 虚拟通道回调
        this.onvchann = null
        this._onvchann = (onVChannEvent) => {
            if (!(onVChannEvent instanceof EventArgs.OnVChannelAcquireEvent)) {
                console.error("event arg not instance of OnVChannelAcquireEvent")
                return
            }
            if (this.onvchann) {
                this.onvchann(onVChannEvent)
            }
        }
    }

    connect(url) {
        this._regcallback(this.conn)
        this.conn.connect(new WebSocket(url))
    }

    createVirtualChannel(vchannCallback, vchannID, remark = "") {
        this.conn.createVirtualChannel(vchannCallback, vchannID, remark)
    }

    sendViaVirtualChannel(bizPacket, vchannID) {
        this.conn.sendViaVirtualChannel(bizPacket, vchannID)
    }

    _regcallback(baseconn) {
        if (!(baseconn instanceof BaseConnection)) {
            console.error("baseconn not instance of BaseConnection")
            return
        }
        baseconn.onconnectreq = null
        baseconn.onconnected = this._onconnected
        baseconn.ondata = this._ondata
        baseconn.onclose = this._onclose
        baseconn.onerror = this._onerror
        baseconn.onvchannel = this._onvchann
    }
}

module.exports = RGPModelClient