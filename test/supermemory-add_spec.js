const helper = require("node-red-node-test-helper");
const nock = require("nock");
const configNode = require("../src/supermemory-config.js"); // Updated path
const addNode = require("../src/supermemory-add.js");    // Updated path

const BASE_URL = "https://v2.api.supermemory.ai";

describe('Supermemory Add Node', function () {

    this.timeout(10000);

    beforeEach(function (done) {
        helper.startServer(function () {
            nock.cleanAll(); // Clean nock before each test in this suite
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
            { id: "n1", type: "supermemory-add", name: "Add Test", config: "cn1", wires: [["h1"]], content: "Test content", contentType: "str" },
            { id: "h1", type: "helper" }
        ];
        // Load both config and add nodes
        helper.load([configNode, addNode], flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const n1 = helper.getNode("n1");
            try {
                n1.should.have.property('name', 'Add Test');
                n1.should.have.property('configNode');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should call add API with content', function (done) {
        const flow = [
            { id: "cn1", type: "supermemory-config", name: "Test Config" },
            { id: "n1", type: "supermemory-add", name: "Add Test", config: "cn1", wires: [["h1"]], content: "Test content", contentType: "str" },
            { id: "h1", type: "helper" }
        ];

        const scope = nock(BASE_URL, { reqheaders: { 'x-api-key': 'dummy-key', 'content-type': 'application/json' } })
            .post('/add', { content: "Test content" })
            .reply(200, { id: "mem-123", status: "added" });

        helper.load([configNode, addNode], flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const h1 = helper.getNode("h1");
            const n1 = helper.getNode("n1");

            h1.on("input", function (msg) {
                try {
                    msg.payload.should.have.property('id', 'mem-123');
                    msg.payload.should.have.property('status', 'added');
                    scope.done();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            n1.receive({ payload: "this should be ignored" });
        });
    });

    it('should handle API error on add', function (done) {
        const flow = [
            { id: "cn1", type: "supermemory-config", name: "Test Config" },
            { id: "n1", type: "supermemory-add", name: "Add Test", config: "cn1", wires: [["h1"]], content: "Test content", contentType: "str" },
            { id: "h1", type: "helper" }
        ];

        const scope = nock(BASE_URL)
            .post('/add')
            .reply(401, { error: "Invalid API Key", details: "Check credentials" });

        helper.load([configNode, addNode], flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const h1 = helper.getNode("h1");
            const n1 = helper.getNode("n1");

            h1.on("input", function (msg) {
                try {
                    msg.payload.should.have.property('error');
                    msg.payload.error.should.containEql('API Error (401)');
                    msg.payload.details.should.have.property('error', 'Invalid API Key');
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