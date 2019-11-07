const Consts = {
    Status: {
        INVALID:        0,
        UNCONNECTED:    1,
        UNCONFIRMED:    2,
        CONNECTED:      3,
        HUNG:           4,
        REJECTED:       5,
    },
    Proto: {
        NONE_LAYER:             0,
        VERIFY_LAYER:           1,
        VIRTUAL_CHANNEL_LAYER:  2,
        ENCRYPT_LAYER:          3,
        BUSINESS_LOGIC_LAYER:   4,
    },
    BaseLayerCommand: {
        CLIENT_ACQUIRE:     0xaa,
        SERVER_CONFIRM:     0xbb,
        SERVER_REJECT:      0xbc,
        ONE_SIDE_CLOSE:     0xcc,
        OTHER_SIDE_CONFIRM: 0xdd,
        DATA_TRANSMISSION:  0xee,
        HEART_BEAT:         0xff,
    },
    BaseLayerLength:            8,
    VirtualChannelLayerLength:  16,
    VirtualChannelLayerVersion: 1,
    BusinessLogicType: {
        ONE_BYTE_DATA:      "solo",
        RAW_BYTE_DATA:      "raw",
        IMAGE_DATA:         "img",
        CONTROL_DATA:       "ctrl",
    },
}

module.exports = Consts