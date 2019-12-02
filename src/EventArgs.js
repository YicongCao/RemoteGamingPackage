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

class OnVChannelAcquireEvent extends GeneralEvent {
    constructor(baseconn) {
        super(baseconn)
        this.allow = false
        this.action = ""
        this.remark = ""
        this.channid = 0xffffffff
        this.callback = null
    }
}

class OnVChannelDataEvent extends GeneralEvent {
    constructor(baseconn) {
        super(baseconn)
        this.channid = 0xffffffff
        this.remark = ""
        this.data = null
    }
}

module.exports = {
    OnConfirmEvent: OnConfirmEvent,
    OnConnectedEvent: OnConnectedEvent,
    OnErrorEvent: OnErrorEvent,
    OnCloseEvent: OnCloseEvent,
    OnVChannelAcquireEvent: OnVChannelAcquireEvent,
    OnVChannelDataEvent: OnVChannelDataEvent,
}