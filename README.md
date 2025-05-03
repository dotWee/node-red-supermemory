# @dotwee/node-red-supermemory

[![NPM version](https://badge.fury.io/js/node-red-contrib-supermemory.svg)](https://badge.fury.io/js/node-red-contrib-supermemory)
[![Downloads](https://img.shields.io/npm/dm/node-red-contrib-supermemory.svg)](https://www.npmjs.com/package/node-red-contrib-supermemory)

A collection of [Node-RED](https://nodered.org) nodes to interact with the [Supermemory.ai](https://supermemory.ai/) API (see OpenAPI docs [here](https://raw.githubusercontent.com/supermemoryai/supermemory/refs/heads/main/apps/docs/openapi.json)).

Supermemory is the Memory API for the AI era, allowing you to store, search, and manage information efficiently.

## Install

Run the following command in your Node-RED user directory (typically `~/.node-red`):

```bash
npm install @dotwee/node-red-supermemory
```

Alternatively, search for `@dotwee/node-red-supermemory` in the Node-RED Palette manager.

## Prerequisites

1. **Node-RED:** Ensure you have a working Node-RED installation.
2. **Supermemory Account:** Sign up at [dev.supermemory.ai](https://dev.supermemory.ai) to get an API key.

## Nodes

This package currently provides the following nodes:

### Configuration Node

* **Supermemory Config (`supermemory-config`)**: Configures the connection to the Supermemory API.
  * **API Key (Required):** Your secret API key from [dev.supermemory.ai](https://dev.supermemory.ai).
  * **Base URL (Optional):** Defaults to `https://v2.api.supermemory.ai`. Change this only if you are self-hosting Supermemory.

### Functional Nodes

* **Add Memory (`supermemory-add`)**: Adds new content to your Supermemory.
  * **Config:** Link to your `supermemory-config` node.
  * **Content (Required):** The text content of the memory.
  * **Metadata (Optional):** A JSON object of key-value pairs (string, number, boolean) to associate with the memory.
  * **Space IDs (Optional):** A string or array of strings specifying which space(s) to add the memory to.
  * **Memory ID (Optional):** A custom string ID for the memory. Supermemory generates one if omitted.
  * **Summarize (Optional):** Boolean flag to request summarization during ingestion.
  * **Output:** `msg.payload` contains the API response (`{ id, status }`) on success or an error object on failure.

* **Search Memories (`supermemory-search`)**: Searches your memories based on a query.
  * **Config:** Link to your `supermemory-config` node.
  * **Query (Required):** The search query string.
  * **Limit (Optional):** Maximum number of results to return (default: 10).
  * **Filters (Optional):** A JSON object for metadata-based filtering (refer to [Supermemory API docs](https://docs.supermemory.ai/api-reference) for format).
  * **Categories (Optional):** A string or array of strings to filter results by category ID(s).
  * **Output:** `msg.payload` contains the API response (`{ results: [...] }`) on success or an error object on failure.

*(Note: Nodes for Update, Delete, and Fast Search may be added in future versions based on the OpenAPI spec.)*

## Usage Example

Here's a simple example flow to add a memory and then search for it:

```json
[{"id":"config","type":"supermemory-config","name":"My Supermemory Key","credentials":{"apiKey":"YOUR_API_KEY_HERE"}},{"id":"addNode","type":"supermemory-add","name":"Add Note","config":"config","content":"payload","contentType":"msg","metadata":"","metadataType":"str","spaceIds":"","spaceIdsType":"str","summarize":false,"memoryId":"","memoryIdType":"str","wires":[["searchNode"]]},{"id":"injectAdd","type":"inject","name":"Add \"Hello Supermemory\"","props":[{"p":"payload","v":"Hello Supermemory","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"Hello Supermemory","payloadType":"str","x":160,"y":100,"wires":[["addNode"]]},{"id":"searchNode","type":"supermemory-search","name":"Search for \"Hello\"","config":"config","query":"Hello","queryType":"str","limit":"10","limitType":"num","filters":"","filtersType":"str","categoriesFilter":"","categoriesFilterType":"str","wires":[["debugNode"]]},{"id":"debugNode","type":"debug","name":"Search Result","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":560,"y":100,"wires":[]}]
```

**To use this example:**

1. Copy the JSON above.
2. In Node-RED, click the menu (☰) > Import > Clipboard.
3. Paste the JSON and click "Import".
4. Double-click the "My Supermemory Key" configuration node and enter your actual API Key.
5. Deploy the flow.
6. Click the inject button on the "Add \"Hello Supermemory\"" node.
7. Check the Debug sidebar to see the search results for "Hello".

## Contributing

Contributions, bug reports, and feature requests are welcome! Please open an issue or pull request on the [GitHub repository](https://github.com/dotWee/node-red-contrib-supermemory).

## License

Copyright (C) 2025 [Lukas 'dotWee' Wolfsteiner](https://lukas.wolfsteiner.media?ref=node-red-contrib-supermemory)

Licensed under the _Do What The Fuck You Want To_ public license (see [LICENSE](./LICENSE) file).
