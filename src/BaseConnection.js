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
        this.onconnectreq = null    // server
        this.onconnected = null     // client
        this.onerror = null
        this.onhung = null
        this.ondata = null
    }

    /**
     * Connect to server
     * @param {string} url target url, e.g. ws://localhost:7667
     */
    connect(url) {
        this.conn = new WebSocket(url)
        this.conn.binaryType = 'arraybuffer'
        this.status = Enums.Status.UNCONNECTED

        this.conn.on('open', function _onopen() {
            this.status = Enums.Status.UNCONFIRMED
            // make base RGP connection
            var rgpBaseLayerPacket = new Protocol.BaseLayerPacket(Enums.Proto.NONE_LAYER, 
                Enums.BaseLayerCommand.CLIENT_ACQUIRE, invalidConnID)
            var rgpBaseLayerBuffer = Protocol.ProtocolSerializer.PackBaseLayer(rgpBaseLayerPacket)
            this._sendraw(rgpBaseLayerBuffer)
        }.bind(this))

        this.conn.on('message', function _onmsg(e) {
            var rgpDataBuffer = e.data
            if (!rgpDataBuffer instanceof ArrayBuffer) {
                console.error("data received not arraybuffer")
                return
            }
            console.log("received", e.data.byteLength, "byte long data")
            // parse all layers
            var rgpDataPackets = Protocol.ProtocolSerializer.UnpackAllAsMap(e.data)
            // process data on conditions
            switch(this.status) {
                case Enums.Status.UNCONFIRMED:
                    if (rgpDataPackets[Enums.ProtoName.BASE_LAYER].command == 
                        Enums.BaseLayerCommand.SERVER_CONFIRM) {
                            this.status = Enums.Status.CONNECTED
                            this.connid = rgpDataPackets[Enums.ProtoName.BASE_LAYER].connectionID
                            console.log("rgp conn confirmed, connid:", this.connid)
                        }
                    else if (rgpDataPackets[Enums.ProtoName.BASE_LAYER].command == 
                        Enums.BaseLayerCommand.SERVER_REJECT) {
                            this.status = Enums.Status.REJECTED
                            console.error("rgp conn denied by server")
                        }
                    else {
                        this.status = Enums.Status.HUNG
                        console.error("illegal command when conn unconfirmed")
                    }
                    break
                default:
                    console.error("match no callbacks")
                    break
            }
        }.bind(this))
    }

    setconn(connPara) {
        if (connPara instanceof WebSocket) {
            console.error("conn para not instance of ws:", connPara)
            return
        }
        this.conn = connPara
    }

    _sendraw(arrayBuffer) {
        if (!arrayBuffer instanceof ArrayBuffer) {
            console.error("data to send not arraybuffer")
            return
        }
        var length = arrayBuffer.byteLength
        console.log("sending", length, "byte long data")
        this.conn.send(arrayBuffer)
    }
}

module.exports = BaseConnection