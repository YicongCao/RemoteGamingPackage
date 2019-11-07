const WebSocket = require('ws')

class RGPModelClient {
    constructor() {
        // 回调函数
        // 1. 连接时
        this.onConnected = () => { }
        this.onError = () => { }
    }

    connect(url) {
        this.wsc = new WebSocket(url)

        this.wsc.on('open', function open() {
            this.wsc.send('msg from client')
        }.bind(this))

        this.wsc.on('message', function incoming(data) {
            console.log(data)
        }.bind(this))
    }


}

module.exports = RGPModelClient