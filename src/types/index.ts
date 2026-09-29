export type UserRole = 'OWNER' | 'SUPERVISOR' | 'VIEWER';
export type SiteStatus = 'ACTIVE' | 'COMPLETED' | 'CLOSED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  companyName: string;
}

export interface SiteMember {
  _id: string;
  siteId: string;
  userId: User;
  role: UserRole;
}

export interface Site {
  _id: string;
  siteName: string;
  clientName: string;
  workOrderNumber: string;
  workOrderDate?: string;
  contractValue: number;
  location?: string;
  startDate?: string;
  expectedEndDate?: string;
  description?: string;
  status: SiteStatus;
  createdBy: User | string;
  closedBy?: User | string;
  closedAt?: string;
  createdAt: string;
  totalExpenses?: number;
  expenseCount?: number;
  profit?: number;
  profitPercentage?: number;
}

export interface Expense {
  _id: string;
  siteId: string | Site;
  date: string;
  category: string;
  itemName: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  vendor?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  billImageUrl?: string;
  createdBy: User | { _id: string; name: string; email: string; role: string };
  clientLocalId?: string;
  syncStatus: 'SYNCED' | 'PENDING';
  isDeleted?: boolean;
  createdAt?: string;
}

export interface CategorySummary {
  _id: string;
  totalAmount: number;
  count: number;
}

export interface ItemSummary {
  itemName: string;
  unit: string;
  category: string;
  totalQuantity: number;
  totalCost: number;
  averageRate: number;
  entryCount: number;
}

export interface ActivityLogItem {
  _id: string;
  siteId: string;
  userId: User | string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  previousValues?: any;
  newValues?: any;
}
