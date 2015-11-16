/**
 * http://usejsdoc.org/
 */

var Emulator = require("../lib/emulator").Emulator;

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

var emulator = new Emulator("/dev/ttyUSB0", 1, {}, 
		{
			readCoils: function(addr, cnt) {
				if (addr >= data.coils.minaddr && addr + cnt <= data.coils.maxaddr) {
					return data.coils.vals.slice(addr, addr + cnt);
				}
			},
			readDiscrInps: function(addr, cnt) {
				if (addr >= data.discrInps.minaddr && addr + cnt <= data.discrInps.maxaddr) {
					return data.discrInps.vals.slice(addr, addr + cnt);
				}
			},
			readHoldRegs: function(addr, cnt) {
				if (addr >= data.holdRegs.minaddr && addr + cnt <= data.holdRegs.maxaddr) {
					return data.holdRegs.vals.slice(addr, addr + cnt);
				}
			},
			readInpRegs: function(addr, cnt) {
				if (addr >= data.inpRegs.minaddr && addr + cnt <= data.inpRegs.maxaddr) {
					return data.inpRegs.vals.slice(addr, addr + cnt);
				}
			},
			writeCoils: function(addr, vals) {
				var cnt = vals.length;
				if (addr >= data.coils.minaddr && addr + cnt <= data.coils.maxaddr) {
					for (var i = 0; i < cnt; ++i) {
						data.coils.vals[addr + i] = vals[i];
					}
					return true;
				}
			},
			writeRegs: function(addr, vals) {
				var cnt = vals.length;
				if (addr >= data.holdRegs.minaddr && addr + cnt <= data.holdRegs.maxaddr) {
					for (var i = 0; i < cnt; ++i) {
						data.holdRegs.vals[addr + i] = vals[i];
					}
					return true;
				}
			}
		}, function(err) {
	if (err) {
		console.error("Emulator constructor error: " + err);
	}
});


