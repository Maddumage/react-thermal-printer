export class PrinterService {
  private static instance: PrinterService;
  private device: BluetoothRemoteGATTCharacteristic | undefined;

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {}

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }

    return PrinterService.instance;
  }

  public async connectDevice() {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });
      const server = await device?.gatt?.connect();
      const services = await server?.getPrimaryServices();
      if (services) {
        const primaryService: BluetoothRemoteGATTService = services[0];
        const characteristics = await primaryService?.getCharacteristics();
        if (characteristics) {
          characteristics.forEach((characteristic) => {
            if (
              characteristic.properties.write &&
              characteristic.service.isPrimary
            ) {
              this.device = characteristic;
              console.log('Printer connect successful');
            }
          });
        }
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
    }
  }

  public async disconnectDevice() {
    try {
      console.log('Printer connect successful');
    } catch (error) {
      console.error('Error connecting to printer:', error);
    }
  }

  public async printReceipt(data: Uint8Array) {
    try {
      if (this.device) {
        // Split the data into chunks of 512 bytes or less
        const chunkSize = 512;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          await this.device?.writeValue(chunk);
        }
        console.log('Print successful');
      } else {
        console.log('Printer not available');
        await this.connectDevice();
        if (this.device) {
          this.printReceipt(data);
        }
      }
    } catch (error) {
      console.error('Error on printing:', error);
    }
  }
}
