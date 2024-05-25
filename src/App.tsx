import { useEffect, useRef, useState } from 'react';
// import QRCode from 'qrcode.react';
import QRCode from 'qrcode';

import './App.css';
import { PrintReceipt } from './components';
import { PrinterService } from './printer/printerService';

const getBitmapFromUrl = (url: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
};

const convertBitmapToPrinterFormat = (bitmap: {
  width: any;
  height: any;
  data: any;
}) => {
  const width = bitmap.width;
  const height = bitmap.height;
  const imageData = bitmap.data;
  const threshold = 128; // Threshold for binary conversion

  const bytesPerLine = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerLine * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = imageData[index];
      const g = imageData[index + 1];
      const b = imageData[index + 2];
      const avg = (r + g + b) / 3;

      if (avg < threshold) {
        const byteIndex = y * bytesPerLine + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        data[byteIndex] |= 1 << bitIndex;
      }
    }
  }

  // ESC/POS command to print the image
  const escPosImageHeader = new Uint8Array([
    0x1d,
    0x76,
    0x30,
    0x00,
    bytesPerLine & 0xff,
    (bytesPerLine >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
  ]);

  const spaces = '\n\n\n';
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(spaces);

  return new Uint8Array([...escPosImageHeader, ...data, ...encodedText]);
};

const generateReceiptContent = (tokenData: {
  customerId: any;
  service: any;
}): Uint8Array => {
  const { customerId, service } = tokenData;

  const initialLine = '================================\n';
  const titleLines = "        Optician's Store        \n";
  const bodyLines = [
    '     1234 Eye Care Avenue       ',
    '      Vision City, VC 12345     ',
    '================================',
    `Date: ${new Date().toLocaleDateString()} Time: ${new Date().toLocaleTimeString()}`,
    '--------------------------------',
  ];

  const endLines =
    '   Thank you for choosing us!   \n================================';

  // Join the lines with newline characters
  const receiptLines = bodyLines.join('\n');

  const encoder = new TextEncoder();
  const encodedInitialLineText = encoder.encode(initialLine);
  const encodedTitleLineText = encoder.encode(titleLines);
  const encodedReceiptLineText = encoder.encode(receiptLines);
  const encodedEndLineText = encoder.encode(endLines);
  // ESC/POS command to align text to the center (optional, depends on your printer)
  const escPosCenter = new Uint8Array([0x1b, 0x61, 0x01]);

  // ESC/POS command to 2x font size
  const escPosFontSize2x = new Uint8Array([0x1b, 0x21, 0x10]);
  // bold font size ==> 0x1B, 0x21, 0x08
  // bold Medium font ===> 0x1b, 0x21, 0x20
  // ESC/POS command to normal font size
  const escPosFontSize1x = new Uint8Array([0x1b, 0x21, 0x03]);

  // Combine ESC/POS command with the text
  return new Uint8Array([
    ...escPosCenter,
    ...encodedInitialLineText,
    ...escPosFontSize2x,
    ...encodedTitleLineText,
    ...escPosFontSize1x,
    ...encodedReceiptLineText,
    ...encodedEndLineText,
  ]);
};

function App() {
  const contentToPrint = useRef(null);
  const [printerData, setPrinterData] = useState<any>();
  const [qrCode, setQrCode] = useState('');

  const tokenData = {
    customerId: '12345',
    service: 'Eye Examination',
  };

  const generateQRCode = async (
    text: string | QRCode.QRCodeSegment[],
    size: any
  ) => {
    try {
      const qrCodeUrl = await QRCode.toDataURL(text, { width: size });
      const bitmap = await getBitmapFromUrl(qrCodeUrl);
      const textData = generateReceiptContent(tokenData);
      const combinedData = combineTextAndImage(textData, bitmap);
      setPrinterData(combinedData);
      setQrCode(qrCodeUrl);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    generateQRCode(tokenData.customerId, 200);
  }, []);

  // const prepareTextData = () => {
  //   const receiptContent = generateReceiptContent(tokenData);
  //   const encoder = new TextEncoder();
  //   const encodedText = encoder.encode(receiptContent); // Add newline
  //   // ESC/POS command to align text to the center (optional, depends on your printer)
  //   const escPosCenter = new Uint8Array([0x1b, 0x61, 0x01]);
  //   // Combine ESC/POS command with the text
  //   return new Uint8Array([...escPosCenter, ...encodedText]);
  // };

  const combineTextAndImage = (textData: ArrayLike<number>, bitmap: any) => {
    const imageData = convertBitmapToPrinterFormat(bitmap);
    const combinedData = new Uint8Array(textData.length + imageData.length);
    combinedData.set(textData, 0);
    combinedData.set(imageData, textData.length);
    console.log('Combined Data:', combinedData);
    return combinedData;
  };

  const connectBluetoothPrinter = async () => {
    try {
      PrinterService.getInstance().connectDevice();
      console.log('Printer connect successful');
    } catch (error) {
      console.error('Error connecting to printer:', error);
    }
  };

  const printToken = async () => {
    try {
      PrinterService.getInstance().printReceipt(printerData);
    } catch (error) {
      console.error('Error connecting to printer:', error);
    }
  };

  return (
    <>
      <PrintReceipt ref={contentToPrint} tokenData={tokenData} />
      // Use this function in your component
      <button onClick={connectBluetoothPrinter}>Connect Device</button>
      <button onClick={printToken}>Print Token</button>
      {/* <BluetoothScanner /> */}
      {printerData && <img src={qrCode} alt="QR Code" />}
    </>
  );
}

export default App;
