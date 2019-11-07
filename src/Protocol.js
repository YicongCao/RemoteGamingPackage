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
        this.length = Enums.BaseLayerLength
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
     * @param {int} payloadLength length of payload
     */
    constructor(siblingProto = 0x00, command = 0x00, virtualChannelID = 0xffff, 
        remark = "", payloadLength = 0x00){
            this.proto = Math.floor(siblingProto)
            this.command = Math.floor(command)
            this.virtualChannelID = Math.floor(virtualChannelID)
            this.remark = String(remark)
            this.payloadLength = Math.floor(payloadLength)
            this.length = Enums.VirtualChannelLayerLength
    }
}

/**
 * Sample Business Layer Struct
 */
class BusinessLayerSamplePacket {
    /**
     * Constructor of BusinessLayerSamplePacket
     * @param {byte} onebyteData one byte long sample data
     */
    constructor(onebyteData = 0x00) {
        this.data = onebyteData
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
        var baseLayerBuffer = Utils.WrapArrayBuffer(arrayBuffer, offset, Enums.BaseLayerLength)

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
        var baseLayerBuffer = new Uint8Array(Enums.BaseLayerLength)
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
        vChannelLayerPacket.payloadLength = (vChannelLayerBuffer[12] << 24) +
            (vChannelLayerBuffer[13] << 16) + (vChannelLayerBuffer[14] << 8) +
            (vChannelLayerBuffer[15])
        vChannelLayerPacket.length = Enums.VirtualChannelLayerLength
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
        var vChannelLayerBuffer = new Uint8Array(Enums.VirtualChannelLayerLength)
        // fill version, fixed length, proto & command
        vChannelLayerBuffer[0] = Enums.VirtualChannelLayerVersion
        vChannelLayerBuffer[1] = Enums.VirtualChannelLayerLength
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
        // fill payload length
        vChannelLayerBuffer[12] = (siblingLayerBuffer.length & 0xff000000) >> 24
        vChannelLayerBuffer[13] = (siblingLayerBuffer.length & 0x00ff0000) >> 16
        vChannelLayerBuffer[14] = (siblingLayerBuffer.length & 0x0000ff00) >> 8
        vChannelLayerBuffer[15] = (siblingLayerBuffer.length & 0x000000ff)
        // append siblings
        if (siblingLayerBuffer != null && (siblingLayerBuffer instanceof ArrayBuffer ||
            siblingLayerBuffer.buffer instanceof ArrayBuffer)) {
            return Utils.ConcatArrayBuffer(vChannelLayerBuffer.buffer, siblingLayerBuffer)
        } else {
            return vChannelLayerBuffer.buffer
        }
    }

    /**
     * Pack business logic layer into bytes
     * @param {Object} businessPacket business struct
     * @returns {ArrayBuffer} raw bytes of business logic layer
     */
    static PackBusinessLogicLayer(businessPacket) {
        
    }

    /**
     * Unpack bytes into business struct
     * @param {ArrayBuffer} arrayBuffer raw bytes of business logic layer
     * @param {int} offset offset to the start position of business logic layer
     * @returns {Object} business struct
     */
    static UnpackBusinessLogicLayer(arrayBuffer, offset = 0) {

    }

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
        
        // 1. unpack base layer
        var baseLayerPacket = ProtocolSerializer.UnpackBaseLayer(arrayBuffer, 0)
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
        var virtualChannelPacket = ProtocolSerializer.UnpackVirtualChannelLayer(arrayBuffer, previousLayer.length)
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
        // var bizPacket = ...
        // layerArray.push(bizPacket)
        return layerArray
    }
}


module.exports = {
    ProtocolSerializer: ProtocolSerializer,
    BaseLayerPacket: BaseLayerPacket,
    VirtualChannelLayerPacket: VirtualChannelLayerPacket,
}