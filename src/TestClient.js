const RGPModelClient = require('./RGPModelClient')

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

client.connect("ws://localhost:23333")