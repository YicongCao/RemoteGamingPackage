const BaseConnection = require('./BaseConnection')
const EventArgs = require('./EventArgs')
const WebSocket = require('ws')

class RGPModelServer {
    constructor() {
        // 连接池
        this.connmap = new Map()
        // 回调函数
        // 游戏实例应当覆写以下回调函数，以实现按需连接等逻辑
        // 1. 收到连接回调
        this.onconfirm = null
        this._onconfirm = (onConfirmEvent) => {
            if (!(onConfirmEvent instanceof EventArgs.OnConfirmEvent)) {
                console.error("event arg not instance of OnConfirmEvent")
                return
            }
            if (this.onconfirm) {
                this.onconfirm(onConfirmEvent)
            }
            this.connmap[onConfirmEvent.connid] = onConfirmEvent.conn
        }
        // 2. 连接成功回调
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
        // 3. 业务包通信回调
        this.ondata = null
        this._ondata = (onDataEvent) => {
            if (this.ondata) {
                this.ondata(onDataEvent)
            }
        }
        // 4. 连接关闭回调
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
        // 5. 连接出错回调
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
        // 6. 虚拟通道回调
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

    serve(port) {
        this.wss = new WebSocket.Server({
            port: port
        })

        this.wss.on('connection', function connection(ws) {
            var client = new BaseConnection()
            this._regcallback(client)
            client.wait(ws)
        }.bind(this))
    }

    createVirtualChannel(clientConnID, vchannCallback, vchannID, remark = "") {
        this.connmap[clientConnID].createVirtualChannel(vchannCallback, vchannID, remark)
    }

    sendViaVirtualChannel(clientConnID, bizPacket, vchannID) {
        this.connmap[clientConnID].sendViaVirtualChannel(bizPacket, vchannID)
    }

    _regcallback(baseconn) {
        if (!(baseconn instanceof BaseConnection)) {
            console.error("baseconn not instance of BaseConnection")
            return
        }
        baseconn.onconnectreq = this._onconfirm
        baseconn.onconnected = this._onconnected
        baseconn.ondata = this._ondata
        baseconn.onclose = this._onclose
        baseconn.onerror = this._onerror
        baseconn.onvchannel = this._onvchann
    }
}

module.exports = RGPModelServer