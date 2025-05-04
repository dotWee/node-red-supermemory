module.exports = function (RED) {
    function SupermemoryConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.apiKey = this.credentials.apiKey;
        this.baseUrl = config.baseUrl || "https://v2.api.supermemory.ai"; // Default URL
    }
    RED.nodes.registerType("supermemory-config", SupermemoryConfigNode, {
        credentials: {
            apiKey: { type: "password" }
        }
    });
}