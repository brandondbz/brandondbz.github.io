class BLEHandler {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristics = new Map();
    }

    async Avail() {
        try {
            if (!navigator.bluetooth) return false;
            // Quick probe to ensure availability (throws on iOS)
            await navigator.bluetooth.getAvailability();
            return true;
        } catch (e) {
            console.warn("Web Bluetooth not available:", e);
            return false;
        }
    }

    async connect(filterUUIDs) {
        try {
            let options = {};
            if (filterUUIDs !== null) {
                options = {
                    filters: filterUUIDs.map(uuid => ({ services: [uuid] }))
                };

            this.device = await navigator.bluetooth.requestDevice(options);
            this.server = await this.device.gatt.connect();
            // Preload characteristics for known services
            for (const uuid of filterUUIDs) {
                const service = await this.server.getPrimaryService(uuid);
                const characteristics = await service.getCharacteristics();
                characteristics.forEach(char => {
                    const key = `${uuid}_${char.uuid}`;
                    this.characteristics.set(key, char);
                });
                }
            } else { //useless, never backport (but fine to test BLE is working)
                options = {
                    acceptAllDevices: true
                }
                this.device = await navigator.bluetooth.requestDevice(options);
                this.server = await this.device.gatt.connect();
            }
            return true;
        } catch (e) {
            console.error("Connection failed:", e);
            return false;
        }
    }
    async disconnect() {
        if (this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
    }
    async write(serviceUUID, charUUID, data) {
        try {
            const key = `${serviceUUID}_${charUUID}`;
            const characteristic = this.characteristics.get(key);
            if (!characteristic) throw new Error("Characteristic not found");
            await characteristic.writeValue(data);
            return true;
        } catch (e) {
            console.error("Write failed:", e);
            return false;
        }
    }

    async read(serviceUUID, charUUID) {
        try {
            const key = `${serviceUUID}_${charUUID}`;
            const characteristic = this.characteristics.get(key);
            if (!characteristic) throw new Error("Characteristic not found");
            const value = await characteristic.readValue();
            return value.buffer;
        } catch (e) {
            console.error("Read failed:", e);
            return null;
        }
    }
}
window.BLEInstance = async function () {
        console.log("Create inst");
        BLEHand = new BLEHandler();
        return BLEHand;
    
}
window.BLEAvail = async function () {
    console.log("Is there a problem with console");
    let binst = await window.BLEInstance();
    console.log(binst);
    if (await binst.Avail()) {
        return true;
    } else {
        return false;
    }
}