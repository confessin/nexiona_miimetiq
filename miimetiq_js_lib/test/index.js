var should = require('chai').should(),
    miimetiq_js_lib = require('../index'),
    setOptions = miimetiq_js_lib.setOptions,
    startListening = miimetiq_js_lib.startListening;


describe('#setOptions', function() {
    it('returns null if no options.', function() {
        (setOptions(null) == null).should.be.true;
    });
    it('returns true if options.', function() {
        setOptions({"MODEL": "foo"}).should.equal(true);
    });
});
