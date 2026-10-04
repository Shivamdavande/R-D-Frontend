import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Expense } from '../../types';

export const ExpenseDetailScreen = ({ route, navigation }: any) => {
  const { expenseId } = route.params;
  const { user, isOwner } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [expenseId]);

  const loadDetail = async () => {
    try {
      const res = await api.get(`/expenses/${expenseId}`);
      if (res.data?.success) {
        setExpense(res.data.expense);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch expense details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense record? An audit log entry will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.delete(`/expenses/${expenseId}`);
            if (res.data?.success) {
              Alert.alert('Deleted', 'Expense record deleted.');
              navigation.goBack();
            }
          } catch (e: any) {
            Alert.alert('Delete Failed', e.message);
          }
        }
      }
    ]);
  };

  if (loading || !expense) {
    return (
      <View style={styles.container}>
        <Header title="Expense Details" navigation={navigation} showSiteSelector={false} />
        <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: Colors.textSecondary }}>Loading details...</Text></View>
      </View>
    );
  }

  const createdByUser = expense.createdBy && typeof expense.createdBy === 'object' ? (expense.createdBy.name || 'Supervisor') : (typeof expense.createdBy === 'string' ? expense.createdBy : 'Supervisor');
  const createdByEmail = expense.createdBy && typeof expense.createdBy === 'object' ? (expense.createdBy.email || '') : '';
  const createdByRole = expense.createdBy && typeof expense.createdBy === 'object' ? (expense.createdBy.role || '') : '';

  return (
    <View style={styles.container}>
      <Header title="Expense Details" subtitle={`ID: ${expense._id.substring(0, 10)}...`} navigation={navigation} showSiteSelector={false} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Item Card */}
        <Card style={styles.mainCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Badge label={expense.category} variant="category" categoryName={expense.category} />
              <Text style={styles.itemTitle}>{expense.itemName}</Text>
              <Text style={styles.dateText}>{new Date(expense.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amountText}>₹{expense.amount.toLocaleString('en-IN')}</Text>
              <Badge label={expense.syncStatus === 'SYNCED' ? '✓ Synced' : '⏳ Pending'} variant={expense.syncStatus === 'SYNCED' ? 'success' : 'warning'} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Breakdown Grid */}
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>QUANTITY</Text>
              <Text style={styles.gridVal}>{expense.quantity} {expense.unit}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>UNIT RATE</Text>
              <Text style={styles.gridVal}>₹{expense.rate.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>PAYMENT METHOD</Text>
              <Text style={styles.gridVal}>{expense.paymentMethod || 'CASH'}</Text>
            </View>
          </View>

          {expense.vendor ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.gridLabel}>VENDOR / SUPPLIER</Text>
              <Text style={styles.gridVal}>{expense.vendor}</Text>
            </View>
          ) : null}

          {expense.notes ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.gridLabel}>NOTES / REMARKS</Text>
              <Text style={styles.notesVal}>{expense.notes}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* User Attribution */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.userLabel}>👤 ADDED BY:</Text>
            <Text style={styles.userVal}>{createdByUser} {createdByRole ? `[${createdByRole}]` : ''} {createdByEmail ? `(${createdByEmail})` : ''}</Text>
          </View>
        </Card>

        {/* Bill Attachment Card */}
        <Card>
          <Text style={styles.cardHeaderTitle}>ATTACHED BILL / RECEIPT PHOTO</Text>
          {expense.billImageUrl ? (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Image source={{ uri: expense.billImageUrl }} style={styles.billImage} resizeMode="cover" />
            </View>
          ) : (
            <Text style={{ color: Colors.textMuted, fontStyle: 'italic', marginTop: 6 }}>No photo attachment uploaded for this expense entry.</Text>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 30 }}>
          {isOwner && (
            <Button
              title="DELETE ENTRY"
              onPress={handleDelete}
              variant="danger"
              style={{ flex: 1 }}
            />
          )}
          <Button
            title="BACK TO EXPENSES"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  mainCard: { borderColor: Colors.accent },
  itemTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 6 },
  dateText: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  amountText: { color: Colors.accent, fontSize: 24, fontWeight: '900', marginBottom: 4 },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: 14 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCol: { flex: 1 },
  gridLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  gridVal: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 2 },
  notesVal: { color: Colors.textSecondary, fontSize: 13, marginTop: 2, fontStyle: 'italic' },
  userLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  userVal: { color: Colors.accent, fontSize: 12, fontWeight: '800' },
  cardHeaderTitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  billImage: { width: '100%', height: 220, borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder }
});
