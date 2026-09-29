import api from './api';
import { getPendingExpenses, removePendingExpense } from './offlineStorage';

export const syncAllPendingExpenses = async (): Promise<{ successCount: number; failCount: number }> => {
  const pending = await getPendingExpenses();
  if (pending.length === 0) return { successCount: 0, failCount: 0 };

  let successCount = 0;
  let failCount = 0;

  // Group pending expenses by siteId
  const siteMap: Record<string, any[]> = {};
  pending.forEach((exp) => {
    const sId = typeof exp.siteId === 'string' ? exp.siteId : exp.siteId._id;
    if (!siteMap[sId]) siteMap[sId] = [];
    siteMap[sId].push(exp);
  });

  for (const [siteId, items] of Object.entries(siteMap)) {
    try {
      const response = await api.post('/sync/batch', {
        siteId,
        expenses: items
      });

      if (response.data?.success) {
        // Clear successfully synced items from local queue
        for (const item of items) {
          if (item.clientLocalId) {
            await removePendingExpense(item.clientLocalId);
            successCount++;
          }
        }
      }
    } catch (err) {
      console.warn(`Sync failed for site ${siteId}:`, err);
      failCount += items.length;
    }
  }

  return { successCount, failCount };
};
