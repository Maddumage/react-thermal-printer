import React, { useState } from 'react';

const generateReceiptContent = (tokenData) => {
  const { customerId, service } = tokenData;
  const receiptLines = [
    '==============================',
    "       Optician's Store       ",
    '    1234 Eye Care Avenue      ',
    '     Vision City, VC 12345    ',
    '==============================',
    `Date: ${new Date().toLocaleDateString()}`,
    `Time: ${new Date().toLocaleTimeString()}`,
    '==============================',
    'Customer ID: 12345',
    '        Thank you for         ',
    '       choosing us!           ',
    '==============================',
  ];

  // Add the QR code
  const qrCodeValue = `CustomerID:${customerId};Service:${service}`;
  receiptLines.push('Scan for more info:');
  receiptLines.push(qrCodeValue);

  // Join the lines with newline characters
  return receiptLines.join('\n');
};

const BluetoothScanner = () => {
  const [log, setLog] = useState('');

  const connectBluetoothPrinter = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'], // Replace with your printer's service UUID
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('battery_service'); // Replace with your printer's primary service UUID
      const characteristic = await service.getCharacteristic('battery_level'); // Replace with the correct characteristic UUID for writing

      // Sample token data
      const tokenData = {
        customerId: '12345',
        service: 'Eye Examination',
      };

      const receiptContent = generateReceiptContent(tokenData);

      // Convert the receipt content to a Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptContent);

      // Split the data into chunks of 512 bytes or less
      const chunkSize = 216;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await delay(100); // Add a small delay between writes
      }

      setLog('Print successful');
    } catch (error) {
      console.error('Error connecting to printer:', error);
      setLog(`Error: ${error.message}`);
    }
  };

  const scanForBluetoothDevices = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'battery_service'], // Add more common services or your printer's specific service UUID
      });
      setLog(`Connected to device: ${device.name}`);

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      console.log('services => ', services);
      let logContent = 'Services:\n';
      for (const service of services) {
        logContent += `Service: ${service.uuid}\n`;
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
          logContent += `  Characteristic: ${characteristic.uuid}\n`;
          console.log('characteristic => ', characteristic);
        }
      }
      setLog(logContent);
    } catch (error) {
      console.error('Error:', error);
      setLog(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={connectBluetoothPrinter}>
        Scan for Bluetooth Devices
      </button>
      <pre>{log}</pre>
    </div>
  );
};

export default BluetoothScanner;
