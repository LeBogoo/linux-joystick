const fs = require('fs');
const EventEmitter = require('events');

const eventTypes = {
    1: "button_changed",
    2: "axis_changed",
    129: "button_init",
    130: "axis_init",
}

class JoystickDevice extends EventEmitter {

    /**
     * 
     * @param {string} path Device file path (normally found  at /dev/input/js*)
     */
    constructor(path) {
        super();

        this.path = path;
        this.rs = fs.createReadStream(path);
        this.start();
    }

    parse(buffer) {
        const event = {
            time: buffer.readUInt32LE(),
            value: (buffer.readUint8(6) == 1) ? buffer.readInt8(4) : buffer.readInt16BE(5), // If type == button_change then only parse 1 byte instead of 2.
            type: eventTypes[buffer.readUint8(6)],
            number: buffer.readUint8(7),
        }

        this.emit(event.type, event);

        switch (event.type) {
            case 'button_changed':
                if (event.value) this.emit('button_pressed', event);
                else this.emit('button_released', event);
                break;

            default:
                break;
        }

    }

    start() {
        this.rs.on('readable', () => {
            let data;
            while ((data = this.rs.read(8)) !== null) this.parse(data);
        })
    }
}

/**
 * 
 * @param {string} path Path to input device files. Default: /dev/input/
 * @returns string[] of all joysticks/gamepads.
 */
function listDevices(path = "/dev/input/") { return fs.readdirSync(path).filter(dev => dev.startsWith("js")).map(dev => path + dev); }

module.exports = { JoystickDevice, listDevices }
