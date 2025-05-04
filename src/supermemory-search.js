const axios = require('axios');

module.exports = function (RED) {
    function SupermemorySearchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.configNode = RED.nodes.getNode(config.config); // Get the config node

        if (!node.configNode || !node.configNode.apiKey) {
            node.error("API Key not configured. Please configure the Supermemory Config node.");
            node.status({ fill: "red", shape: "dot", text: "API Key missing" });
            return;
        }

        node.on('input', async function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            const query = RED.util.evaluateNodeProperty(config.query, config.queryType, node, msg);

            // Evaluate Limit
            let limit = 10; // Default limit
            try {
                // If limitType is 'num', config.limit holds the value directly.
                // Otherwise, config.limit holds the property name/JSONata/etc.
                const limitSource = config.limit || 'limit'; // Default property name to 'limit' if field is empty
                const evaluatedLimit = RED.util.evaluateNodeProperty(limitSource, config.limitType, node, msg);
                const parsedLimit = parseInt(evaluatedLimit);
                if (!isNaN(parsedLimit) && parsedLimit > 0) {
                    limit = parsedLimit;
                } else if (config.limitType === 'num' && !isNaN(parseInt(config.limit))) {
                    // Handle case where type is 'num' but evaluates to NaN (e.g., empty string), use configured default
                    limit = parseInt(config.limit) > 0 ? parseInt(config.limit) : 10;
                }
                // If still NaN or <= 0 after evaluation, it remains the default 10
            } catch (e) {
                node.warn(`Error evaluating limit: ${e.message}. Using default 10.`);
                limit = 10;
            }

            const filters = RED.util.evaluateNodeProperty(config.filters, config.filtersType, node, msg);
            const categoriesFilter = RED.util.evaluateNodeProperty(config.categoriesFilter, config.categoriesFilterType, node, msg);

            if (!query || typeof query !== 'string') {
                node.error("Input 'query' (string) is required.", msg);
                node.status({ fill: "red", shape: "dot", text: "Query required" });
                if (done) { done(); }
                return;
            }

            const url = `${node.configNode.baseUrl}/search`;
            const headers = {
                // Note: Search uses Bearer token according to docs, Add uses x-api-key
                // Assuming x-api-key works for both, or docs need update. Using x-api-key for consistency for now.
                'x-api-key': node.configNode.apiKey,
                'Content-Type': 'application/json'
            };
            const payload = { q: query, limit: limit };
            if (filters) { payload.filters = filters; }
            if (categoriesFilter) { payload.categoriesFilter = Array.isArray(categoriesFilter) ? categoriesFilter : [categoriesFilter]; } // Ensure array

            node.status({ fill: "blue", shape: "dot", text: "Searching..." });

            try {
                const response = await axios.post(url, payload, { headers: headers });
                msg.payload = response.data; // API response {results: [...]}
                node.status({});
                send(msg);
            } catch (error) {
                let errorMsg = "Failed to search memories";
                let errorDetails = error;
                if (error.response) {
                    errorMsg = `API Error (${error.response.status}): ${error.response.data.error || error.message}`;
                    errorDetails = error.response.data;
                    node.error(errorMsg, msg);
                    node.status({ fill: "red", shape: "dot", text: `API Error ${error.response.status}` });
                } else if (error.request) {
                    errorMsg = "No response received from Supermemory API";
                    node.error(errorMsg, msg);
                    node.status({ fill: "red", shape: "dot", text: "No response" });
                } else {
                    errorMsg = `Request setup error: ${error.message}`;
                    node.error(errorMsg, msg);
                    node.status({ fill: "red", shape: "dot", text: "Request error" });
                }
                msg.payload = { error: errorMsg, details: errorDetails };
                send(msg);
            } finally {
                if (done) { done(); }
            }
        });
    }
    RED.nodes.registerType("supermemory-search", SupermemorySearchNode);
} 