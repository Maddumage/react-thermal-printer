import React from 'react';
import QRCode from 'qrcode.react';

const CustomerToken = ({ tokenData }) => {
  const qrValue = `CustomerID:${tokenData.customerId};Service:${tokenData.service}`;

  return (
    <div>
      <h2>Customer Token</h2>
      <QRCode value={qrValue} />
      <p>Customer ID: {tokenData.customerId}</p>
      <p>Service: {tokenData.service}</p>
    </div>
  );
};

export default CustomerToken;
