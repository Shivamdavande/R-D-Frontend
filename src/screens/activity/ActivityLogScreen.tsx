import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { useSites } from '../../context/SiteContext';
import api from '../../services/api';
import { ActivityLogItem } from '../../types';

export const ActivityLogScreen = ({ navigation }: any) => {
  const { activeSite } = useSites();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [activeSite]);

  const loadLogs = async () => {
    if (!activeSite) return;
    setLoading(true);
    try {
      const res = await api.get(`/sites/${activeSite._id}/activity`);
      if (res.data?.success) {
        setLogs(res.data.logs);
      }
    } catch (e) {
      console.log('Error loading activity logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('ADDED')) return '➕';
    if (action.includes('UPDATED')) return '✏️';
    if (action.includes('DELETED')) return '🗑️';
    if (action.includes('CLOSED')) return '🔒';
    if (action.includes('REOPENED')) return '🔓';
    return '📝';
  };

  return (
    <View style={styles.container}>
      <Header title="Site Activity Audit Trail" subtitle={activeSite?.siteName} navigation={navigation} showSiteSelector={true} />

      <View style={styles.content}>
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLogs} tintColor={Colors.accent} />}
          ListEmptyComponent={<EmptyState title="No Activity Logs" description="Site activities and audit events will appear here in real-time." />}
          renderItem={({ item }) => (
            <Card style={styles.logCard}>
              <View style={styles.topRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.icon}>{getActionIcon(item.action)}</Text>
                  <Text style={styles.userText}>{item.userName}</Text>
                </View>
                <Text style={styles.timeText}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.detailsText}>{item.details}</Text>

              {item.previousValues && item.newValues ? (
                <View style={styles.diffBox}>
                  <Text style={styles.diffTitle}>Audit Trailed Values:</Text>
                  <Text style={styles.diffText}>Old: ₹{(item.previousValues.amount || 0).toLocaleString()}</Text>
                  <Text style={styles.diffText}>New: ₹{(item.newValues.amount || 0).toLocaleString()}</Text>
                </View>
              ) : null}
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
  logCard: { padding: 12, marginBottom: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  icon: { fontSize: 16, marginRight: 6 },
  userText: { color: Colors.accent, fontSize: 13, fontWeight: '800' },
  timeText: { color: Colors.textMuted, fontSize: 10 },
  detailsText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  diffBox: { backgroundColor: Colors.primaryLight, padding: 8, borderRadius: 6, marginTop: 6, borderWidth: 1, borderColor: Colors.surfaceBorder },
  diffTitle: { color: Colors.textMuted, fontSize: 9, fontWeight: '800' },
  diffText: { color: Colors.textSecondary, fontSize: 11 }
});
