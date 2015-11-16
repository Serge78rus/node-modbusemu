//Serial port open

/*
 * 
 * bauds:
 * 
 * 1200
 * 4800
 * 9600
 * 19200
 * 38400
 * 57600
 * 115200
 * 
 * formats:
 * 
 * 8n1 - 8 bits, 1 stop, no parity
 * 8o1 - 8 bits, 1 stop, odd parity
 * 8e1 - 8 bits, 1 stop, even parity
 * 8n2 - 8 bits, 2 stop, no parity
 * 
 */


var fs = require("fs"); 
var exec = require("child_process").exec;

exports.open = function(dev, baud, fmt, done) {
	fs.open(dev, "r+", function(err, fd) {
		if (!err) {
			//console.log("open ok, fd: " + fd);
			exec("stty -F " + dev + " \"" + modestr(baud, fmt) + "\"", function (err, stdout, stderr) {
				if (!err) {
					setTimeout(function() {
						done(null, fd);
					}, 200);
				} else {
					console.error("exec error: " + err);
					done(err);
				}
			});
		} else {
			console.error("open error: " + err);
			done(err);
		}
	});
};

function modestr(baud, fmt) {
	var s = "";
	switch (fmt) {
		case "8n1":	case "8n2":
			break;
		case "8o1":	case "8e1":
			s += "1";
			break;
		default:
			throw Error("invalid format: " + fmt);
	}
	s += "0:0:";
	switch (baud) {
		case 1200:	case 4800:	case 9600:	case 19200:	case 38400:	
			break;
		case 57600:	case 115200:
			s += "1";
			break;
		default:
			throw Error("invalid baud: " + baud);
	}
	switch (fmt) {
		case "8n1":	s += "8b";	break;
		case "8o1":	s += "bb";	break;
		case "8e1":	s += "9b";	break;
		case "8n2":	s += "8f";	break;
	}
	switch (baud) {
		case 1200:		s += "9";	break;
		case 4800:		s += "c";	break;
		case 9600:		s += "d";	break;
		case 19200:		s += "e";	break;
		case 38400:		s += "f";	break;
		case 57600:		s += "1";	break;
		case 115200:	s += "2";	break;
	}
	s += ":0:0:0:0:0:0:1:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0";
	return s;
}