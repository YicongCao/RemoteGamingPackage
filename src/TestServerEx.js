const RGPModelServer = require('./RGPModelServer')
const Protocol = require('./Protocol')

var server = new RGPModelServer()

server.onconfirm = (onConfirmEvent) => {
    console.log("[user] server on confirm")
    // 默认允许连接、并且自增客户端 ID
    onConfirmEvent.allow = true
    onConfirmEvent.connid = 1314
}

server.onconnected = (onConnectedEvent) => {
    console.log("[user] server on connected:", onConnectedEvent.connid)
    // 注册一个虚拟通道
    server.createVirtualChannel(onConnectedEvent.connid, (vchannDataEvent) => {
        // console.log("[user] biz packet data:", vchannDataEvent.data.data)
        var uint8array = vchannDataEvent.data.data
        // turn red
        // for (var i = 0; i < uint8array.length; i += 4) {
        //     uint8array[i + 0] = 255 - uint8array[i + 0];
        //     uint8array[i + 1] = uint8array[i + 1];
        //     uint8array[i + 2] = uint8array[i + 2];
        //     uint8array[i + 3] = uint8array[i + 3];
        // }
        // revert color
        for (var i = 0; i < uint8array.length; i += 4) {
            uint8array[i + 0] = uint8array[i + 0];
            uint8array[i + 1] = uint8array[i + 1];
            uint8array[i + 2] = uint8array[i + 2];
            uint8array[i + 3] = 255 - uint8array[i + 3];
        }
        var bizPacket = new Protocol.BizImageDataPacket(uint8array)
        server.sendViaVirtualChannel(1314, bizPacket, 5678)
    }, 5678, "1B")
    // server.sendViaVirtualChannel(1314, new Protocol.BizOneBytePacket(1), 5678)
}

server.onclose = (onCloseEvent) => {
    console.log("[user] client close conn:", onCloseEvent.connid, "errcode:", onCloseEvent.errorcode)
}

server.onerror = (onErrorEvent) => {
    console.log("[user] error on conn:", onErrorEvent.connid, "errcode:", onErrorEvent.errorcode)
}

server.serve(23333)
