const Consts = {
    Status: {
        INVALID:        0,
        UNCONFIRMED:    1,
        CONNECTED:      2,
        HUNG:           3,
        REJECTED:       4,
        CLOSED:         5,
    },
    Proto: {
        NONE_LAYER:             0,
        BASE_LAYER:             0,
        VERIFY_LAYER:           1,
        VIRTUAL_CHANNEL_LAYER:  2,
        ENCRYPT_LAYER:          3,
        BUSINESS_LOGIC_LAYER:   4,
    },
    ProtoName: {
        NONE_LAYER:             "invalid_layer",
        BASE_LAYER:             "base_layer",
        VERIFY_LAYER:           "verify_layer",
        VIRTUAL_CHANNEL_LAYER:  "virtual_channel_layer",
        ENCRYPT_LAYER:          "encrypt_layer",
        BUSINESS_LOGIC_LAYER:   "business_logic_layer",
    }
    ,
    BaseLayerCommand: {
        CLIENT_ACQUIRE:     0xaa,
        SERVER_CONFIRM:     0xbb,
        SERVER_REJECT:      0xbc,
        ONE_SIDE_CLOSE:     0xcc,
        OTHER_SIDE_CONFIRM: 0xdd,
        DATA_TRANSMISSION:  0xee,
        HEART_BEAT:         0xff,
    },
    FixedLength: {
        BASE_LAYER:             8,
        VERIFY_LAYER:           4,
        ENCRYPT_LAYER:          0,
        VIRTUAL_CHANNEL_LAYER:  12,
        BUSINESS_HEADER:        8,
    },
    VirtualChannelLayerVersion: 1,
    BusinessLogicRemark: {
        ONE_BYTE_DATA:      "solo",
        RAW_BYTE_DATA:      "raw",
        IMAGE_DATA:         "img",
        CONTROL_DATA:       "ctrl",
    },
    BusinessLogicType: {
        ONE_BYTE_DATA:      1,
        RAW_BYTE_DATA:      2,
        IMAGE_DATA:         3,
        CONTROL_DATA:       4,
    },
    ErrorCodes: {
        SUCCEEDED:                  0,
        UNSUPPORTED_COMMAND:        1,
        SERVER_REJECTED:            2,
    }
}

module.exports = Consts