// One-time migration: pulls current data from the old Google Apps Script
// Web App (the Google Sheet backend) and writes it into Firestore.
//
// Usage: node scripts/migrate.mjs
// Requires serviceAccountKey.json in the project root (never committed).

import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwckl89l0cbbK-qD7xElrKXrR1IotZbqWH8oPPHCLxYjCgfn-AUj3-F5R01Qab0vSqt/exec';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function sanitizeTransactions(raw) {
  return raw.map((item) => {
    const isDate = (s) => s && !isNaN(Date.parse(s)) && String(s).includes('T');
    const rawType = item.type || (item.tip === 'cheltuiala' || item.tip === 'expense' ? 'expense' : 'income');
    const type = rawType === 'expense' ? 'expense' : 'income';

    const isCompany = Boolean(
      item.isCompany === true ||
      item.isCompany === 'true' ||
      item.isCompany === 1 ||
      item.isCompany === '1' ||
      item.peFirma === true ||
      item.peFirma === 'true'
    );

    let companySplit;
    if (item.companySplit) {
      if (typeof item.companySplit === 'object') {
        companySplit = item.companySplit;
      } else if (typeof item.companySplit === 'string') {
        try {
          companySplit = JSON.parse(item.companySplit);
        } catch {
          // ignore
        }
      }
    }

    const amount = Number(item.amount) || 0;
    if (isCompany && !companySplit) {
      const half = Math.round(amount / 2);
      companySplit = {
        type: 'both',
        robertPercent: 50,
        iustinPercent: 50,
        robertAmount: half,
        iustinAmount: amount - half,
      };
    }

    return {
      id: item.id || randomUUID(),
      title: item.title || (type === 'expense' ? 'Cheltuială' : 'Venit'),
      amount,
      type,
      categories: Array.isArray(item.categories)
        ? item.categories
        : typeof item.categories === 'string'
        ? item.categories.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      date: isDate(item.date) ? item.date : new Date(item.date || Date.now()).toISOString(),
      isCompany,
      ...(companySplit ? { companySplit } : {}),
    };
  });
}

function sanitizeClients(raw) {
  return raw.map((c) => ({
    id: c.id || randomUUID(),
    businessName: c.businessName || 'Business Fără Nume',
    clientName: c.clientName || 'Client Fără Nume',
    phone: String(c.phone || ''),
    status: c.status || 'Lead Nou',
    techStatus: c.techStatus || 'De Făcut',
    price: Number(c.price) || 0,
    probability: Number(c.probability) || 0,
    demoDeadline: c.demoDeadline || new Date().toISOString(),
    notes: c.notes || '',
    techNotes: c.techNotes || '',
    ...(c.gbpLink ? { gbpLink: c.gbpLink } : {}),
    createdAt: c.createdAt || new Date().toISOString(),
    ...(c.closedAt ? { closedAt: c.closedAt } : {}),
    appointments: Array.isArray(c.appointments) ? c.appointments : [],
  }));
}

async function main() {
  console.log('Fetching data from the Google Apps Script backend...');
  const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Google Script returned ${response.status}`);
  const data = await response.json();

  const transactions = sanitizeTransactions(data.transactions || []);
  const clients = sanitizeClients(data.clients || []);

  console.log(`Found ${transactions.length} transactions and ${clients.length} clients.`);

  for (const t of transactions) {
    await db.collection('transactions').doc(t.id).set(t);
  }
  console.log(`Wrote ${transactions.length} transactions to Firestore.`);

  for (const c of clients) {
    await db.collection('clients').doc(c.id).set(c);
  }
  console.log(`Wrote ${clients.length} clients to Firestore.`);

  console.log('Migration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
