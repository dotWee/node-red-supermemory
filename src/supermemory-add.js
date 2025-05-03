const axios = require('axios');

module.exports = function(RED) {
    function SupermemoryAddNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.configNode = RED.nodes.getNode(config.config); // Get the config node

        if (!node.configNode || !node.configNode.apiKey) {
            node.error("API Key not configured. Please configure the Supermemory Config node.");
            node.status({fill:"red", shape:"dot", text:"API Key missing"});
            return;
        }

        node.on('input', async function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }; // Node-RED 1.0 compatible send

            const content = RED.util.evaluateNodeProperty(config.content, config.contentType, node, msg);
            const metadata = RED.util.evaluateNodeProperty(config.metadata, config.metadataType, node, msg);
            const spaceIds = RED.util.evaluateNodeProperty(config.spaceIds, config.spaceIdsType, node, msg);
            const summarize = config.summarize;
            const memoryId = RED.util.evaluateNodeProperty(config.memoryId, config.memoryIdType, node, msg);

            if (!content || typeof content !== 'string') {
                node.error("Input 'content' (string) is required.", msg);
                node.status({fill:"red", shape:"dot", text:"Content required"});
                if (done) { done(); }
                return;
            }

            const url = `${node.configNode.baseUrl}/add`;
            const headers = {
                'x-api-key': node.configNode.apiKey,
                'Content-Type': 'application/json'
            };
            const payload = { content };
            if (metadata) { payload.metadata = metadata; }
            if (spaceIds) { payload.spaceIds = Array.isArray(spaceIds) ? spaceIds : [spaceIds]; } // Ensure array
            if (summarize) { payload.summarizeMemories = true; }
            if (memoryId) { payload.id = memoryId; }


            node.status({fill:"blue", shape:"dot", text:"Adding memory..."});

            try {
                const response = await axios.post(url, payload, { headers: headers });
                msg.payload = response.data; // API response {id, status}
                node.status({}); // Clear status on success
                send(msg);
            } catch (error) {
                let errorMsg = "Failed to add memory";
                let errorDetails = error;
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    errorMsg = `API Error (${error.response.status}): ${error.response.data.error || error.message}`;
                    errorDetails = error.response.data;
                    node.error(errorMsg, msg);
                    node.status({fill:"red", shape:"dot", text:`API Error ${error.response.status}`});
                } else if (error.request) {
                    // The request was made but no response was received
                    errorMsg = "No response received from Supermemory API";
                    node.error(errorMsg, msg);
                    node.status({fill:"red", shape:"dot", text:"No response"});
                } else {
                    // Something happened in setting up the request that triggered an Error
                    errorMsg = `Request setup error: ${error.message}`;
                    node.error(errorMsg, msg);
                    node.status({fill:"red", shape:"dot", text:"Request error"});
                }
                msg.payload = { error: errorMsg, details: errorDetails }; // Pass error details in payload
                send(msg); // Send error details on output
            } finally {
                 if (done) { done(); } // Node-RED 1.0 compatible done
            }
        });
    }
    RED.nodes.registerType("supermemory-add", SupermemoryAddNode);
} 