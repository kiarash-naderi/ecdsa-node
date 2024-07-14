const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ec } = require('elliptic');
const app = express();
const port = 3000;

const EC = new ec('secp256k1');
const balances = {};

app.use(bodyParser.json());
app.use(cors());

app.post('/generate-key-pair', (req, res) => {
  const keyPair = EC.genKeyPair();
  const privateKey = keyPair.getPrivate('hex');
  const publicKey = keyPair.getPublic('hex');

  balances[publicKey] = 100;

  console.log(`Generated key pair: Private Key: ${privateKey}, Public Key: ${publicKey}`);
  console.log(`Initial balance for ${publicKey}: ${balances[publicKey]}`);

  res.send({ privateKey, publicKey });
});

app.post('/send', (req, res) => {
  const { sender, recipient, amount, signature } = req.body;

  console.log('Received transaction:', { sender, recipient, amount, signature });

  if (!balances[sender]) {
    console.log('Sender does not have an account');
    return res.status(400).send('Sender does not have an account');
  }

  const key = EC.keyFromPublic(sender, 'hex');
  const msgHash = `${sender}${recipient}${amount}`;
  const isValid = key.verify(msgHash, signature);

  if (!isValid) {
    console.log('Invalid signature');
    return res.status(400).send('Invalid signature');
  }

  if (balances[sender] < amount) {
    console.log('Insufficient balance');
    return res.status(400).send('Insufficient balance');
  }

  balances[sender] -= amount;
  if (!balances[recipient]) {
    balances[recipient] = 0;
  }
  balances[recipient] += amount;

  console.log('Transaction successful:', { balances });

  res.send('Transaction successful');
});

app.get('/balance/:address', (req, res) => {
  const address = req.params.address;
  const balance = balances[address] || 0;
  console.log(`Balance for ${address}: ${balance}`);
  res.send({ balance });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
