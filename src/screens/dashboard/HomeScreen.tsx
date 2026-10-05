import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useSites } from '../../context/SiteContext';
import api from '../../services/api';
import { Expense } from '../../types';
import { customAlert } from '../../utils/alertHelper';

export const HomeScreen = ({ navigation }: any) => {
  const { user, isOwner, token } = useAuth();
  const { sites, activeSite, setActiveSite, refreshSites } = useSites();
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, [activeSite]);

  const loadHomeData = async () => {
    if (!activeSite || (token && token.startsWith('demo_'))) return;
    try {
      const res = await api.get(`/sites/${activeSite._id}/expenses?limit=5`);
      if (res.data?.success) {
        setRecentExpenses(res.data.expenses);
      }
    } catch (e) {
      console.log('Failed loading home data:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSites();
    await loadHomeData();
    setRefreshing(false);
  };

  // Metrics Calculations
  const activeSitesCount = sites.filter(s => s.status === 'ACTIVE').length;
  const closedSitesCount = sites.filter(s => s.status === 'CLOSED').length;
  const totalContractVal = sites.reduce((sum, s) => sum + (s.contractValue || 0), 0);
  const totalExpVal = sites.reduce((sum, s) => sum + (s.totalExpenses || 0), 0);
  const overallProfit = totalContractVal > 0 ? totalContractVal - totalExpVal : 0;
  const overallProfitPct = totalContractVal > 0 ? ((overallProfit / totalContractVal) * 100).toFixed(1) : '0';

  const handleDeleteExpense = (item: Expense) => {
    customAlert(
      'Delete Expense 🗑️',
      `Are you sure you want to delete expense "${item.itemName}" (₹${item.amount.toLocaleString('en-IN')})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/expenses/${item._id}`);
              if (res.data?.success) {
                customAlert('Deleted ✅', 'Expense record deleted.');
                await loadHomeData();
                await refreshSites();
              }
            } catch (err: any) {
              customAlert('Error', err.message || 'Failed to delete expense.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>Hello, {user?.name || 'User'}</Text>
            <Text style={styles.roleBadge}>{user?.role === 'OWNER' ? '👑 OWNER / CONTRACTOR' : '👷 SITE SUPERVISOR'}</Text>
          </View>
          <Button
            title="+ ADD EXPENSE"
            onPress={() => navigation.navigate('AddExpense')}
            size="small"
          />
        </View>

        {/* Global KPI Metrics */}
        {isOwner ? (
          <>
            <View style={styles.statsGrid}>
              <StatCard title="ACTIVE SITES" value={`${activeSitesCount}`} subtitle={`${closedSitesCount} Completed`} type="contract" />
              <StatCard title="CONTRACT VALUE" value={`₹${totalContractVal.toLocaleString('en-IN')}`} type="contract" />
            </View>
            <View style={styles.statsGrid}>
              <StatCard title="TOTAL SITE EXPENSES" value={`₹${totalExpVal.toLocaleString('en-IN')}`} type="expense" />
              <StatCard title="OVERALL PROFIT" value={`₹${overallProfit.toLocaleString('en-IN')}`} subtitle={`${overallProfitPct}% Margin`} type="profit" />
            </View>

            {/* Owner View: Active Site Spotlight */}
            {activeSite ? (
              <Card style={styles.activeSiteCard} onPress={() => navigation.navigate('SiteDetail', { siteId: activeSite._id })}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTag}>ACTIVE SITE SPOTLIGHT</Text>
                    <Text style={styles.siteTitle}>{activeSite.siteName}</Text>
                    <Text style={styles.clientText}>{activeSite.clientName} (WO: {activeSite.workOrderNumber})</Text>
                  </View>
                  <Badge label={activeSite.status} variant={activeSite.status === 'ACTIVE' ? 'success' : 'danger'} />
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniLabel}>Contract Value</Text>
                    <Text style={styles.miniValue}>₹{(activeSite.contractValue || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniLabel}>Total Expenses</Text>
                    <Text style={[styles.miniValue, { color: Colors.danger }]}>₹{(activeSite.totalExpenses || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniLabel}>Estimated Profit</Text>
                    <Text style={[styles.miniValue, { color: Colors.success }]}>₹{(activeSite.profit || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                <View style={styles.quickNavRow}>
                  <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('ItemSummary', { siteId: activeSite._id })}>
                    <Text style={styles.quickNavText}>📊 Item Summary</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('MeasurementBook', { siteId: activeSite._id })}>
                    <Text style={styles.quickNavText}>📐 Cost/MB Summary</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('ActivityLog', { siteId: activeSite._id })}>
                    <Text style={styles.quickNavText}>📜 Activity Log</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard title="MY ASSIGNED SITES" value={`${sites.length}`} subtitle={`${activeSitesCount} Active Site(s)`} type="contract" />
            </View>

            {/* Supervisor View: List of Assigned Sites */}
            <View style={{ marginVertical: 8 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Assigned Construction Sites ({sites.length})</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SitesTab')}>
                  <Text style={styles.seeAllText}>View All →</Text>
                </TouchableOpacity>
              </View>

              {sites.length === 0 ? (
                <Card style={{ alignItems: 'center', padding: 20 }}>
                  <Text style={{ color: Colors.textSecondary }}>No sites assigned yet. Contact your owner for site assignment.</Text>
                </Card>
              ) : (
                sites.map((st) => (
                  <Card
                    key={st._id}
                    style={[styles.activeSiteCard, activeSite?._id === st._id && { borderColor: Colors.accent, borderWidth: 1.5 }]}
                    onPress={() => {
                      setActiveSite(st);
                      navigation.navigate('SiteDetail', { siteId: st._id });
                    }}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTag}>{activeSite?._id === st._id ? '🟢 CURRENT ACTIVE WORKSPACE' : '🏗️ ASSIGNED SITE'}</Text>
                        <Text style={styles.siteTitle}>{st.siteName}</Text>
                        <Text style={styles.clientText}>{st.clientName} • WO: {st.workOrderNumber}</Text>
                        {st.location ? <Text style={{ color: Colors.textMuted, fontSize: 11, marginTop: 2 }}>📍 {st.location}</Text> : null}
                      </View>
                      <Badge label={st.status} variant={st.status === 'ACTIVE' ? 'success' : 'danger'} />
                    </View>

                    <View style={styles.quickNavRow}>
                      <TouchableOpacity style={styles.quickNavBtn} onPress={() => { setActiveSite(st); navigation.navigate('AddExpense', { siteId: st._id }); }}>
                        <Text style={styles.quickNavText}>➕ Add Expense</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.quickNavBtn} onPress={() => { setActiveSite(st); navigation.navigate('SiteImages', { siteId: st._id, siteName: st.siteName }); }}>
                        <Text style={styles.quickNavText}>📷 Photos</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.quickNavBtn} onPress={() => { setActiveSite(st); navigation.navigate('SiteDetail', { siteId: st._id }); }}>
                        <Text style={styles.quickNavText}>View Details ➔</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </>
        )}

        {/* Recent Site Expenses Feed */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Site Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExpenseList')}>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>

        {recentExpenses.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: 20 }}>
            <Text style={{ color: Colors.textSecondary }}>No expenses recorded yet on active site.</Text>
            <Button title="Add First Expense" onPress={() => navigation.navigate('AddExpense')} size="small" style={{ marginTop: 10 }} />
          </Card>
        ) : (
          recentExpenses.map((item) => {
            const addedBy = item.createdBy && typeof item.createdBy === 'object' ? (item.createdBy.name || 'Supervisor') : (typeof item.createdBy === 'string' ? item.createdBy : 'Supervisor');
            return (
              <Card key={item._id} style={styles.expenseItemRow} onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item._id })}>
                <View style={styles.expenseLeft}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemDetail}>{item.quantity} {item.unit} × ₹{item.rate.toLocaleString('en-IN')} | Added by {addedBy}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <Badge label={item.category} variant="category" categoryName={item.category} />
                    <Badge label={item.syncStatus === 'SYNCED' ? '✓ Synced' : '⏳ Pending'} variant={item.syncStatus === 'SYNCED' ? 'success' : 'warning'} />
                  </View>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteExpense(item);
                      }}
                      style={{ padding: 2 }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={{ fontSize: 14 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  welcomeText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  roleBadge: { color: Colors.accent, fontSize: 11, fontWeight: '700', marginTop: 2 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  activeSiteCard: { marginTop: 8, borderColor: Colors.accent },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTag: { color: Colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  siteTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 2 },
  clientText: { color: Colors.textSecondary, fontSize: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, padding: 10, borderRadius: 8, marginVertical: 8 },
  miniMetric: { alignItems: 'center' },
  miniLabel: { color: Colors.textMuted, fontSize: 10 },
  miniValue: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', marginTop: 2 },
  quickNavRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  quickNavBtn: { flex: 1, backgroundColor: Colors.primaryLight, paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder },
  quickNavText: { color: Colors.textPrimary, fontSize: 10, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  seeAllText: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  expenseItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: 12 },
  expenseLeft: { flex: 1 },
  itemName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  itemDetail: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end' },
  amountText: { color: Colors.accent, fontSize: 15, fontWeight: '800' },
  dateText: { color: Colors.textMuted, fontSize: 10, marginTop: 2 }
});
