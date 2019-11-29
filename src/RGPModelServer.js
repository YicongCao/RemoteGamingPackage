const BaseConnection = require('./BaseConnection')
const WebSocket = require('ws')

class RGPModelServer {
    constructor() {
        this.connindex = 0
        this.connpool = []
        // 回调函数
        // 1. 收到连接请求
        this.onConnectRequest = () => {}
    }

    serve(port) {
        this.wss = new WebSocket.Server({
            port: port
        })

        this.wss.on('connection', function connection(ws) {
            var client = new BaseConnection()
            client.confirm(ws, ++this.connindex)
        }.bind(this))
    }
}

module.exports = RGPModelServer