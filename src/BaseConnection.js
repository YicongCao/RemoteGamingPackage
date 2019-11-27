const Enums = require('./Enums')
const WebSocket = require('ws')
const Protocol = require('./Protocol')
const invalidConnID = 0xffffffff

class BaseConnection {
    constructor() {
        // status vars
        this.conn = null
        this.connid = invalidConnID
        this.status = Enums.Status.INVALID
        // callbacks
        // this.onconnectreq = null    // server
        // this.onconnected = null     // client
        // this.onerror = null
        // this.onhung = null
        // this.ondata = null
    }

    /**
     * Connect to server
     * @param {string} url target url, e.g. ws://localhost:7667
     */
    connect(url) {
        if (!this._setconn(new WebSocket(url))) {
            return
        }

        this.conn.on('open', function _onopen() {
            this.status = Enums.Status.UNCONFIRMED
            // make base RGP connection
            var rgpBaseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.NONE_LAYER, 
                Enums.BaseLayerCommand.CLIENT_ACQUIRE, invalidConnID)
            var rgpBaseLayerBuffer = Protocol.ProtocolSerializer.PackBaseLayer(rgpBaseLayerPacket)
            this._sendraw(rgpBaseLayerBuffer)
        }.bind(this))

        this.conn.on('message', function _onclientmsg(e) {
            var callbackMap = new Map()
            callbackMap[Enums.Status.UNCONFIRMED] = (rgpPacketMap) => {
                var basePacket = rgpPacketMap[Enums.ProtoName.BASE_LAYER]
                switch (basePacket.command) {
                    case Enums.BaseLayerCommand.SERVER_CONFIRM:
                        this.status = Enums.Status.CONNECTED
                        this.connid = basePacket.connectionID
                        console.log("rgp conn confirmed, connid:", this.connid)
                        return Enums.ErrorCodes.SUCCEEDED
                    case Enums.BaseLayerCommand.SERVER_REJECT:
                        this.status = Enums.Status.REJECTED
                        console.error("rgp conn denied by server")
                        return Enums.ErrorCodes.SERVER_REJECTED
                    default:
                        this.status = Enums.Status.HUNG
                        console.error("illegal command when conn unconfirmed")
                        return Enums.ErrorCodes.UNSUPPORTED_COMMAND
                }
            }
            this._process(e, callbackMap)
        }.bind(this))
    }

    /**
     * Handle client connect action
     * @param {WebSocket} ws websocket instance created by server
     * @param {int} clientID conn id that identifies different clients
     */
    onconnectreq(ws, clientID) {
        if (!this._setconn(ws, clientID)) {
            return
        }

        this.conn.on('message', function _onservermsg(e) {
            var callbackMap = new Map()
            callbackMap[Enums.Status.UNCONFIRMED] = (rgpPacketMap) => {
                var basePacket = rgpPacketMap[Enums.ProtoName.BASE_LAYER]
                switch (basePacket.command) {
                    case Enums.BaseLayerCommand.CLIENT_ACQUIRE:
                        var accept = this.connid && this.connid != invalidConnID
                        var resp = null
                        if (accept) {
                            this.status = Enums.Status.CONNECTED
                            var rgpBaseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.NONE_LAYER, 
                                Enums.BaseLayerCommand.SERVER_CONFIRM, clientID)
                            var resp = Protocol.ProtocolSerializer.PackBaseLayer(rgpBaseLayerPacket)
                            console.log("rgp conn confirmed, connid:", this.connid)
                        } else {
                            this.status = Enums.Status.REJECTED
                            var rgpBaseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.NONE_LAYER, 
                                Enums.BaseLayerCommand.SERVER_REJECT, clientID)
                            var resp = Protocol.ProtocolSerializer.PackBaseLayer(rgpBaseLayerPacket)
                            console.error("rgp conn denied by server")
                        }
                        this._sendraw(resp)
                        return Enums.ErrorCodes.SUCCEEDED
                    default:
                        return Enums.ErrorCodes.UNSUPPORTED_COMMAND
                }
            }
            this._process(e, callbackMap)
        }.bind(this))
    }

    _setconn(ws, connidPara = invalidConnID) {
        if (ws.__proto__ != WebSocket.prototype) {
            console.error("conn para not instance of ws:", ws)
            return false
        }
        this.conn = ws
        this.conn.binaryType = 'arraybuffer'
        this.connid = connidPara
        this.status = Enums.Status.UNCONFIRMED
        return true
    }

    _sendraw(arrayBuffer) {
        if (!(arrayBuffer instanceof ArrayBuffer)) {
            console.error("data to send not arraybuffer")
            return
        }
        var length = arrayBuffer.byteLength
        console.log("sending", length, "byte long data")
        this.conn.send(arrayBuffer)
    }

    _process(data, callbackMap) {
        if (!(data instanceof ArrayBuffer)) {
            console.error("data received not arraybuffer")
            return
        }
        console.log("received", data.byteLength, "byte long data")
        if (!(callbackMap instanceof Map)) {
            console.error("illegal callbackmap")
            return
        }
        if (!callbackMap[this.status]) {
            console.error("callback unimplenmented for status", this.status)
            return
        }
        // parse all layers
        var rgpDataPackets = Protocol.ProtocolSerializer.UnpackAllAsMap(data)
        // process data on conditions
        var callbackRet = callbackMap[this.status](rgpDataPackets)
        console.log("handled with ret:", callbackRet)
    }
}

module.exports = BaseConnection