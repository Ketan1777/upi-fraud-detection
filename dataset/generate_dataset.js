import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.join(__dirname, 'transactions.csv');

const BANKS = ['oksbi', 'okhdfcbank', 'okaxis', 'okicici', 'ybl', 'paytm', 'apl'];
const NAMES = [
  'aarav', 'rohit', 'priya', 'ananya', 'vikram', 'rahul', 'sneha', 'amit', 
  'deepak', 'pooja', 'varun', 'kavita', 'manish', 'sunita', 'neha', 'rajesh',
  'aditya', 'shreya', 'suresh', 'kiran', 'alok', 'tanvi', 'tarun', 'meera'
];

const MERCHANTS = [
  'swiggy.pay@icici', 'zomato.order@hdfc', 'amazon.upi@axis', 'flipkart.pay@sbi',
  'uber.india@ybl', 'ola.cabs@paytm', 'zepto.groceries@icici', 'blinkit.retail@hdfc',
  'airtel.bill@sbi', 'jio.recharge@axis', 'cred.club@paytm', 'bigbasket.store@icici'
];

const MULE_ACCOUNTS = [
  'mule.cashout.01@paytm', 'shadow.crypto.ramp@ybl', 'agent.collector.hub@oksbi',
  'fast.exchange.node@okaxis', 'crypto.p2p.clearing@okicici', 'rapid.funnel.fund@ybl'
];

const PAYMENT_METHODS = ['GOOGLE_PAY', 'PHONEPE', 'PAYTM', 'BHIM', 'CRED'];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUpiId(name = null) {
  const chosenName = name || randomChoice(NAMES);
  const handle = randomChoice(BANKS);
  const suffix = randomInt(10, 999);
  return `${chosenName}${suffix}@${handle}`;
}

const users = Array.from({ length: 60 }, () => generateUpiId());
const userAvgAmounts = {};
users.forEach(u => {
  userAvgAmounts[u] = randomInt(400, 3500);
});

let currentTime = new Date(2026, 9, 15, 8, 0, 0);
const rows = [];

rows.push([
  'txn_id', 'sender_upi', 'receiver_upi', 'amount', 'payment_method',
  'category', 'timestamp', 'status', 'risk_score', 'classification',
  'is_flagged', 'fraud_label', 'hour_of_day', 'txns_last_5m',
  'amt_to_avg_ratio', 'is_new_receiver', 'receiver_fan_in_1h',
  'is_emulator', 'seconds_since_last'
].join(','));

for (let i = 1; i <= 1500; i++) {
  const pad = String(i).padStart(4, '0');
  const dStr = currentTime.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const txn_id = `UPI${dStr}${pad}`;

  const roll = Math.random();
  let sender, receiver, amount, category, hour, txns_last_5m, is_new_rcv, fan_in, is_emulator, seconds_last, amt_ratio;
  let fraud_label, risk_score, classification, status, is_flagged;

  if (roll < 0.74) {
    // Normal
    sender = randomChoice(users);
    if (Math.random() < 0.45) {
      receiver = randomChoice(MERCHANTS);
      category = randomChoice(['P2M', 'BILL_PAYMENT', 'E_COMMERCE']);
    } else {
      receiver = randomChoice(users);
      while (receiver === sender) receiver = randomChoice(users);
      category = 'P2P';
    }
    const avg = userAvgAmounts[sender];
    amount = Math.min(15000, Math.max(15, +(randomFloat(0.3 * avg, 1.8 * avg).toFixed(2))));
    hour = randomChoice([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
    txns_last_5m = randomChoice([1, 1, 1, 2]);
    is_new_rcv = Math.random() < 0.25 ? 1 : 0;
    fan_in = randomInt(1, 2);
    is_emulator = 0;
    seconds_last = randomInt(120, 7200);
    amt_ratio = +(amount / avg).toFixed(2);
    fraud_label = 0;
    risk_score = +(randomFloat(4, 25).toFixed(1));
    classification = 'SAFE';
    status = 'COMPLETED';
    is_flagged = false;
  } else if (roll < 0.83) {
    // Velocity spike
    sender = randomChoice(users);
    receiver = randomChoice(users);
    while (receiver === sender) receiver = randomChoice(users);
    amount = +(randomFloat(5000, 18000).toFixed(2));
    hour = randomChoice([10, 14, 16, 19, 21]);
    txns_last_5m = randomInt(5, 9);
    is_new_rcv = 1;
    fan_in = randomInt(1, 3);
    is_emulator = Math.random() < 0.5 ? 1 : 0;
    seconds_last = randomInt(5, 35);
    amt_ratio = +(amount / userAvgAmounts[sender]).toFixed(2);
    category = 'P2P';
    fraud_label = 1;
    risk_score = +(randomFloat(74, 95).toFixed(1));
    classification = 'FRAUDULENT';
    status = 'BLOCKED';
    is_flagged = true;
  } else if (roll < 0.91) {
    // Money mule hub
    sender = randomChoice(users);
    receiver = randomChoice(MULE_ACCOUNTS);
    amount = +(randomFloat(18000, 50000).toFixed(2));
    hour = randomInt(0, 23);
    txns_last_5m = randomInt(1, 3);
    is_new_rcv = 1;
    fan_in = randomInt(6, 15);
    is_emulator = 0;
    seconds_last = randomInt(30, 400);
    amt_ratio = +(amount / userAvgAmounts[sender]).toFixed(2);
    category = 'INVESTMENT';
    fraud_label = 1;
    risk_score = +(randomFloat(78, 98).toFixed(1));
    classification = 'FRAUDULENT';
    status = 'BLOCKED';
    is_flagged = true;
  } else if (roll < 0.96) {
    // High-value anomaly / ATO
    sender = randomChoice(users);
    receiver = randomChoice(users);
    const avg = userAvgAmounts[sender];
    amount = +(randomFloat(48000, 99000).toFixed(2));
    hour = randomChoice([2, 3, 4, 13, 23]);
    txns_last_5m = randomInt(2, 4);
    is_new_rcv = 1;
    fan_in = 1;
    is_emulator = 1;
    seconds_last = randomInt(15, 120);
    amt_ratio = +(amount / avg).toFixed(2);
    category = 'P2P';
    fraud_label = 1;
    risk_score = +(randomFloat(80, 97).toFixed(1));
    classification = 'FRAUDULENT';
    status = 'BLOCKED';
    is_flagged = true;
  } else {
    // Suspicious borderline
    sender = randomChoice(users);
    receiver = randomChoice(users);
    const avg = userAvgAmounts[sender];
    amount = +(randomFloat(12000, 28000).toFixed(2));
    hour = randomChoice([1, 2, 5, 23]);
    txns_last_5m = 3;
    is_new_rcv = 1;
    fan_in = 3;
    is_emulator = 0;
    seconds_last = randomInt(90, 300);
    amt_ratio = +(amount / avg).toFixed(2);
    category = 'P2P';
    fraud_label = 0;
    risk_score = +(randomFloat(38, 68).toFixed(1));
    classification = 'SUSPICIOUS';
    status = 'FLAG_REVIEW';
    is_flagged = true;
  }

  currentTime = new Date(currentTime.getTime() + randomInt(20000, 180000));
  const tsFormatted = `${currentTime.getFullYear()}-${String(currentTime.getMonth()+1).padStart(2,'0')}-${String(currentTime.getDate()).padStart(2,'0')} ${String(hour).padStart(2,'0')}:${String(currentTime.getMinutes()).padStart(2,'0')}:${String(currentTime.getSeconds()).padStart(2,'0')}`;
  const method = randomChoice(PAYMENT_METHODS);

  rows.push([
    txn_id, sender, receiver, amount, method,
    category, `"${tsFormatted}"`, status, risk_score, classification,
    is_flagged, fraud_label, hour, txns_last_5m,
    amt_ratio, is_new_rcv, fan_in, is_emulator, seconds_last
  ].join(','));
}

fs.writeFileSync(outputFile, rows.join('\n'), 'utf-8');
console.log(`Successfully generated ${rows.length - 1} transactions in: ${outputFile}`);
