const RGPModelClient = require('./src/RGPModelClient')  // RGP 客户端
const RGPModelServer = require('./src/RGPModelServer')  // RGP 服务端
const Protocol = require('./src/Protocol')              // RGP 协议格式

module.exports = {
    RGPModelClient: RGPModelClient,
    RGPModelServer: RGPModelServer,
    Protocol: Protocol,
}