// const Client = require('./RGPModelClient')
// const Server = require('./RGPModelServer')
// var server = new Server()
// server.listen(7667)
// var client = new Client()
// client.connect("ws://localhost:7667")

// Part I 打解包

var Protocol = require('./Protocol')
var Utils = require('./Utils')
// // 1. 逻辑包
// var basePacket = new Protocol.BaseLayerPacket(0x02, 0xee, 0x1234567)
// var baseBuffer = Protocol.ProtocolSerializer.PackBaseLayer(basePacket)
// console.log(JSON.stringify(basePacket, null, 2), '\n\n')
// console.log(Utils.FormatArrayBuffer(baseBuffer), '\n\n')
// var basePacketRe = Protocol.ProtocolSerializer.UnpackBaseLayer(baseBuffer)
// console.log(JSON.stringify(basePacketRe, null, 2), '\n\n')

// 2. 虚拟通道包
// var bizBuffer = new Uint8Array([3])
// var vcPacket = new Protocol.VirtualChannelLayerPacket(0x04, 0xb5, 0x1314, "abc", bizBuffer.length)
// var vcBuffer = Protocol.ProtocolSerializer.PackVirtualChannelLayer(vcPacket, bizBuffer)
// console.log(JSON.stringify(vcPacket, null, 2), '\n\n')
// console.log(Utils.FormatArrayBuffer(vcBuffer), '\n\n')
// var vcPacketRe = Protocol.ProtocolSerializer.UnpackVirtualChannelLayer(vcBuffer)
// console.log(JSON.stringify(vcPacketRe, null, 2), '\n\n')

// 3. 逻辑包 + 虚拟通道包
var bizBuffer = new Uint8Array([3])
console.log(bizBuffer[0])
var vcPacket = new Protocol.VirtualChannelLayerPacket(0x04, 0xb5, 0x1314, "abc", bizBuffer.length)
var vcBuffer = Protocol.ProtocolSerializer.PackVirtualChannelLayer(vcPacket, bizBuffer)
console.log(JSON.stringify(vcPacket, null, 2), '\n\n')
var basePacket = new Protocol.BaseLayerPacket(0x02, 0xee, 0x1234567)
var baseBuffer = Protocol.ProtocolSerializer.PackBaseLayer(basePacket, vcBuffer)
console.log(Utils.FormatArrayBuffer(baseBuffer), '\n\n')
var basePacketRe = Protocol.ProtocolSerializer.UnpackBaseLayer(baseBuffer)
var vcPacketRe = Protocol.ProtocolSerializer.UnpackVirtualChannelLayer(baseBuffer, basePacketRe.length)
console.log(JSON.stringify(vcPacketRe, null, 2), '\n\n')