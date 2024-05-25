// PrintReceipt.js
import React from 'react';
import QRCode from 'qrcode.react';

const PrintReceipt = React.forwardRef(({ tokenData }, ref) => (
  <div ref={ref}>
    <h2>Customer Token</h2>
    <QRCode
      value={`CustomerID:${tokenData.customerId};Service:${tokenData.service}`}
    />
    <p>Customer ID: {tokenData.customerId}</p>
    <p>Service: {tokenData.service}</p>
  </div>
));

export default PrintReceipt;
