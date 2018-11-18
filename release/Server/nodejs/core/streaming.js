var dgram = require("dgram");
var util = require('util');
var colors = require('colors');
var core = require('../core');

module.exports.start = function(){
	var stream_srv = dgram.createSocket('udp4');

	stream_srv.on('listening', function () {
	    var address = stream_srv.address();
	    util.log(("UDP Stream Server listening on "+ address.address +":"+address.port).cyan);
	});

	stream_srv.on('message', function (message, remote) {
	    try
	    {
	    	global.ws_stream.send(message);
	    }
	    catch(ex)
	    {}
	});

	stream_srv.bind(core.config.STREAM_PORT, core.config.SOCK_SRV);
}