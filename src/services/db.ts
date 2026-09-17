import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import { Transaction, IncomeFormData, Client } from '../../types';
import { notifyNewTransaction, notifyNewClient, notifyClientUpdate } from './notify';

const transactionsCol = collection(db, 'transactions');
const clientsCol = collection(db, 'clients');

// Firestore rejects `undefined` field values (e.g. an omitted companySplit) -
// JSON round-tripping drops those keys entirely.
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function subscribeToTransactions(cb: (transactions: Transaction[]) => void): Unsubscribe {
  return onSnapshot(transactionsCol, (snapshot) => {
    const transactions = snapshot.docs.map((d) => d.data() as Transaction);
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    cb(transactions);
  });
}

export function subscribeToClients(cb: (clients: Client[]) => void): Unsubscribe {
  return onSnapshot(clientsCol, (snapshot) => {
    const clients = snapshot.docs.map((d) => d.data() as Client);
    clients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    cb(clients);
  });
}

export async function addTransaction(data: IncomeFormData): Promise<Transaction> {
  const transaction: Transaction = {
    id: uuidv4(),
    title: data.title,
    amount: parseFloat(data.amount) || 0,
    type: data.type || 'income',
    categories: data.categories,
    date: new Date().toISOString(),
    isCompany: Boolean(data.isCompany),
    companySplit: data.companySplit,
  };
  await setDoc(doc(transactionsCol, transaction.id), stripUndefined(transaction));
  notifyNewTransaction(transaction);
  return transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(transactionsCol, id));
}

export async function addClient(client: Client): Promise<void> {
  await setDoc(doc(clientsCol, client.id), stripUndefined(client));
  notifyNewClient(client);
}

export async function updateClient(client: Client): Promise<void> {
  await setDoc(doc(clientsCol, client.id), stripUndefined(client));
  notifyClientUpdate(client);
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(clientsCol, id));
}
