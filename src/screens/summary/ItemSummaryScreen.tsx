import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { useSites } from '../../context/SiteContext';
import api from '../../services/api';
import { ItemSummary } from '../../types';

export const ItemSummaryScreen = ({ navigation }: any) => {
  const { activeSite } = useSites();
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [search, setSearch] = useState('');
  const [totalSiteExpenses, setTotalSiteExpenses] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItemSummary();
  }, [activeSite, search]);

  const loadItemSummary = async () => {
    if (!activeSite) return;
    setLoading(true);
    try {
      const res = await api.get(`/sites/${activeSite._id}/item-summary?search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setItems(res.data.items);
        setTotalSiteExpenses(res.data.totalExpenses || 0);
      }
    } catch (e) {
      console.log('Error loading item summary:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Item-Wise Quantity Summary" subtitle={activeSite?.siteName} navigation={navigation} showSiteSelector={true} />

      <View style={styles.content}>
        <Input
          placeholder="Search items by name..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginBottom: 10 }}
        />

        <Button
          title="➕ ADD NEW ITEM / MATERIAL WITH PRICE"
          onPress={() => navigation.navigate('AddExpense')}
          style={{ marginBottom: 10 }}
        />

        {/* Total Cost Summary Card */}
        <Card style={styles.totalCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.totalCardLabel}>AGGREGATED SITE EXPENSE</Text>
              <Text style={styles.totalCardSub}>{items.length} Unique Item/Unit Groups</Text>
            </View>
            <Text style={styles.totalCardValue}>₹{totalSiteExpenses.toLocaleString('en-IN')}</Text>
          </View>
        </Card>

        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.thText, { flex: 2 }]}>ITEM & CATEGORY</Text>
          <Text style={[styles.thText, { flex: 1.5, textAlign: 'center' }]}>TOTAL QTY</Text>
          <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>TOTAL COST</Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => `${item.itemName}-${item.unit}`}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadItemSummary} tintColor={Colors.accent} />}
          ListEmptyComponent={<EmptyState title="No Items Recorded" description="As expenses are added, item quantities will automatically aggregate here." />}
          renderItem={({ item }) => {
            const addedByStr = item.addedByUsers && item.addedByUsers.length > 0 ? item.addedByUsers.join(', ') : 'Supervisor';
            return (
              <Card style={styles.rowCard}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <View style={{ marginTop: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    <Badge label={item.category} variant="category" categoryName={item.category} />
                  </View>
                  <Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 4 }}>👤 Added by: {addedByStr}</Text>
                </View>

                <View style={{ flex: 1.5, alignItems: 'center' }}>
                  <Text style={styles.qtyValue}>{item.totalQuantity} <Text style={styles.unitText}>{item.unit}</Text></Text>
                  <Text style={styles.avgRate}>Avg: ₹{item.averageRate.toLocaleString('en-IN')}</Text>
                </View>

                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  <Text style={styles.costValue}>₹{item.totalCost.toLocaleString('en-IN')}</Text>
                  <Text style={styles.entriesText}>{item.entryCount} entries</Text>
                </View>
              </Card>
            );
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 14 },
  totalCard: { backgroundColor: Colors.primaryLight, borderColor: Colors.accent, padding: 12, marginBottom: 12 },
  totalCardLabel: { color: Colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  totalCardSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  totalCardValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: '900' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 8 },
  thText: { color: Colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  rowCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 6 },
  itemName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800' },
  qtyValue: { color: Colors.accent, fontSize: 14, fontWeight: '900' },
  unitText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  avgRate: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  costValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  entriesText: { color: Colors.textMuted, fontSize: 9, marginTop: 2 }
});
