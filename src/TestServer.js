const RGPModelServer = require('./RGPModelServer')
const EventArgs = require('./EventArgs')

var server = new RGPModelServer()

server.onconfirm = (onConfirmEvent) => {
    console.log("[user] server on confirm")
    // 默认允许连接、并且自增客户端 ID
    onConfirmEvent.allow = true
    onConfirmEvent.connid = 1234
}

server.onconnected = (onConnectedEvent) => {
    console.log("[user] server on connected:", onConnectedEvent.connid)
}

server.onclose = (onCloseEvent) => {
    console.log("[user] client close conn:", onCloseEvent.connid, "errcode:", onCloseEvent.errorcode)
}

server.onerror = (onErrorEvent) => {
    console.log("[user] error on conn:", onErrorEvent.connid, "errcode:", onErrorEvent.errorcode)
}

server.serve(23333)
