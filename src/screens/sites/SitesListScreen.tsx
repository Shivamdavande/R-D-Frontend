import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useSites } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';

export const SitesListScreen = ({ navigation }: any) => {
  const { isOwner } = useAuth();
  const { sites, activeSite, setActiveSite, refreshSites, isLoading } = useSites();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  const filteredSites = sites.filter(s => filter === 'ALL' || s.status === filter);

  return (
    <View style={styles.container}>
      <Header title="Construction Sites" subtitle="All assigned work sites" navigation={navigation} showSiteSelector={false} />

      <View style={styles.content}>
        {/* Create Site & Filter Bar */}
        <View style={styles.topBar}>
          <View style={styles.filterGroup}>
            {(['ALL', 'ACTIVE', 'CLOSED'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isOwner && (
            <Button
              title="+ NEW SITE"
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
          renderItem={({ item }) => {
            const isActive = activeSite?._id === item._id;
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
                    <Text style={styles.clientName}>{item.clientName} (WO: {item.workOrderNumber})</Text>
                  </View>
                  <Badge label={item.status} variant={item.status === 'ACTIVE' ? 'success' : 'danger'} />
                </View>

                {item.location ? <Text style={styles.locationText}>📍 {item.location}</Text> : null}

                <View style={styles.metricsGrid}>
                  <View style={styles.mCol}>
                    <Text style={styles.mLabel}>CONTRACT VALUE</Text>
                    <Text style={styles.mVal}>₹{(item.contractValue || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.mCol}>
                    <Text style={styles.mLabel}>TOTAL EXPENSES</Text>
                    <Text style={[styles.mVal, { color: Colors.danger }]}>₹{(item.totalExpenses || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.mCol}>
                    <Text style={styles.mLabel}>ESTIMATED PROFIT</Text>
                    <Text style={[styles.mVal, { color: Colors.success }]}>₹{(item.profit || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {isActive && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>CURRENTLY SELECTED ACTIVE SITE ✓</Text>
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
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder },
  filterBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: Colors.buttonPrimaryText },
  siteCard: { marginBottom: 10 },
  siteCardActive: { borderColor: Colors.accent, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  siteName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  clientName: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  locationText: { color: Colors.textMuted, fontSize: 11, marginTop: 6 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, padding: 10, borderRadius: 8, marginTop: 10 },
  mCol: { flex: 1 },
  mLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '800' },
  mVal: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', marginTop: 2 },
  activeTag: { marginTop: 10, backgroundColor: Colors.successLight, paddingVertical: 4, borderRadius: 4, alignItems: 'center' },
  activeTagText: { color: Colors.success, fontSize: 10, fontWeight: '800' }
});
