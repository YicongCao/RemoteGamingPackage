const BaseConnection = require('./BaseConnection')
const Enums = require('./Enums')

class GeneralEvent {
    constructor(baseconn) {
        this.conn = baseconn
        this.connid = baseconn.connid
    }
}

class OnConfirmEvent extends GeneralEvent {
    constructor(baseconn) {
        super(baseconn)
        this.allow = false
        this.connid = 0xffffffff
    }
}

class OnConnectedEvent extends GeneralEvent {
    constructor(baseconn) {
        super(baseconn)
    }
}

class OnErrorEvent extends GeneralEvent {
    constructor(baseconn) {
        super(baseconn)
        this.errorcode = Enums.ErrorCodes.SUCCEEDED
    }
}

class OnCloseEvent extends GeneralEvent {
    constructor(baseconn) {
        super(baseconn)
        this.errorcode = Enums.ErrorCodes.SUCCEEDED
    }
}

module.exports = {
    OnConfirmEvent: OnConfirmEvent,
    OnConnectedEvent: OnConnectedEvent,
    OnErrorEvent: OnErrorEvent,
    OnCloseEvent: OnCloseEvent,
}