import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useNetwork } from '../../context/NetworkContext';
import { getPendingExpenses } from '../../services/offlineStorage';
import { Expense } from '../../types';

export const PendingSyncScreen = ({ navigation }: any) => {
  const { triggerSyncNow, pendingSyncCount, isOnline } = useNetwork();
  const [pendingItems, setPendingItems] = useState<Expense[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadPending();
  }, [pendingSyncCount]);

  const loadPending = async () => {
    const queue = await getPendingExpenses();
    setPendingItems(queue);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await triggerSyncNow();
      await loadPending();
      Alert.alert(
        'Sync Completed ✅',
        `Successfully synced ${res.successCount} offline expense entry(ies) to MongoDB cloud server.`
      );
    } catch (err: any) {
      Alert.alert('Sync Failed ❌', err.message || 'Unable to sync. Please check network connection.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Offline Pending Sync Queue" subtitle={`${pendingItems.length} Entries Waiting`} navigation={navigation} showSiteSelector={false} />

      <View style={styles.content}>
        <Card style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>⚡ OFFLINE SYNC ENGINE</Text>
          <Text style={styles.bannerText}>
            Expenses entered while on-site with poor network connectivity are stored locally. They auto-sync as soon as internet connection is restored.
          </Text>

          <Button
            title={isOnline ? "⚡ SYNC NOW TO SERVER" : "OFFLINE - SYNC DISBALED"}
            onPress={handleSync}
            loading={syncing}
            disabled={!isOnline || pendingItems.length === 0}
            style={{ marginTop: 10 }}
          />
        </Card>

        <FlatList
          data={pendingItems}
          keyExtractor={(item) => item.clientLocalId || item._id}
          ListEmptyComponent={<EmptyState title="All Expenses Synced!" description="There are no pending offline expenses waiting for synchronization." icon="✓" />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.qtyText}>{item.quantity} {item.unit} × ₹{item.rate}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                  <Badge label="⏳ Pending Sync" variant="warning" />
                </View>
              </View>

              <Text style={styles.localIdText}>Local Tracking ID: {item.clientLocalId}</Text>
            </Card>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 14 },
  bannerCard: { backgroundColor: Colors.primaryLight, borderColor: Colors.accent, marginBottom: 12 },
  bannerTitle: { color: Colors.accent, fontSize: 13, fontWeight: '800' },
  bannerText: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  card: { padding: 12, marginBottom: 8 },
  itemName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  qtyText: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  amountText: { color: Colors.accent, fontSize: 16, fontWeight: '900', marginBottom: 4 },
  localIdText: { color: Colors.textMuted, fontSize: 9, fontStyle: 'italic', marginTop: 8 }
});
