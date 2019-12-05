const Enums = require('./Enums')

class BusinessLayerPacketTemplate {
    constructor(bizLogicType = 0x00, payloadLength = 0x00) {
        this.bizLogic = bizLogicType
        this.payloadLength = payloadLength
    }
}

class BizMousePosPacket extends BusinessLayerPacketTemplate {
    constructor(x = 0, y = 0) {
        super(Enums.BusinessLogicType.PONG_POS, 3)
        this.x = x
        this.y = y
    }

    serialize() {
        var baseBuffer = new Uint8Array(3)
        baseBuffer[0] = this.x & 0x00ff
        baseBuffer[2] = this.y & 0x00ff
        baseBuffer[1] = ((this.x & 0x0f00) >> 4) + ((this.y & 0x0f00) >> 8)
        return baseBuffer
    }

    unserialize(arrayBuffer) {
        var baseBuffer = new Uint8Array(arrayBuffer)
        this.x = baseBuffer[0] + ((baseBuffer[1] & 0xf0) << 4)
        this.y = baseBuffer[2] + ((baseBuffer[1] & 0x0f) << 8)
    }
}

class BizDrawRectPacket extends BusinessLayerPacketTemplate {
    constructor() {
        super(Enums.BusinessLogicType.PONG_DRAW, 6)
        this.x = 0
        this.y = 0
        this.width = 0
        this.height = 0
        this.score = 0
        this.buffer = 0
    }

    serialize() {
        var baseBuffer = new Uint8Array(6)
        baseBuffer[0] = this.x & 0x00ff
        baseBuffer[1] = ((this.x & 0x0f00) >> 4) + ((this.y & 0x0f00) >> 8)
        baseBuffer[2] = this.y & 0x00ff
        baseBuffer[3] = this.width & 0xff
        baseBuffer[4] = this.height & 0xff
        this.buffer = this.buffer ? 1 : 0
        baseBuffer[5] = (this.buffer << 7) + (this.score & 0x7f)
        return baseBuffer
    }

    unserialize(arrayBuffer) {
        var baseBuffer = new Uint8Array(arrayBuffer)
        this.x = baseBuffer[0] + ((baseBuffer[1] & 0xf0) << 4)
        this.y = baseBuffer[2] + ((baseBuffer[1] & 0x0f) << 8)
        this.width = baseBuffer[3]
        this.height = baseBuffer[4]
        this.score = baseBuffer[5] & 0x7f
        this.buffer = (baseBuffer[5] & 0x80) >> 7
    }
}

// var pos = new BizMousePosPacket(4096, 4097)
// var buf = pos.serialize()
// console.log("pos:", pos.x, pos.y)
// console.log("buf:", buf)
// pos.unserialize(buf)
// console.log("pos:", pos.x, pos.y)

var draw = new BizDrawRectPacket()
draw.x = 4095
draw.y = 256
draw.width = 250
draw.height = 128
draw.score = 100
draw.buffer = 1
var buf = draw.serialize()
console.log("draw:", draw)
console.log("buf:", buf)
draw.unserialize(buf)
console.log("draw:", draw)