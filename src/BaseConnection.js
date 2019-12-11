const Enums = require('./Enums')
if (typeof (WebSocket) == 'undefined') {
    isBrowser = false
}
const Protocol = require('./Protocol')
const EventArgs = require('./EventArgs')
const VirtualChannel = require('./VirtualChannel')
const Utils = require('./Utils')
const invalidConnID = 0xffffffff
const roleClient = "client"
const roleServer = "server"
var isBrowser = true

class BaseConnection {
    constructor() {
        // status vars
        this.conn = null
        this.connid = invalidConnID
        this.status = Enums.Status.INVALID
        this._role = ""
        this._vchannMap = new Map()
        // callbacks
        this.onconnectreq = null    // server
        this.onconnected = null     // client
        this.onerror = null
        this.onclose = null
        this.ondata = null
        this.onvchannel = null
    }

    /**
     * @param {WebSocket} ws websocket instance created by server
     * @param {string} url target url, e.g. ws://localhost:7667
     */
    connect(ws) {
        this._role = roleClient
        if (!this._setConn(ws)) {
            return
        }

        var _onopen = (() => {
            this.status = Enums.Status.UNCONFIRMED
            // make base RGP connection
            var rgpBaseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.NONE_LAYER,
                Enums.BaseLayerCommand.CLIENT_ACQUIRE, invalidConnID)
            var rgpBaseLayerBuffer = Protocol.ProtocolSerializer.PackBaseLayer(rgpBaseLayerPacket)
            this._sendRaw(rgpBaseLayerBuffer)
        }).bind(this)
        var _onmsg = ((e) => {
            if (isBrowser) {
                this._process(e.data)
            } else {
                this._process(e)
            }
        }).bind(this)
        var _onerr = ((e) => {
            this.status = Enums.Status.HUNG
            console.error("rgp conn error:", e.code)
            if (this.onerror) {
                var onErrorEvent = new EventArgs.OnErrorEvent(this)
                onErrorEvent.errorcode = e.code
                this.onerror(onErrorEvent)
            }
        }).bind(this)
        var _onclose = ((e) => {
            this.status = Enums.Status.CLOSED
            if (isBrowser) {
                console.error("rgp conn closed:", e.code)
            } else {
                console.error("rgp conn closed:", e)
            }
            if (this.onclose) {
                var onCloseEvent = new EventArgs.OnCloseEvent(this)
                onCloseEvent.errorcode = isBrowser ? e.code : e
                this.onclose(onCloseEvent)
            }
        })

        if (isBrowser) {
            this.conn.onopen = _onopen
            this.conn.onmessage = _onmsg
            this.conn.onerror = _onerr
            this.conn.onclose = _onclose
        } else {
            this.conn.on('open', _onopen)
            this.conn.on('message', _onmsg)
            this.conn.on('error', _onerr)
            this.conn.on('close', _onclose)
        }
    }

    /**
     * Handle client connect action
     * @param {WebSocket} ws websocket instance created by server
     * @param {int} clientID conn id that identifies different clients
     */
    wait(ws, clientID = invalidConnID) {
        this._role = roleServer
        if (!this._setConn(ws, clientID)) {
            return
        }

        this.conn.on('message', function _onservermsg(e) {
            this._process(e)
        }.bind(this))

        this.conn.on('error', function _onclienterr(e) {
            this.status = Enums.Status.HUNG
            console.error("rgp conn error:", e.code)
            if (this.onerror) {
                var onErrorEvent = new EventArgs.OnErrorEvent(this)
                onErrorEvent.errorcode = e.code
                this.onerror(onErrorEvent)
            }
        }.bind(this))

        this.conn.on('close', function _onclienterr(e) {
            this.status = Enums.Status.CLOSED
            console.error("rgp conn closed:", e)
            if (this.onclose) {
                var onCloseEvent = new EventArgs.OnCloseEvent(this)
                onCloseEvent.errorcode = e
                this.onclose(onCloseEvent)
            }
        }.bind(this))
    }

    createVirtualChannel(vchannCallback, vchannID, remark = "") {
        var acquirePacket = new Protocol.VirtualChannelLayerPacket(Enums.Proto.NONE_LAYER,
            Enums.VirtualChannelLayerCommand.CHANNEL_ACQUIRE, vchannID, remark)
        this._vchannMap[vchannID] = new VirtualChannel(this, vchannID, remark, vchannCallback)
        this._sendPacket(acquirePacket)
        return this._vchannMap[vchannID]
    }

    sendViaVirtualChannel(bizPacket, vchannID) {
        this._vchannMap[vchannID].send(bizPacket)
    }

    _processBaseLayer(basePacket) {
        var nextLayer = Enums.Proto.NONE_LAYER
        var result = Enums.ErrorCodes.SUCCEEDED
        do { 
            if (!(basePacket instanceof Protocol.BaseLayerPacket)) {
                result = Enums.ErrorCodes.PARAM_INVALID
                break
            }
            nextLayer = basePacket.proto
            if (this.status == Enums.Status.UNCONFIRMED) {
                if (this._role == roleClient) {
                    result = this._onBaseconnConfirmed(basePacket)
                } else if (this._role == roleServer) {
                    result = this._onBaseconnRequiring(basePacket)
                } else {
                    result = Enums.ErrorCodes.UNKNOWN_ROLE
                }
                break
            } else if (this.status == Enums.Status.CONNECTED) {
                // todo: close connected connection
                break
            } else {
                console.warn("unsupported status processing:", this.status)
                result = Enums.ErrorCodes.UNSUPPORTED_STATUS
                break
            }
        } while (false)
        // console.log("base layer proc ret:", result, "next layer:", nextLayer)
        return nextLayer
    }

    _processVirtualChannelLayer(vchanPacket) {
        var nextLayer = Enums.Proto.NONE_LAYER
        var result = Enums.ErrorCodes.SUCCEEDED
        do {
            if (!(vchanPacket instanceof Protocol.VirtualChannelLayerPacket)) {
                result = Enums.ErrorCodes.PARAM_INVALID
                break
            }
            nextLayer = vchanPacket.proto
            var onVChannAcquireEvent = new EventArgs.OnVChannelAcquireEvent(this)
            if (vchanPacket.command == Enums.VirtualChannelLayerCommand.CHANNEL_ACQUIRE) {
                onVChannAcquireEvent.action = "acquire"
                onVChannAcquireEvent.remark = vchanPacket.remark
                onVChannAcquireEvent.channid = vchanPacket.virtualChannelID
                if (this.onvchannel) {
                    this.onvchannel(onVChannAcquireEvent)
                }
                if (onVChannAcquireEvent.allow) {
                    if (!onVChannAcquireEvent.callback || !onVChannAcquireEvent.channid) {
                        result = Enums.ErrorCodes.FIELD_MISSING
                        break
                    }
                    var confirmPacket = new Protocol.VirtualChannelLayerPacket(Enums.Proto.NONE_LAYER,
                        Enums.VirtualChannelLayerCommand.CHANNEL_CONFIRM_ACQUIRE, onVChannAcquireEvent.channid,
                        onVChannAcquireEvent.remark)
                    this._vchannMap[onVChannAcquireEvent.channid] = new VirtualChannel(this,
                        onVChannAcquireEvent.channid, onVChannAcquireEvent.remark, onVChannAcquireEvent.callback)
                    this._sendPacket(confirmPacket)
                    // todo: notify invoker vchannel create complete
                    break
                }
            }
            if (vchanPacket.command == Enums.VirtualChannelLayerCommand.CHANNEL_CONFIRM_ACQUIRE) {
                // todo: notify invoker vchannel create complete
                break
            }
            if (vchanPacket.command == Enums.VirtualChannelLayerCommand.CHANNEL_DATA_TRANSMISSION) {
                break
            }
        } while (false)
        // console.log("vchann layer proc ret:", result, "next layer:", nextLayer)
        return nextLayer
    }

    _processBusinessLayer(bizPacket, vchannID) {
        var nextLayer = Enums.Proto.NONE_LAYER
        var result = Enums.ErrorCodes.SUCCEEDED
        do {
            if (!(bizPacket instanceof Protocol.BusinessLayerPacketTemplate)) {
                result = Enums.ErrorCodes.PARAM_INVALID
                break
            }
            if (!this._vchannMap[vchannID]) {
                result = Enums.ErrorCodes.ILLEGAL_VCHANN_ID
                break
            }
            var onVChannDataEvent = new EventArgs.OnVChannelDataEvent(this)
            onVChannDataEvent.channid = vchannID
            onVChannDataEvent.remark = this._vchannMap[vchannID].remark
            onVChannDataEvent.data = bizPacket
            if (this._vchannMap[vchannID].callback) {
                this._vchannMap[vchannID].callback(onVChannDataEvent)
            } else {
                result = Enums.ErrorCodes.EMPTY_VCHANN_CALLBACK
            }
            break
        } while (false)
        // console.log("business layer proc ret:", result, "next layer:", nextLayer)
        return nextLayer
    }

    _onBaseconnRequiring(basePacket) {
        // var basePacket = rgpPacketMap[Enums.ProtoName.BASE_LAYER]
        switch (basePacket.command) {
            case Enums.BaseLayerCommand.CLIENT_ACQUIRE:
                var accept = this.connid && this.connid != invalidConnID
                if (this.onconnectreq) {
                    var onConfirmEvent = new EventArgs.OnConfirmEvent(this)
                    this.onconnectreq(onConfirmEvent)
                    this.connid = onConfirmEvent.connid
                    accept = onConfirmEvent.allow
                }
                if (accept) {
                    this.status = Enums.Status.CONNECTED
                    var rgpBaseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.NONE_LAYER,
                        Enums.BaseLayerCommand.SERVER_CONFIRM, this.connid)
                    this._sendPacket(rgpBaseLayerPacket)
                    console.log("rgp conn confirmed, connid:", this.connid)
                    if (this.onconnected) {
                        var onConnectedEvent = new EventArgs.OnConnectedEvent(this)
                        this.onconnected(onConnectedEvent)
                    }
                } else {
                    this.status = Enums.Status.REJECTED
                    var rgpBaseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.NONE_LAYER,
                        Enums.BaseLayerCommand.SERVER_REJECT, this.connid)
                    this._sendPacket(rgpBaseLayerPacket)
                    console.error("rgp conn denied by server")
                    this.conn.close()
                }
                return Enums.ErrorCodes.SUCCEEDED
            default:
                return Enums.ErrorCodes.UNSUPPORTED_COMMAND
        }
    }

    _onBaseconnConfirmed(basePacket) {
        // var basePacket = rgpPacketMap[Enums.ProtoName.BASE_LAYER]
        switch (basePacket.command) {
            case Enums.BaseLayerCommand.SERVER_CONFIRM:
                this.status = Enums.Status.CONNECTED
                this.connid = basePacket.connectionID
                console.log("rgp conn confirmed, connid:", this.connid)
                if (this.onconnected) {
                    var onConnectedEvent = new EventArgs.OnConnectedEvent(this)
                    this.onconnected(onConnectedEvent)
                }
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

    _setConn(ws, connidPara = invalidConnID) {
        this.conn = ws
        this.conn.binaryType = 'arraybuffer'
        this.connid = connidPara
        this.status = Enums.Status.UNCONFIRMED
        return true
    }

    _sendRaw(arrayBuffer) {
        if (arrayBuffer instanceof Uint8Array) {
            arrayBuffer = arrayBuffer.buffer
        }
        if (!(arrayBuffer instanceof ArrayBuffer)) {
            console.error("data to send not arraybuffer")
            return
        }
        var length = arrayBuffer.byteLength
        console.log("sending", length, "byte long data")
        this.conn.send(arrayBuffer)
    }

    _sendPacket(rgpPacket, vchannid = 0xffffffff) {
        var bufferToSend = null
        if (rgpPacket instanceof Protocol.BaseLayerPacket) {
            bufferToSend = Protocol.ProtocolSerializer.PackBaseLayer(rgpPacket)
            this._sendRaw(bufferToSend)
        } else if (rgpPacket instanceof Protocol.VirtualChannelLayerPacket) {
            var vchannLayerBuffer = Protocol.ProtocolSerializer.PackVirtualChannelLayer(rgpPacket)
            var baseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.VIRTUAL_CHANNEL_LAYER,
                Enums.BaseLayerCommand.DATA_TRANSMISSION, this.connid)
            bufferToSend = Protocol.ProtocolSerializer.PackBaseLayer(baseLayerPacket, vchannLayerBuffer)
            this._sendRaw(bufferToSend)
        } else if (rgpPacket instanceof Protocol.BusinessLayerPacketTemplate) {
            if (!vchannid || vchannid == invalidConnID) {
                console.error("sending illegal biz packet with vchannid:", vchannid)
                return
            }
            var bizLayerBuffer = Protocol.ProtocolSerializer.PackBusinessLogicLayer(rgpPacket)
            var vchannLayerPacket = new Protocol.VirtualChannelLayerPacket(Enums.Proto.BUSINESS_LOGIC_LAYER,
                Enums.VirtualChannelLayerCommand.CHANNEL_DATA_TRANSMISSION, vchannid, "none")
            var vchannLayerBuffer = Protocol.ProtocolSerializer.PackVirtualChannelLayer(vchannLayerPacket, bizLayerBuffer)
            var baseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.VIRTUAL_CHANNEL_LAYER,
                Enums.BaseLayerCommand.DATA_TRANSMISSION, this.connid)
            bufferToSend = Protocol.ProtocolSerializer.PackBaseLayer(baseLayerPacket, vchannLayerBuffer)
            this._sendRaw(bufferToSend)
        } else {
            console.error("sending illegal packet")
            return
        }
    }

    _process(data) {
        if (!(data instanceof ArrayBuffer)) {
            console.error("data received not arraybuffer")
            return
        }
        console.log("received", data.byteLength, "byte long data")
        // console.log("[packet]", Utils.FormatArrayBuffer(data))
        // parse all layers
        var rgpDataPackets = Protocol.ProtocolSerializer.UnpackAllAsMap(data)
        // process data as a flow
        var flowPackets = {}
        var flowCallback = {}
        flowPackets[Enums.Proto.BASE_LAYER] = rgpDataPackets[Enums.ProtoName.BASE_LAYER]
        flowPackets[Enums.Proto.VIRTUAL_CHANNEL_LAYER] = rgpDataPackets[Enums.ProtoName.VIRTUAL_CHANNEL_LAYER]
        flowPackets[Enums.Proto.BUSINESS_LOGIC_LAYER] = rgpDataPackets[Enums.ProtoName.BUSINESS_LOGIC_LAYER]
        flowCallback[Enums.Proto.BASE_LAYER] = this._processBaseLayer.bind(this)
        flowCallback[Enums.Proto.VIRTUAL_CHANNEL_LAYER] = this._processVirtualChannelLayer.bind(this)
        flowCallback[Enums.Proto.BUSINESS_LOGIC_LAYER] = this._processBusinessLayer.bind(this)
        var nextLayer = Enums.Proto.BASE_LAYER
        do {
            if (nextLayer == Enums.Proto.BUSINESS_LOGIC_LAYER) {
                nextLayer = flowCallback[nextLayer](flowPackets[nextLayer],
                    flowPackets[Enums.Proto.VIRTUAL_CHANNEL_LAYER].virtualChannelID)
            } else {
                nextLayer = flowCallback[nextLayer](flowPackets[nextLayer])
            }
        }
        while (nextLayer != Enums.Proto.NONE_LAYER && flowCallback[nextLayer] && flowPackets[nextLayer])
    }
}

module.exports = BaseConnection