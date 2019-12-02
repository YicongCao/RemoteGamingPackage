const RGPModelClient = require('./RGPModelClient')
const Protocol = require('./Protocol')

var client = new RGPModelClient()
client.onconnected = (onConnectedEvent) => {
    console.log("[user] client on connected:", onConnectedEvent.connid)
}

client.onclose = (onCloseEvent) => {
    console.log("[user] server close conn:", onCloseEvent.connid, "errcode:", onCloseEvent.errorcode)
}

client.onerror = (onErrorEvent) => {
    console.log("[user] error on conn:", onErrorEvent.connid, "errcode:", onErrorEvent.errorcode)
}

client.onvchann = (onVChannAcquireEvent) => {
    onVChannAcquireEvent.allow = true
    onVChannAcquireEvent.callback = (vchannDataEvent) => {
        console.log("[user] biz packet data:", vchannDataEvent.data.data)
        if (vchannDataEvent.data.data < 100) {
            var bizPacket = new Protocol.BizOneBytePacket(vchannDataEvent.data.data + 1)
            client.sendViaVirtualChannel(bizPacket, 5678)
        }
    }
}

client.connect("ws://localhost:23333")