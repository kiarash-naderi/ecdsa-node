import React, { useState } from 'react';
import axios from 'axios';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

const App = () => {
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);

  const generateKeyPair = async () => {
    try {
      const response = await axios.post('http://localhost:3000/generate-key-pair');
      const { privateKey, publicKey } = response.data;
      setPrivateKey(privateKey);
      setPublicKey(publicKey);
      console.log(`Generated key pair: Private Key: ${privateKey}, Public Key: ${publicKey}`);
      getBalance(publicKey); // به‌روزرسانی موجودی بعد از تولید کلید
    } catch (error) {
      console.error('Error generating key pair:', error);
    }
  };

  const getBalance = async (key = publicKey) => {
    try {
      const response = await axios.get(`http://localhost:3000/balance/${key}`);
      console.log('Balance response:', response.data);
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const sendTransaction = async () => {
    if (!recipient.trim()) {
      console.error('Recipient is empty');
      return;
    }

    const keyPair = ec.keyFromPrivate(privateKey);
    const msgHash = `${publicKey}${recipient}${amount}`;
    const signature = keyPair.sign(msgHash).toDER('hex');

    console.log('Sending transaction:', {
      sender: publicKey,
      recipient: recipient.trim(),
      amount: parseInt(amount, 10),
      signature,
    });

    try {
      const response = await axios.post('http://localhost:3000/send', {
        sender: publicKey,
        recipient: recipient.trim(),
        amount: parseInt(amount, 10),
        signature,
      });
      console.log('Transaction sent successfully', response.data);
      getBalance(); // به‌روزرسانی موجودی بعد از ارسال تراکنش
    } catch (error) {
      console.error('Error sending transaction:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div>
      <h1>ECDSA Node</h1>
      <button onClick={generateKeyPair}>Generate Key Pair</button>
      <div>
        <p>Private Key: {privateKey}</p>
        <p>Public Key: {publicKey}</p>
      </div>
      <div>
        <button onClick={() => getBalance(publicKey)}>Get Balance</button>
        <p>Balance: {balance}</p>
      </div>
      <div>
        <h2>Send Transaction</h2>
        <input
          type="text"
          placeholder="Recipient Public Key"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={sendTransaction}>Send</button>
      </div>
    </div>
  );
};

export default App;
