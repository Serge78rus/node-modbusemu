# node-modbusrtu

The `modbusemu` package is Node.js module for Modbus RTU devices emulation.

It requires [Node.js](http://nodejs.org/) to run and [npm](https://www.npmjs.org/) to be installed.

This project now supported only GNU/Linux environment and following Modbus functions:
* `0x01` - read coils
* `0x02` - read discrete inputs
* `0x03` - read holding registers
* `0x04` - read input registers
* `0x05` - write single coil
* `0x06` - write single register
* `0x0f` - write multiple coils
* `0x10` - write multiple registers

# Installing

[![NPM](https://nodei.co/npm/modbusemu.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/modbusemu/)
[![NPM](https://nodei.co/npm-dl/modbusemu.png?months=3&height=3)](https://nodei.co/npm/modbusemu/)

* Latest packaged version: `npm install modbusemu`

* Latest version on GitHub: `npm install https://github.com/Serge78rus/node-modbusemu/tarball/master`

# Usage

Example of usage in `test.js`
```javascript
//var Emulator = require("../lib/emulator").Emulator; //relative path from test directory
var Emulator = require("../lib/emulator").Emulator; //if module installed to default location

//emulation data
var data = {
		coils: {
			minaddr: 0,
			maxaddr: 10,
			vals: []
		},
		discrInps: {
			minaddr: 0,
			maxaddr: 10,
			vals: []
		},
		holdRegs: {
			minaddr: 0,
			maxaddr: 10,
			vals: []
		},
		inpRegs: {
			minaddr: 0,
			maxaddr: 10,
			vals: []
		}
}; 

//data init 
for (var i = data.coils.minaddr; i <= data.coils.maxaddr; ++i) {
	data.coils.vals[i] = i & 0x1 ? true : false;
}
for (var i = data.discrInps.minaddr; i <= data.discrInps.maxaddr; ++i) {
	data.discrInps.vals[i] = i & 0x1 ? true : false;
}
for (var i = data.holdRegs.minaddr; i <= data.holdRegs.maxaddr; ++i) {
	data.holdRegs.vals[i] = i;
}
for (var i = data.inpRegs.minaddr; i <= data.inpRegs.maxaddr; ++i) {
	data.inpRegs.vals[i] = i;
}

//start emulation
var emulator = new Emulator(
		"/dev/ttyUSB0", //communication device 
		1, //slave address
		{}, //communication options (default)
		{ //user functions
			readCoils: function(addr, cnt) { //user function for read coils
				if (addr >= data.coils.minaddr && addr + cnt <= data.coils.maxaddr) {
					return data.coils.vals.slice(addr, addr + cnt);
				}
			},
			readDiscrInps: function(addr, cnt) { //user function for read discrete inputs
				if (addr >= data.discrInps.minaddr && addr + cnt <= data.discrInps.maxaddr) {
					return data.discrInps.vals.slice(addr, addr + cnt);
				}
			},
			readHoldRegs: function(addr, cnt) { //user function for read holding registers
				if (addr >= data.holdRegs.minaddr && addr + cnt <= data.holdRegs.maxaddr) {
					return data.holdRegs.vals.slice(addr, addr + cnt);
				}
			},
			readInpRegs: function(addr, cnt) { //user function for read input registers
				if (addr >= data.inpRegs.minaddr && addr + cnt <= data.inpRegs.maxaddr) {
					return data.inpRegs.vals.slice(addr, addr + cnt);
				}
			},
			writeCoils: function(addr, vals) { //user function for write coils
				var cnt = vals.length;
				if (addr >= data.coils.minaddr && addr + cnt <= data.coils.maxaddr) {
					for (var i = 0; i < cnt; ++i) {
						data.coils.vals[addr + i] = vals[i];
					}
					return true;
				}
			},
			writeRegs: function(addr, vals) { //user function for write holding registers
				var cnt = vals.length;
				if (addr >= data.holdRegs.minaddr && addr + cnt <= data.holdRegs.maxaddr) {
					for (var i = 0; i < cnt; ++i) {
						data.holdRegs.vals[addr + i] = vals[i];
					}
					return true;
				}
			}
		}, 
		function(err) { //done callback function
			if (err) {
				console.error("Emulator constructor error: " + err);
			}
		}
);
```

# API

In development

# License

MIT license (see the `LICENSE` file).