/**
 * http://usejsdoc.org/
 */

var fs = require("fs"); 

var crc = require("./crc16");
var serial = require("./serial");

exports.Emulator = Emulator;

Emulator.prototype.RBUFFSIZE = 256; //max modbus ADU length
Emulator.prototype.ILLEGAL_FUNCTION = 1;
Emulator.prototype.ILLEGAL_DATA_ADDRESS = 2;
Emulator.prototype.ILLEGAL_DATA_VALUE = 3;

Emulator.prototype.options = { //default options value
	baud: 9600, //communication speed
	fmt: "8n2" //data bits, parity and stop bits
}

function Emulator(dev, slave, opt, functions, done) {
	this.slave = slave;
	this.opt = {};
	for (var key in this.options)
		this.opt[key] = opt[key] !== undefined ? opt[key] : this.options[key];
	this.functions = functions;
	var self = this;
	serial.open(dev, this.opt.baud, this.opt.fmt, function(err, fd) {
		if (!err) {
			self.fd = fd;
			self.receive();
			done(null);
		} else {
			console.error("Modbus() error: " + err);
			done(err);
		}
	});
}

Emulator.prototype.receive = function() {
	var self = this, rbuff = new Buffer(self.RBUFFSIZE);
	fs.read(self.fd, rbuff, 0, rbuff.length, null, function(err, cnt, buff) {
		if (!err) {
			if (cnt > 7) {
				//console.log("read cnt=" + cnt);
				buff = buff.slice(0, cnt); //???
				if (buff[0] == self.slave || !buff[0]) {
					if (crc.check(buff)) {
						var addr = buff.readUInt16BE(2), b45 = buff.readUInt16BE(4); 
						//console.log("func: " + buff[1] + " addr: " + addr + " b45: " + b45);
						switch (buff[1]) { //function
							case 0x01: //read coils
								if (buff[0]) { //not broadcast
									self.readCoils(addr, b45);
								}
								break;
							case 0x02: //read discrete inputs
								if (buff[0]) { //not broadcast
									self.readDiscrInps(addr, b45);
								}
								break;
							case 0x03: //read holding registers
								if (buff[0]) { //not broadcast
									self.readHoldRegs(addr, b45);
								}
								break;
							case 0x04: //read input registers
								if (buff[0]) { //not broadcast
									self.readInpRegs(addr, b45);
								}
								break;
							case 0x05: //write single coil
								self.writeCoil(addr, b45, buff[0]);
								break;
							case 0x06: //write single register	
								self.writeReg(addr, b45, buff[0]);
								break;
							case 0x0f: //write multiple coils
								self.writeCoils(addr, b45, buff.slice(7, 7 + buff[6]), buff[0]);
								break;
							case 0x10: //write multiple registers	
								self.writeRegs(addr, b45, buff.slice(7, 7 + buff[6] * 2), buff[0]);
								break;
							default:
								console.log("illegal function: " + buff[1]);
								if (buff[0]) { //not broadcast
									self.sendException(buff[1], self.ILLEGAL_FUNCTION);
								}
						}
					} else {
						console.error("crc error");
					}
				}
			}
		} else {
			console.error("read error: " + err);
		}
		self.receive();
	});
};

Emulator.prototype.readCoils = function(addr, cnt) {
	if (this.functions.readCoils) {
		var data = this.functions.readCoils(addr, cnt);
		if (data) {
			this.sendBits(0x01, data);
		} else {
			this.sendException(0x01, this.ILLEGAL_DATA_ADDRESS);
		}
	} else {
		this.sendException(0x01, this.ILLEGAL_FUNCTION);
	}
};

Emulator.prototype.readDiscrInps = function(addr, cnt) {
	if (this.functions.readDiscrInps) {
		var data = this.functions.readDiscrInps(addr, cnt);
		if (data) {
			this.sendBits(0x02, data);
		} else {
			this.sendException(0x02, this.ILLEGAL_DATA_ADDRESS);
		}
	} else {
		this.sendException(0x02, this.ILLEGAL_FUNCTION);
	}
};

Emulator.prototype.readHoldRegs = function(addr, cnt) {
	if (this.functions.readHoldRegs) {
		var data = this.functions.readHoldRegs(addr, cnt);
		if (data) {
			this.sendWords(0x03, data);
		} else {
			this.sendException(0x03, this.ILLEGAL_DATA_ADDRESS);
		}
	} else {
		this.sendException(0x03, this.ILLEGAL_FUNCTION);
	}
};

Emulator.prototype.readInpRegs = function(addr, cnt) {
	if (this.functions.readInpRegs) {
		var data = this.functions.readInpRegs(addr, cnt);
		if (data) {
			this.sendWords(0x04, data);
		} else {
			this.sendException(0x04, this.ILLEGAL_DATA_ADDRESS);
		}
	} else {
		this.sendException(0x04, this.ILLEGAL_FUNCTION);
	}
};

Emulator.prototype.writeCoil = function(addr, val, enResp) {
	if (this.functions.writeCoils) {
		if (val == 0x0000 || val == 0xff00) {
			if (this.functions.writeCoils(addr, [val ? true : false])) {
				if (enResp) {
					this.sendOK(0x05, addr, val);
				}
			} else if (enResp) {
				this.sendException(0x05, this.ILLEGAL_DATA_ADDRESS);
			}
		} else if (enResp) {
			this.sendException(0x05, this.ILLEGAL_DATA_VALUE);
		}
	} else if (enResp) {
		this.sendException(0x05, this.ILLEGAL_FUNCTION);
	}
};

Emulator.prototype.writeReg = function(addr, val, enResp) {
	if (this.functions.writeRegs) {
		if (this.functions.writeRegs(addr, [val])) {
			if (enResp) {
				this.sendOK(0x06, addr, val);
			}
		} else if (enResp) {
			this.sendException(0x06, this.ILLEGAL_DATA_ADDRESS);
		}
	} else if (enResp) {
		this.sendException(0x06, this.ILLEGAL_FUNCTION);
	}
};

Emulator.prototype.writeCoils = function(addr, cnt, vals, enResp) {
	if (this.functions.writeCoils) {
		var data = [];
		for (var i = 0; i < cnt; ++i) {
			data.push(vals[i >> 3] & (1 << (i & 0x07)) ? true : false);
		}
		if (this.functions.writeCoils(addr, data)) {
			if (enResp) {
				this.sendOK(0x0f, addr, cnt);
			}
		} else if (enResp) {
			this.sendException(0x0f, this.ILLEGAL_DATA_ADDRESS);
		}
	} else if (enResp) {
		this.sendException(0x0f, this.ILLEGAL_FUNCTION);
	}
};

Emulator.prototype.writeRegs = function(addr, cnt, vals, enResp) {
	if (this.functions.writeRegs) {
		var data = [];
		for (var i = 0; i < cnt; ++i) {
			data.push(vals.readUInt16BE(i * 2));
		}
		if (this.functions.writeRegs(addr, data)) {
			if (enResp) {
				this.sendOK(0x10, addr, cnt);
			}
		} else if (enResp) {
			this.sendException(0x10, this.ILLEGAL_DATA_ADDRESS);
		}
	} else if (enResp) {
		this.sendException(0x10, this.ILLEGAL_FUNCTION);
	}
};

Emulator.prototype.sendException = function(func, code) {
	var buff = new Buffer(5);
	buff[0] = this.slave;
	buff[1] = func | 0x80;
	buff[2] = code;
	crc.add(buff);
	fs.write(this.fd, buff, 0, buff.length, null, function(err, cnt, string) {
		if (err) {
			console.error("write error: " + err);
		}
	});
};

Emulator.prototype.sendOK = function(func, addr, val) {
	var buff = new Buffer(8);
	buff[0] = this.slave;
	buff[1] = func;
	buff.writeUInt16BE(addr, 2);
	buff.writeUInt16BE(val, 4);
	crc.add(buff);
	fs.write(this.fd, buff, 0, buff.length, null, function(err, cnt, string) {
		if (err) {
			console.error("write error: " + err);
		}
	});
};

Emulator.prototype.sendBits = function(func, data) {
	var cnt = data.length;
	var bytes = cnt >> 3;
	if (cnt & 0x07)
		++bytes;
	var buff = new Buffer(bytes + 5);
	buff[0] = this.slave;
	buff[1] = func;
	buff[2] = bytes;
	for (var i = 0; i < cnt; ++i) {
		var idx = 3 + (i >> 3);
		if (!(i & 0x07)) {
			buff[idx] = 0;
		}
		if (data[i]) {
			buff[idx] |= 1 << (i & 0x07);
		}
	}
	crc.add(buff);
	fs.write(this.fd, buff, 0, buff.length, null, function(err, cnt, string) {
		if (err) {
			console.error("write error: " + err);
		}
	});
};

Emulator.prototype.sendWords = function(func, data) {
	var cnt = data.length;
	var bytes = cnt * 2;
	var buff = new Buffer(bytes + 5);
	buff[0] = this.slave;
	buff[1] = func;
	buff[2] = bytes;
	for (var i = 0; i < cnt; ++i) {
		buff.writeUInt16BE(data[i], 3 + i * 2);
	}
	crc.add(buff);
	fs.write(this.fd, buff, 0, buff.length, null, function(err, cnt, string) {
		if (err) {
			console.error("write error: " + err);
		}
	});
};
