class Utils {
    /**
     * Display arraybuffer data as humon friendly format
     * @param {ArrayBuffer} arrayBuffer buffer to format
     */
    static FormatArrayBuffer(arrayBuffer) {
        const byteArray = new Uint8Array(arrayBuffer)
        const hexParts = []
        for (var i = 0; i < byteArray.length; i++) {
            const hex = byteArray[i].toString(16)
            const paddedHex = ('00' + hex).slice(-2)
            hexParts.push(paddedHex)
        }
        return hexParts.join(' ')
    }

    /**
     * Combine arraybuffers
     * @param  {...any} arrayBuffers buffers to concat
     */
    static ConcatArrayBuffer(...arrayBuffers) {
        var combined = new Uint8Array(0)
        for (var i = 0; i < arrayBuffers.length; i++) {
            combined = new Uint8Array([...combined, ...new Uint8Array(arrayBuffers[i])])
        }
        return combined
    }

    /**
     * Wrap arraybuffer with offset
     * @param {ArrayBuffer} arrayBuffer arraybuffer
     * @param {int} offset offset to the beginning
     * @param {int} length length of data to retrieve
     */
    static WrapArrayBuffer(arrayBuffer, offset = 0, length = 0) {
        if (!arrayBuffer || !arrayBuffer.byteLength) {
            return null
        }
        if (offset < 0 || offset > arrayBuffer.byteLength) {
            return null
        }
        length = length == 0 ? arrayBuffer.length - offset : length
        var targetBuffer = new Uint8Array(length)
        var originBuffer = new Uint8Array(arrayBuffer)
        for (var i = 0; i < length; i++) {
            targetBuffer[i] = originBuffer[offset + i]
        }
        return targetBuffer
    }
}

module.exports = Utils