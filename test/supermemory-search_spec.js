const helper = require("node-red-node-test-helper");
const nock = require("nock");
const configNode = require("../src/supermemory-config.js"); // Updated path
const searchNode = require("../src/supermemory-search.js"); // Updated path

const BASE_URL = "https://v2.api.supermemory.ai";

describe('Supermemory Search Node', function () {

    this.timeout(10000);

    beforeEach(function (done) {
        helper.startServer(function () {
            nock.cleanAll();
            done();
        });
    });

    afterEach(function (done) {
        nock.cleanAll();
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    it('should be loaded', function (done) {
        const flow = [
            { id: "cn1", type: "supermemory-config", name: "Test Config" },
            { id: "n1", type: "supermemory-search", name: "Search Test", config: "cn1", wires: [["h1"]], query: "Test query", queryType: "str" },
            { id: "h1", type: "helper" }
        ];
        helper.load([configNode, searchNode], flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const n1 = helper.getNode("n1");
            try {
                n1.should.have.property('name', 'Search Test');
                n1.should.have.property('configNode');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should call search API with query and default limit', function (done) {
        const flow = [
            { id: "cn1", type: "supermemory-config", name: "Test Config" },
            { id: "n1", type: "supermemory-search", name: "Search Test", config: "cn1", wires: [["h1"]], query: "search this", queryType: "str" },
            { id: "h1", type: "helper" }
        ];

        const mockResponse = { results: [{ documentId: "doc1", score: 0.9 }] };
        const scope = nock(BASE_URL, { reqheaders: { 'x-api-key': 'dummy-key' } })
            .post('/search', { q: "search this", limit: 10 })
            .reply(200, mockResponse);

        helper.load([configNode, searchNode], flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const h1 = helper.getNode("h1");
            const n1 = helper.getNode("n1");

            h1.on("input", function (msg) {
                try {
                    msg.payload.should.deepEqual(mockResponse);
                    scope.done();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            n1.receive({});
        });
    });

    it('should call search API with query and specified limit from message', function (done) {
        const flow = [
            { id: "cn1", type: "supermemory-config", name: "Test Config" },
            { id: "n1", type: "supermemory-search", name: "Search Test", config: "cn1", wires: [["h1"]], query: "search this", queryType: "str", limit: "", limitType: "msg" }, // Limit from msg.limit
            { id: "h1", type: "helper" }
        ];

        const mockResponse = { results: [{ documentId: "doc1", score: 0.9 }] };
        // Expecting limit: 5 in the POST body based on the fix and the received message
        const scope = nock(BASE_URL, { reqheaders: { 'x-api-key': 'dummy-key' } })
            .post('/search', { q: "search this", limit: 5 })
            .reply(200, mockResponse);

        helper.load([configNode, searchNode], flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const h1 = helper.getNode("h1");
            const n1 = helper.getNode("n1");

            h1.on("input", function (msg) {
                try {
                    msg.payload.should.deepEqual(mockResponse);
                    scope.done(); // Check if the mock was called as expected
                    done();
                } catch (err) {
                    done(err);
                }
            });

            // Send message with limit property
            n1.receive({ limit: 5 });
        });
    });

    it('should handle API error on search', function (done) {
        const flow = [
            { id: "cn1", type: "supermemory-config", name: "Test Config" },
            { id: "n1", type: "supermemory-search", name: "Search Test", config: "cn1", wires: [["h1"]], query: "error query", queryType: "str" },
            { id: "h1", type: "helper" }
        ];

        const scope = nock(BASE_URL)
            .post('/search')
            .reply(500, { error: "Internal Server Error", details: "Something went wrong" });

        helper.load([configNode, searchNode], flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const h1 = helper.getNode("h1");
            const n1 = helper.getNode("n1");

            h1.on("input", function (msg) {
                try {
                    msg.payload.should.have.property('error');
                    msg.payload.error.should.containEql('API Error (500)');
                    msg.payload.details.should.have.property('error', 'Internal Server Error');
                    scope.done();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            n1.receive({});
        });
    });
}); 