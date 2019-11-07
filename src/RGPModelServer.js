const WebSocket = require('ws')

class RGPModelServer {
    constructor() {
        // 回调函数
        // 1. 收到连接请求
        this.onConnectRequest = () => {}
    }

    listen(port) {
        this.wss = new WebSocket.Server({
            port: port
        })

        this.wss.on('connection', function connection(ws) {
            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
            })

            ws.send('msg from server')
        })
    }
}

module.exports = RGPModelServer