export type CompanySplitType = 'robert' | 'iustin' | 'both' | 'custom';

export interface CompanySplit {
  type: CompanySplitType;
  robertPercent: number; // 0 to 100
  iustinPercent: number; // 0 to 100
  robertAmount: number;  // amount in RON
  iustinAmount: number;  // amount in RON
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type?: TransactionType; // 'income' (default) | 'expense'
  categories: string[];
  date: string; // ISO String
  isCompany?: boolean;
  companySplit?: CompanySplit;
}

export interface IncomeFormData {
  title: string;
  amount: string;
  type?: TransactionType;
  categories: string[];
  isCompany?: boolean;
  companySplit?: CompanySplit;
}

export interface CloudConfig {
  url: string;
}

export type ClientStatus = 'Lead Nou' | 'Demo Trimis' | 'În Negociere' | 'Proiect În Lucru' | 'Finalizat' | 'Refuzat';

export type TechStatus = 'De Făcut' | 'Demo în Lucru' | 'Demo Gata' | 'Modificări Finale' | 'Finalizat';

export interface Appointment {
  id: string;
  date: string; // ISO String
  title: string;
}

export interface Client {
  id: string;
  businessName: string;
  clientName: string;
  phone: string;
  status: ClientStatus;
  techStatus: TechStatus;
  price: number;
  probability: number; // 0-100
  demoDeadline: string; // ISO String
  notes: string;
  techNotes: string;
  gbpLink?: string;
  createdAt: string; // ISO String
  closedAt?: string; // ISO String
  lastUpdateAt?: string; // ISO String
  lastUpdateType?: 'status' | 'notes' | 'techStatus' | 'techNotes' | 'price' | 'general';
  appointments: Appointment[];
}
