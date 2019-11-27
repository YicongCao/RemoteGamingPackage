const RGPModelClient = require('./RGPModelClient')

var client = new RGPModelClient()
client.connect("ws://localhost:23333")