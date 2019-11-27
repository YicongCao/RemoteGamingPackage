const BaseConnection = require('./BaseConnection')

class RGPModelClient {
    constructor() {
        this.conn = new BaseConnection()
        // 回调函数
        // 1. 连接时
        this.onConnected = () => { }
        this.onError = () => { }
    }

    connect(url) {
        this.conn.connect(url)
    }
}

module.exports = RGPModelClient