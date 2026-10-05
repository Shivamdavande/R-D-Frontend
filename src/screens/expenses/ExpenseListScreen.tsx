import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useSites } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Expense } from '../../types';
import { customAlert } from '../../utils/alertHelper';

export const ExpenseListScreen = ({ navigation }: any) => {
  const { activeSite, refreshSites } = useSites();
  const { isOwner, isSupervisor } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [activeSite, selectedCategory, search]);

  const loadExpenses = async () => {
    if (!activeSite) return;
    setLoading(true);
    try {
      let url = `/sites/${activeSite._id}/expenses?search=${encodeURIComponent(search)}`;
      if (selectedCategory !== 'ALL') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await api.get(url);
      if (res.data?.success) {
        setExpenses(res.data.expenses);
        setTotalAmount(res.data.totalAmount || 0);
      }
    } catch (err) {
      console.log('Error fetching expense list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = (exp: Expense) => {
    customAlert(
      'Delete Item Expense 🗑️',
      `Are you sure you want to delete item "${exp.itemName}" (₹${exp.amount.toLocaleString('en-IN')})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/expenses/${exp._id}`);
              if (res.data?.success) {
                customAlert('Deleted ✅', 'Item expense deleted successfully.');
                await refreshSites();
                loadExpenses();
              }
            } catch (err: any) {
              customAlert('Error', err.message || 'Failed to delete item.');
            }
          }
        }
      ]
    );
  };

  const CATEGORY_FILTERS = ['ALL', 'Material', 'Labour', 'Transport', 'Machinery', 'Fuel', 'Electrical', 'Tools', 'Miscellaneous'];

  return (
    <View style={styles.container}>
      <Header title="Site Expense Log" subtitle={activeSite?.siteName} navigation={navigation} showSiteSelector={true} />

      <View style={styles.content}>
        {/* Search Input */}
        <Input
          placeholder="Search by item name, vendor, notes..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginBottom: 8 }}
        />

        {/* Category Pills */}
        <FlatList
          horizontal
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 10, maxHeight: 38 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catFilter, selectedCategory === item && styles.catFilterActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.catFilterText, selectedCategory === item && styles.catFilterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Header Summary Banner */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryCount}>{expenses.length} Entry(ies)</Text>
          <Text style={styles.summaryTotal}>Total: ₹{totalAmount.toLocaleString('en-IN')}</Text>
        </View>

        {/* Chronological List */}
        <FlatList
          data={expenses}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadExpenses} tintColor={Colors.accent} />}
          ListEmptyComponent={<EmptyState title="No Expenses Found" description="Tap + Add Expense to create an entry for this site." />}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS !== 'web'}
          renderItem={({ item }) => {
            const userName = item.createdBy && typeof item.createdBy === 'object' ? (item.createdBy.name || 'Supervisor') : (typeof item.createdBy === 'string' ? item.createdBy : 'Supervisor');
            return (
              <Card style={styles.card} onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item._id })}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.itemName}</Text>
                    <Text style={styles.qtyText}>{item.quantity} {item.unit} × ₹{item.rate.toLocaleString('en-IN')}</Text>
                    <View style={styles.badgeRow}>
                      <Badge label={item.category} variant="category" categoryName={item.category} />
                      <Badge label={item.syncStatus === 'SYNCED' ? '✓ Synced' : '⏳ Pending'} variant={item.syncStatus === 'SYNCED' ? 'success' : 'warning'} />
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.userText}>👤 Added by: {userName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                      {(isOwner || isSupervisor) && (
                        <TouchableOpacity
                          onPress={() => handleDeleteItem(item)}
                          style={{ padding: 2 }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={{ fontSize: 14 }}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
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
  catFilter: { backgroundColor: Colors.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.inputBorder, marginRight: 6 },
  catFilterActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  catFilterText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  catFilterTextActive: { color: Colors.buttonPrimaryText },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 10 },
  summaryCount: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  summaryTotal: { color: Colors.accent, fontSize: 13, fontWeight: '900' },
  card: { padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  qtyText: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  amountText: { color: Colors.accent, fontSize: 16, fontWeight: '900' },
  userText: { color: Colors.textMuted, fontSize: 10, marginTop: 4 },
  dateText: { color: Colors.textSecondary, fontSize: 10 }
});
