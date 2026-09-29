import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { useSites } from '../../context/SiteContext';
import api from '../../services/api';
import { Site } from '../../types';

export const SiteDetailScreen = ({ route, navigation }: any) => {
  const { siteId } = route.params;
  const { isOwner } = useAuth();
  const { closeSite, reopenSite, refreshSites } = useSites();
  const [siteData, setSiteData] = useState<any>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSiteDetails();
  }, [siteId]);

  const loadSiteDetails = async () => {
    setLoading(true);
    try {
      const resSite = await api.get(`/sites/${siteId}`);
      const resSum = await api.get(`/sites/${siteId}/summary`);

      if (resSite.data?.success) setSiteData(resSite.data.site);
      if (resSum.data?.success) setSummaryMetrics(resSum.data.metrics);
    } catch (e: any) {
      console.log('Error loading site details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSite = () => {
    if (!siteData) return;
    Alert.alert(
      'Close Site Confirmation 🔒',
      `Are you sure you want to close "${siteData.siteName}"?\n\nFinal Cost Summary:\nContract Value: ₹${(siteData.contractValue || 0).toLocaleString('en-IN')}\nTotal Expenses: ₹${(siteData.totalExpenses || 0).toLocaleString('en-IN')}\nProfit: ₹${(siteData.profit || 0).toLocaleString('en-IN')} (${siteData.profitPercentage}%)\n\nOnce closed, normal supervisors cannot add new expenses to this site.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CLOSE SITE NOW',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeSite(siteId);
              await loadSiteDetails();
              Alert.alert('Site Closed ✅', 'Site is now CLOSED. Final reports can now be generated.');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleReopenSite = async () => {
    try {
      await reopenSite(siteId);
      await loadSiteDetails();
      Alert.alert('Site Reopened ✅', 'Site is now ACTIVE for supervisor entry.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading || !siteData) {
    return (
      <View style={styles.container}>
        <Header title="Site Details" navigation={navigation} showSiteSelector={false} />
        <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: Colors.textSecondary }}>Loading site data...</Text></View>
      </View>
    );
  }

  const isClosed = siteData.status === 'CLOSED';

  return (
    <View style={styles.container}>
      <Header title={siteData.siteName} subtitle={`WO: ${siteData.workOrderNumber}`} navigation={navigation} showSiteSelector={false} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Site Metadata Card */}
        <Card style={styles.headerCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientTitle}>{siteData.clientName}</Text>
              <Text style={styles.woText}>Work Order #: {siteData.workOrderNumber}</Text>
              {siteData.location && <Text style={styles.locText}>📍 {siteData.location}</Text>}
            </View>
            <Badge label={siteData.status} variant={isClosed ? 'danger' : 'success'} />
          </View>
        </Card>

        {/* P&L Metrics Grid */}
        <Text style={styles.sectionHeader}>FINANCIAL & P&L DASHBOARD</Text>
        <View style={styles.statsGrid}>
          <StatCard title="CONTRACT VALUE" value={`₹${(siteData.contractValue || 0).toLocaleString('en-IN')}`} type="contract" />
          <StatCard title="TOTAL SITE EXPENSES" value={`₹${(siteData.totalExpenses || 0).toLocaleString('en-IN')}`} type="expense" />
        </View>
        <View style={styles.statsGrid}>
          <StatCard title="REMAINING BUDGET" value={`₹${(siteData.contractValue - siteData.totalExpenses).toLocaleString('en-IN')}`} type="contract" />
          <StatCard title="GROSS PROFIT" value={`₹${(siteData.profit || 0).toLocaleString('en-IN')}`} subtitle={`${siteData.profitPercentage}% Profit Margin`} type="profit" />
        </View>

        {/* Category Breakdown */}
        {summaryMetrics?.categoryBreakdown ? (
          <Card>
            <Text style={styles.cardSectionTitle}>CATEGORY COST BREAKDOWN</Text>
            {summaryMetrics.categoryBreakdown.map((cat: any) => {
              const pct = siteData.totalExpenses > 0 ? ((cat.totalAmount / siteData.totalExpenses) * 100).toFixed(1) : '0';
              return (
                <View key={cat._id} style={styles.catRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat._id}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                    <Text style={styles.catVal}>₹{cat.totalAmount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.catPct}>{pct}% of total</Text>
                  </View>
                </View>
              );
            })}
          </Card>
        ) : null}

        {/* Site Collaboration Team */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.cardSectionTitle}>SITE COLLABORATORS ({siteData.members?.length || 0})</Text>
            {isOwner && (
              <TouchableOpacity onPress={() => navigation.navigate('SiteMembers', { siteId })}>
                <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: '700' }}>Manage Team ⚙️</Text>
              </TouchableOpacity>
            )}
          </View>
          {siteData.members?.map((m: any) => {
            const memberUser = m.userId || {};
            return (
              <View key={m._id} style={styles.memberRow}>
                <Text style={styles.memberName}>{memberUser.name || 'User'} <Text style={{ color: Colors.textMuted, fontSize: 11 }}>({memberUser.email})</Text></Text>
                <Badge label={m.role} variant={m.role === 'OWNER' ? 'warning' : 'info'} />
              </View>
            );
          })}
        </Card>

        {/* Quick Action Navigation Grid */}
        <Text style={styles.sectionHeader}>REPORTS & RECONCILIATION</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ItemSummary', { siteId })}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Item-Wise Summary</Text>
            <Text style={styles.actionSub}>Aggregated Qty & Rates</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MeasurementBook', { siteId })}>
            <Text style={styles.actionIcon}>📐</Text>
            <Text style={styles.actionTitle}>Cost / MB Summary</Text>
            <Text style={styles.actionSub}>Internal Cost Reconciliation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ActivityLog', { siteId })}>
            <Text style={styles.actionIcon}>📜</Text>
            <Text style={styles.actionTitle}>Activity Audit Log</Text>
            <Text style={styles.actionSub}>Who added & edited</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('FinalReport', { siteId })}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionTitle}>Final PDF Report</Text>
            <Text style={styles.actionSub}>Download printable A4</Text>
          </TouchableOpacity>
        </View>

        {/* Site Closing / Reopening Admin Controls */}
        {isOwner && (
          <View style={styles.adminBox}>
            <Text style={styles.adminTitle}>SITE CLOSING CONTROLS</Text>
            {isClosed ? (
              <View>
                <Text style={styles.closedNote}>This site is currently CLOSED. Supervisors cannot add new expenses.</Text>
                <Button title="REOPEN SITE WORKSPACE" onPress={handleReopenSite} variant="success" style={{ marginTop: 10 }} />
              </View>
            ) : (
              <View>
                <Text style={styles.closedNote}>Closing site will calculate final P&L, lock supervisor expense entry, and enable final report issuance.</Text>
                <Button title="🔒 CLOSE THIS SITE" onPress={handleCloseSite} variant="danger" style={{ marginTop: 10 }} />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  headerCard: { borderColor: Colors.accent },
  clientTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  woText: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  locText: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  sectionHeader: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 12, marginBottom: 8, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  cardSectionTitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catName: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: Colors.inputBg, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: Colors.accent, borderRadius: 3 },
  catVal: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800' },
  catPct: { color: Colors.textMuted, fontSize: 9 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  memberName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  actionCard: { width: '48%', backgroundColor: Colors.surface, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionTitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  actionSub: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  adminBox: { backgroundColor: Colors.primaryLight, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 30 },
  adminTitle: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  closedNote: { color: Colors.textSecondary, fontSize: 11, marginTop: 4 }
});
