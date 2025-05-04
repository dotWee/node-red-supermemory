const helper = require("node-red-node-test-helper");
const configNode = require("../src/supermemory-config.js"); // Updated path

const BASE_URL = "https://v2.api.supermemory.ai";

describe('Supermemory Config Node', function () {

    this.timeout(10000);

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    it('should be loaded', function (done) {
        const flow = [{ id: "cn1", type: "supermemory-config", name: "Test Config" }];
        helper.load(configNode, flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const cn1 = helper.getNode("cn1");
            try {
                cn1.should.have.property('name', 'Test Config');
                cn1.should.have.property('apiKey', 'dummy-key');
                cn1.should.have.property('baseUrl', BASE_URL);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should use provided baseUrl', function (done) {
        const customUrl = "http://localhost:8080"
        const flow = [{ id: "cn1", type: "supermemory-config", name: "Test Config", baseUrl: customUrl }];
        helper.load(configNode, flow, { cn1: { apiKey: "dummy-key" } }, function () {
            const cn1 = helper.getNode("cn1");
            try {
                cn1.should.have.property('baseUrl', customUrl);
                done();
            } catch (err) {
                done(err);
            }
        });
    });
}); 