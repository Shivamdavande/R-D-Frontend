import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useSites } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';

import { Input } from '../../components/common/Input';

export const SitesListScreen = ({ navigation }: any) => {
  const { isOwner } = useAuth();
  const { sites, activeSite, setActiveSite, refreshSites, isLoading } = useSites();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSites = sites.filter(s => {
    const matchesStatus = filter === 'ALL' || s.status === filter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.siteName.toLowerCase().includes(q) ||
      s.clientName.toLowerCase().includes(q) ||
      (s.workOrderNumber && s.workOrderNumber.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <Header title="Construction Sites" subtitle="Select a site to view details or add expenses" navigation={navigation} showSiteSelector={false} />

      <View style={styles.content}>
        {/* Search Bar */}
        <Input
          placeholder="🔍 Search site, client, or work order..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: 10 }}
        />

        {/* Create Site & Filter Bar */}
        <View style={styles.topBar}>
          <View style={styles.filterGroup}>
            {[
              { id: 'ALL', label: 'All Sites' },
              { id: 'ACTIVE', label: '🟢 Active' },
              { id: 'CLOSED', label: '🔴 Closed' }
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterBtn, filter === f.id ? styles.filterBtnActive : undefined]}
                onPress={() => setFilter(f.id as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, filter === f.id ? styles.filterTextActive : undefined]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isOwner && (
            <Button
              title="➕ New Site"
              onPress={() => navigation.navigate('CreateSite')}
              size="small"
            />
          )}
        </View>

        {/* Sites List */}
        <FlatList
          data={filteredSites}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshSites} tintColor={Colors.accent} />}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
          renderItem={({ item }) => {
            const isActive = activeSite?._id === item._id;
            const contract = item.contractValue || 0;
            const expenses = item.totalExpenses || 0;
            const spentPct = contract > 0 ? Math.min(100, Math.round((expenses / contract) * 100)) : 0;

            return (
              <Card
                style={[styles.siteCard, isActive && styles.siteCardActive]}
                onPress={() => {
                  setActiveSite(item);
                  navigation.navigate('SiteDetail', { siteId: item._id });
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.siteName}>{item.siteName}</Text>
                    <Text style={styles.clientName}>{item.clientName} • WO: {item.workOrderNumber}</Text>
                  </View>
                  <Badge label={item.status} variant={item.status === 'ACTIVE' ? 'success' : 'danger'} />
                </View>

                {item.location ? <Text style={styles.locationText}>📍 {item.location}</Text> : null}

                {/* Spent Progress Bar & Metrics Grid for Owner */}
                {isOwner && (
                  <>
                    {contract > 0 && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressHeaderRow}>
                          <Text style={styles.progressTextLabel}>Budget Spent ({spentPct}%)</Text>
                          <Text style={styles.progressTextVal}>₹{expenses.toLocaleString('en-IN')} / ₹{contract.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${spentPct}%`, backgroundColor: spentPct > 90 ? Colors.danger : Colors.accent }
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    <View style={styles.metricsGrid}>
                      <View style={styles.mCol}>
                        <Text style={styles.mLabel}>CONTRACT VALUE</Text>
                        <Text style={styles.mVal}>₹{contract.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.mCol}>
                        <Text style={styles.mLabel}>TOTAL EXPENSES</Text>
                        <Text style={[styles.mVal, { color: Colors.danger }]}>₹{expenses.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.mCol}>
                        <Text style={styles.mLabel}>GROSS PROFIT</Text>
                        <Text style={[styles.mVal, { color: (item.profit || 0) >= 0 ? Colors.success : Colors.danger }]}>
                          ₹{(item.profit || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {isActive && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>✓ CURRENTLY ACTIVE SITE</Text>
                  </View>
                )}
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  filterGroup: { flexDirection: 'row', gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder },
  filterBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: Colors.buttonPrimaryText },
  siteCard: { marginBottom: 12, borderRadius: 14 },
  siteCardActive: { borderColor: Colors.accent, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  siteName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  clientName: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  locationText: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  progressContainer: { marginTop: 10 },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressTextLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: '700' },
  progressTextVal: { color: Colors.textPrimary, fontSize: 10, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, padding: 10, borderRadius: 10, marginTop: 10 },
  mCol: { flex: 1 },
  mLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '800' },
  mVal: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', marginTop: 2 },
  activeTag: { marginTop: 10, backgroundColor: Colors.successLight, paddingVertical: 5, borderRadius: 8, alignItems: 'center' },
  activeTagText: { color: Colors.success, fontSize: 10, fontWeight: '800' }
});
