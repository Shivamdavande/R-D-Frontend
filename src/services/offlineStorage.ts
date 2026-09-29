import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../types';

const PENDING_EXPENSES_KEY = '@r2r_pending_expenses';
const CACHED_SITES_KEY = '@r2r_cached_sites';
const CACHED_CATEGORIES_KEY = '@r2r_cached_categories';

export const savePendingExpense = async (expenseData: Partial<Expense>): Promise<Expense> => {
  try {
    const existingStr = await AsyncStorage.getItem(PENDING_EXPENSES_KEY);
    const existingQueue: Expense[] = existingStr ? JSON.parse(existingStr) : [];

    const clientLocalId = `LOC_EXP_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const newExpense: Expense = {
      _id: clientLocalId,
      siteId: expenseData.siteId!,
      date: expenseData.date || new Date().toISOString(),
      category: expenseData.category || 'Material',
      itemName: expenseData.itemName || '',
      quantity: Number(expenseData.quantity || 0),
      unit: expenseData.unit || 'Nos',
      rate: Number(expenseData.rate || 0),
      amount: Number(((expenseData.quantity || 0) * (expenseData.rate || 0)).toFixed(2)),
      vendor: expenseData.vendor,
      paymentMethod: expenseData.paymentMethod || 'CASH',
      notes: expenseData.notes,
      billImageUrl: expenseData.billImageUrl,
      createdBy: expenseData.createdBy || { _id: 'local', name: 'You (Offline)', email: '', role: 'SUPERVISOR' },
      clientLocalId,
      syncStatus: 'PENDING'
    };

    existingQueue.push(newExpense);
    await AsyncStorage.setItem(PENDING_EXPENSES_KEY, JSON.stringify(existingQueue));
    return newExpense;
  } catch (error) {
    console.error('Failed to save offline expense locally:', error);
    throw error;
  }
};

export const getPendingExpenses = async (): Promise<Expense[]> => {
  try {
    const dataStr = await AsyncStorage.getItem(PENDING_EXPENSES_KEY);
    return dataStr ? JSON.parse(dataStr) : [];
  } catch (error) {
    console.error('Error fetching pending offline expenses:', error);
    return [];
  }
};

export const removePendingExpense = async (clientLocalId: string): Promise<void> => {
  try {
    const dataStr = await AsyncStorage.getItem(PENDING_EXPENSES_KEY);
    if (!dataStr) return;
    const queue: Expense[] = JSON.parse(dataStr);
    const updated = queue.filter(item => item.clientLocalId !== clientLocalId);
    await AsyncStorage.setItem(PENDING_EXPENSES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing pending expense:', error);
  }
};

export const cacheUserSites = async (sites: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHED_SITES_KEY, JSON.stringify(sites));
  } catch (error) {
    console.error('Error caching user sites:', error);
  }
};

export const getCachedSites = async (): Promise<any[]> => {
  try {
    const dataStr = await AsyncStorage.getItem(CACHED_SITES_KEY);
    return dataStr ? JSON.parse(dataStr) : [];
  } catch (error) {
    return [];
  }
};
