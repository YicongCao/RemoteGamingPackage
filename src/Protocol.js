const Enums = require('./Enums')
const Utils = require('./Utils')
const magic = 0xf55f

/**
 * Base Layer Struct
 */
class BaseLayerPacket {
    /**
     * Constructor of BaseLayerPacket
     * @param {int} siblingProto proto of the next layer
     * @param {int} command command of base connection
     * @param {int} connectionID connection id
     */
    constructor(siblingProto = 0x00, command = 0x00, connectionID = 0xffffffff) {
        this.proto = Math.floor(siblingProto)
        this.command = Math.floor(command)
        this.connectionID = Math.floor(connectionID)
        this.length = Enums.FixedLength.BASE_LAYER
    }
}

/**
 * Virtual Channel Layer Struct
 */
class VirtualChannelLayerPacket {
    /**
     * Constructor of VirtualChannelLayerPacket
     * @param {int} siblingProto proto of the next layer
     * @param {int} command commmand of virtual channel
     * @param {int} virtualChannelID virtual channel id
     * @param {string} remark four letter remark of this channel
     */
    constructor(siblingProto = 0x00, command = 0x00, virtualChannelID = 0xffff, remark = ""){
        this.proto = Math.floor(siblingProto)
        this.command = Math.floor(command)
        this.virtualChannelID = Math.floor(virtualChannelID)
        this.remark = String(remark)
        this.length = Enums.FixedLength.VIRTUAL_CHANNEL_LAYER
    }
}

/**
 * Template of all business packets
 */
class BusinessLayerPacketTemplate {
    constructor(bizLogicType = 0x00, payloadLength = 0x00) {
        this.bizLogic = bizLogicType
        this.payloadLength = payloadLength
    }
}

/**
 * Sample Business Layer Struct
 */
class BizOneBytePacket extends BusinessLayerPacketTemplate{
    /**
     * Constructor of BizOneBytePacket
     * @param {int} onebyteData one byte long sample data, range [0,255)
     */
    constructor(onebyteData = 0x00) {
        super(Enums.BusinessLogicType.ONE_BYTE_DATA, 1)
        this.data = onebyteData
        if (this.data > 255 || this.data < 0) {
            console.warn("data must be truncated to fit in one byte space")
            this.data = onebyteData & 0xff
        }
    }

    serialize() {
        var baseBuffer = new Uint8Array(1)
        baseBuffer[0] = this.data
        return baseBuffer.buffer
    }

    unserialize(arrayBuffer) {
        var baseBuffer = new Uint8Array(arrayBuffer)
        this.data = baseBuffer[0]
        this.payloadLength = baseBuffer.byteLength
    }
}

class BizImageDataPacket extends BusinessLayerPacketTemplate {
    constructor(bytearray = []) {
        var uint8array = new Uint8Array(bytearray)
        super(Enums.BusinessLogicType.IMAGE_DATA, uint8array.byteLength)
        this.data = new Uint8ClampedArray(bytearray)
    }

    serialize() {
        var baseBuffer = new Uint8Array(this.data)
        return baseBuffer.buffer
    }

    unserialize(arrayBuffer) {
        this.data = new Uint8ClampedArray(arrayBuffer)
        this.payloadLength = this.data.length
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
        baseBuffer[1] = ((this.x & 0x0f00) >> 4) + ((this.y & 0x0f00) >> 8)
        baseBuffer[2] = this.y & 0x00ff
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
        this.score = 127
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

/**
 * Pack & Unpack RGP Protocol Bytes, using network order
 */
class ProtocolSerializer {
    /**
     * Unpack bytes into base layer struct
     * @param {ArrayBuffer} arrayBuffer raw bytes of base layer
     * @param {int} offset offset to the start position of base layer
     * @returns {BaseLayerPacket} base layer packet struct
     */
    static UnpackBaseLayer(arrayBuffer, offset = 0) {
        // check object type
        if (!arrayBuffer instanceof ArrayBuffer) {
            console.error("param not instance of ArrayBuffer")
            return null
        }

        // wrap raw arraybuffer with offset 
        var baseLayerBuffer = Utils.WrapArrayBuffer(arrayBuffer, offset, Enums.FixedLength.BASE_LAYER)

        // check magic number
        if (magic != (baseLayerBuffer[0] << 8) + baseLayerBuffer[1]) {
            console.error("magic number mismatch")
            return null
        }
        // fill internal fields
        var baseLayerPacket = new BaseLayerPacket()
        baseLayerPacket.proto = baseLayerBuffer[2]
        baseLayerPacket.command = baseLayerBuffer[3]
        baseLayerPacket.connectionID = (baseLayerBuffer[4] << 24) +
            (baseLayerBuffer[5] << 16) + (baseLayerBuffer[6] << 8) +
            (baseLayerBuffer[7])
        return baseLayerPacket
    }

    /**
     * Pack base layer into bytes
     * @param {BaseLayerPacket} baseLayerPacket base layer packet struct
     * @param {ArrayBuffer} [siblingLayerBuffer] sibling layer to append
     * @returns {ArrayBuffer} raw bytes of base layer
     */
    static PackBaseLayer(baseLayerPacket, siblingLayerBuffer = null) {
        var baseLayerBuffer = new Uint8Array(Enums.FixedLength.BASE_LAYER)
        // check object type
        if (!baseLayerPacket instanceof BaseLayerPacket) {
            console.error("param not instance of BaseLayerPacket")
            return baseLayerBuffer.buffer
        }
        // fill magic number
        baseLayerBuffer[0] = (magic & 0xff00) >> 8
        baseLayerBuffer[1] = (magic & 0x00ff)
        // fill proto & command
        baseLayerBuffer[2] = baseLayerPacket.proto
        baseLayerBuffer[3] = baseLayerPacket.command
        // fill connection id
        baseLayerBuffer[4] = (baseLayerPacket.connectionID & 0xff000000) >> 24
        baseLayerBuffer[5] = (baseLayerPacket.connectionID & 0x00ff0000) >> 16
        baseLayerBuffer[6] = (baseLayerPacket.connectionID & 0x0000ff00) >> 8
        baseLayerBuffer[7] = (baseLayerPacket.connectionID & 0x000000ff)
        if (siblingLayerBuffer != null && (siblingLayerBuffer instanceof ArrayBuffer ||
            siblingLayerBuffer.buffer instanceof ArrayBuffer)) {
            return Utils.ConcatArrayBuffer(baseLayerBuffer.buffer, siblingLayerBuffer)
        } else {
            return baseLayerBuffer.buffer
        }
    }

    /**
     * Unpack bytes into virtual channel struct
     * @param {ArrayBuffer} arrayBuffer raw bytes of virtual channel layer
     * @param {int} offset offset to the start position of virtual channel layer
     * @returns {VirtualChannelLayerPacket} virtual channel packet struct
     */
    static UnpackVirtualChannelLayer(arrayBuffer, offset = 0) {
        // check object type
        if (!arrayBuffer instanceof ArrayBuffer) {
            console.error("param not instance of ArrayBuffer")
            return null
        }
        
        // wrap raw arraybuffer with offset 
        var vChannelLayerBuffer = Utils.WrapArrayBuffer(arrayBuffer, offset)

        // check version
        if (Enums.VirtualChannelLayerVersion != vChannelLayerBuffer[0]) {
            console.error("virtual channel layer version not supported:", vChannelLayerBuffer[0])
            return null
        }
        // fill internal fields
        var vChannelLayerPacket = new VirtualChannelLayerPacket()
        vChannelLayerPacket.proto = vChannelLayerBuffer[2]
        vChannelLayerPacket.command = vChannelLayerBuffer[3]
        vChannelLayerPacket.virtualChannelID = (vChannelLayerBuffer[4] << 8) + vChannelLayerBuffer[5]
        var remarkBuffer = Buffer.allocUnsafe(4)
        remarkBuffer[0] = vChannelLayerBuffer[8]
        remarkBuffer[1] = vChannelLayerBuffer[9]
        remarkBuffer[2] = vChannelLayerBuffer[10]
        remarkBuffer[3] = vChannelLayerBuffer[11]
        vChannelLayerPacket.remark = remarkBuffer.toString('ascii').replace('\u0000','')
        // vChannelLayerPacket.payloadLength = (vChannelLayerBuffer[12] << 24) +
        //     (vChannelLayerBuffer[13] << 16) + (vChannelLayerBuffer[14] << 8) +
        //     (vChannelLayerBuffer[15])
        vChannelLayerPacket.length = Enums.FixedLength.VIRTUAL_CHANNEL_LAYER
        return vChannelLayerPacket
    }

    /**
     * Pack virtual channel layer into bytes
     * @param {BaseLayerPacket} virtualChannelLayerPacket virtual channel packet struct
     * @param {ArrayBuffer} [siblingLayerBuffer] sibling layer to append
     * @returns {ArrayBuffer} raw bytes of virtual channel layer
     */
    static PackVirtualChannelLayer(virtualChannelLayerPacket, siblingLayerBuffer = null) {
        // check object type
        if (!virtualChannelLayerPacket instanceof VirtualChannelLayerPacket) {
            return new Uint8Array(0).buffer
        }
        var vChannelLayerBuffer = new Uint8Array(Enums.FixedLength.VIRTUAL_CHANNEL_LAYER)
        // fill version, fixed length, proto & command
        vChannelLayerBuffer[0] = Enums.VirtualChannelLayerVersion
        vChannelLayerBuffer[1] = Enums.FixedLength.VIRTUAL_CHANNEL_LAYER
        vChannelLayerBuffer[2] = virtualChannelLayerPacket.proto
        vChannelLayerBuffer[3] = virtualChannelLayerPacket.command
        // fill virtual channel & reserved field
        vChannelLayerBuffer[4] = (virtualChannelLayerPacket.virtualChannelID & 0xff00) >> 8
        vChannelLayerBuffer[5] = (virtualChannelLayerPacket.virtualChannelID & 0x00ff)
        vChannelLayerBuffer[6] = 0xff
        vChannelLayerBuffer[7] = 0xff
        // fill remark string
        const remarkBuffer = Buffer.from(String(virtualChannelLayerPacket.remark).slice(0, 4), 'ascii')
        for (var i = 0; i < Math.min(remarkBuffer.length, 4); i++) {
            vChannelLayerBuffer[8 + i] = remarkBuffer[i]
        }
        // append siblings
        if (siblingLayerBuffer != null && (siblingLayerBuffer instanceof ArrayBuffer ||
            siblingLayerBuffer.buffer instanceof ArrayBuffer)) {
            return Utils.ConcatArrayBuffer(vChannelLayerBuffer.buffer, siblingLayerBuffer)
        } else {
            return vChannelLayerBuffer.buffer
        }
    }


    /**
     * Unpack bytes into business struct
     * @param {ArrayBuffer} arrayBuffer raw bytes of business logic layer
     * @param {int} offset offset to the start position of business logic layer
     * @returns {Object} business struct
     */
    static UnpackBusinessLogicLayer(arrayBuffer, offset = 0) {
        // check object type
        if (!arrayBuffer instanceof ArrayBuffer) {
            console.error("param not instance of ArrayBuffer")
            return null
        }
        
        // wrap raw arraybuffer with offset 
        var vBizLayerBuffer = Utils.WrapArrayBuffer(arrayBuffer, offset)

        // retrieve biz type & payload length
        var bizLogicType = (vBizLayerBuffer[0] << 8) + vBizLayerBuffer[1]
        var payloadLength = (vBizLayerBuffer[4] << 24) + (vBizLayerBuffer[5] << 16) +
            (vBizLayerBuffer[6] << 8) + (vBizLayerBuffer[7])
        var payloadBuffer = Utils.WrapArrayBuffer(arrayBuffer, offset + Enums.FixedLength.BUSINESS_HEADER)

        // construct biz logic packet
        switch(bizLogicType) {
            case Enums.BusinessLogicType.ONE_BYTE_DATA:
                var bizOneBytePacket = new BizOneBytePacket()
                bizOneBytePacket.unserialize(payloadBuffer.buffer)
                return bizOneBytePacket
            case Enums.BusinessLogicType.IMAGE_DATA:
                var bizImageDataPacket = new BizImageDataPacket()
                bizImageDataPacket.unserialize(payloadBuffer.buffer)
                return bizImageDataPacket
            case Enums.BusinessLogicType.PONG_POS: 
                var bizPongPosPacket = new BizMousePosPacket()
                bizPongPosPacket.unserialize(payloadBuffer.buffer)
                return bizPongPosPacket
            case Enums.BusinessLogicType.PONG_DRAW:
                var bizDrawRectPacket = new BizDrawRectPacket()
                bizDrawRectPacket.unserialize(payloadBuffer.buffer)
                return bizDrawRectPacket
            default:
                console.error("unknown biz logic type:", bizLogicType)
                return null
        }
    }

    /**
     * Pack business logic layer into bytes
     * @param {Object} businessPacket business struct
     * @returns {ArrayBuffer} raw bytes of business logic layer
     */
    static PackBusinessLogicLayer(businessPacket) {
        var bizLayerBuffer = new Uint8Array(Enums.FixedLength.BUSINESS_HEADER + businessPacket.payloadLength)
        // check object type
        if (!businessPacket instanceof BusinessLayerPacketTemplate) {
            console.error("param not instance of BusinessLayerPacketTemplate")
            return bizLayerBuffer.buffer
        }
        // fill business header
        bizLayerBuffer[0] = (businessPacket.bizLogic & 0xff00) >> 8
        bizLayerBuffer[1] = (businessPacket.bizLogic & 0x00ff)
        // fill reserved
        bizLayerBuffer[2] = 0x00
        bizLayerBuffer[3] = 0x00
        // fill payload length
        bizLayerBuffer[4] = (businessPacket.payloadLength & 0xff000000) >> 24
        bizLayerBuffer[5] = (businessPacket.payloadLength & 0x00ff0000) >> 16
        bizLayerBuffer[6] = (businessPacket.payloadLength & 0x0000ff00) >> 8
        bizLayerBuffer[7] = (businessPacket.payloadLength & 0x000000ff)
        // fill data
        var bizBinaryBuffer = businessPacket.serialize()
        var bizByteBuffer = new Uint8Array(bizBinaryBuffer)
        for (var i = 0; i < Math.min(bizByteBuffer.byteLength, businessPacket.payloadLength); i++) {
            bizLayerBuffer[8 + i] = bizByteBuffer[i]
        }
        return bizLayerBuffer.buffer
    }

    /**
     * Unpack every layer of one RGP packet
     * @param {ArrayBuffer} arrayBuffer raw RGP bytes
     * @returns {Array} representation of RGP packet struct
     */
    static UnpackAll(arrayBuffer) {
        // check object type
        if (!arrayBuffer instanceof ArrayBuffer) {
            console.error("param not instance of ArrayBuffer")
            return null
        }

        // wrap raw arraybuffer with offset 
        // var protocolBuffer = Utils.WrapArrayBuffer(arrayBuffer)
        var layerArray = []
        var previousLayer = null
        var offset = 0
        
        // 1. unpack base layer
        var baseLayerPacket = ProtocolSerializer.UnpackBaseLayer(arrayBuffer, offset)
        offset += baseLayerPacket.length
        if (!baseLayerPacket) {
            console.error("invalid base layer packet")
            return layerArray
        }
        layerArray.push(baseLayerPacket)
        if (baseLayerPacket.proto == Enums.Proto.NONE_LAYER) {
            // no next layer
            return layerArray
        }

        // 2. unpack data verify layer (skip)
        previousLayer = baseLayerPacket 
        if (previousLayer.proto == Enums.Proto.VERIFY_LAYER) {
            // not implemented
            console.warn("verify layer not implemented")
            return layerArray
        }
        // var dataVerifyPacket = ...
        offset += 0
        // layerArray.push(dataVerifyPacket)
        // if (dataVerifyPacket.proto == Enums.Proto.NONE_LAYER) {
        //     // no next layer
        //     return layerArray
        // }

        // 3. unpack virtual channel layer
        previousLayer = previousLayer
        if (previousLayer.proto != Enums.Proto.VIRTUAL_CHANNEL_LAYER) {
            console.error("3rd layer should be virtual channel layer")
            return layerArray
        }
        var virtualChannelPacket = ProtocolSerializer.UnpackVirtualChannelLayer(arrayBuffer, offset)
        offset += virtualChannelPacket.length
        if (!virtualChannelPacket) {
            console.error("invalid virtual channel packet")
            return layerArray
        }
        layerArray.push(virtualChannelPacket)
        if (virtualChannelPacket.proto == Enums.Proto.NONE_LAYER) {
            return layerArray
        }

        // 4. unpack en/decrypt layer (skip)
        previousLayer = virtualChannelPacket
        if (previousLayer.proto == Enums.Proto.ENCRYPT_LAYER) {
            // not implemented
            console.warn("encrypt layer not implemented")
            return layerArray
        }
        // var encryptPacket = ...
        offset += 0
        // layerArray.push(encryptPacket)
        // if (encryptPacket.proto == Enums.Proto.NONE_LAYER) {
        //     // no next layer
        //     return layerArray
        // }

        // 5. unpack business logic layer
        previousLayer = previousLayer
        if (previousLayer.proto != Enums.Proto.BUSINESS_LOGIC_LAYER) {
            console.error("5th layer should be business logic layer")
            return layerArray
        }
        var bizPacket = ProtocolSerializer.UnpackBusinessLogicLayer(arrayBuffer, offset)
        offset += bizPacket.length
        if (!bizPacket) {
            console.error("invalid business logic packet")
            return layerArray
        }
        layerArray.push(bizPacket)
        // no next layer
        return layerArray
    }

    /**
     * Unpack every layer of one RGP packet
     * @param {ArrayBuffer} arrayBuffer raw RGP bytes
     * @returns {Map} representation of RGP packet struct
     */
    static UnpackAllAsMap(arrayBuffer) {
        var layerArray = ProtocolSerializer.UnpackAll(arrayBuffer)
        var layerMap = {}
        layerArray.forEach((layer)=>{
            if (layer instanceof BaseLayerPacket) {
                layerMap[Enums.ProtoName.BASE_LAYER] = layer
            } else if (layer instanceof VirtualChannelLayerPacket) {
                layerMap[Enums.ProtoName.VIRTUAL_CHANNEL_LAYER] = layer
            } else if (layer instanceof BusinessLayerPacketTemplate) {
                layerMap[Enums.ProtoName.BUSINESS_LOGIC_LAYER] = layer
            } else {
                layerMap[Enums.ProtoName.NONE_LAYER] = layer
            }
        })
        return layerMap
    }
}


module.exports = {
    ProtocolSerializer: ProtocolSerializer,
    BaseLayerPacket: BaseLayerPacket,
    VirtualChannelLayerPacket: VirtualChannelLayerPacket,
    BusinessLayerPacketTemplate: BusinessLayerPacketTemplate,
    BizOneBytePacket: BizOneBytePacket,
    BizImageDataPacket: BizImageDataPacket,
    BizMousePosPacket: BizMousePosPacket,
    BizDrawRectPacket: BizDrawRectPacket,
}