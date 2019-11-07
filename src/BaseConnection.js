const Enums = require('./Enums')
const WebSocket = require('ws')

class BaseConnection {
    constructor() {
        // status vars
        this.conn = null
        this.connid = 0xffffffff
        this.status = Enums.Status.UNCONNECTED
        // callbacks
        this.onconnect = null   // server
        this.onconnected = null // client
        this.onerror = null
        this.onhung = null
        this.ondata = null
    }

    /**
     * Connect to server
     * @param {string} url target url, e.g. ws://localhost:7667
     */
    connect(url) {
        this.conn = new WebSocket(url)
        
    }
}

module.exports = BaseConnection