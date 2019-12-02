const BaseConnection = require('./BaseConnection')
const EventArgs = require('./EventArgs')

class VirtualChannel {
    constructor(baseconn, vchannid, remark, callback) {
        this.baseconn = baseconn
        this.vchannid = vchannid
        this.remark = remark
        this.callback = (onVChannDataEvent) => {
            if (!(onVChannDataEvent instanceof EventArgs.OnVChannelDataEvent)) {
                console.error("event arg not instance of OnVChannelDataEvent")
                return
            }
            callback(onVChannDataEvent)
        }
    }

    send(bizPacket) {
        if (!this.baseconn) {
            console.error("empty baseconn field")
            return
        }
        this.baseconn._sendPacket(bizPacket, this.vchannid)
    }
}

module.exports = VirtualChannel