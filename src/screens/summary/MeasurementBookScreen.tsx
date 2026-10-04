import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { useSites } from '../../context/SiteContext';
import api from '../../services/api';

export const MeasurementBookScreen = ({ navigation }: any) => {
  const { activeSite } = useSites();
  const [mbData, setMbData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMB();
  }, [activeSite]);

  const loadMB = async () => {
    if (!activeSite) return;
    setLoading(true);
    try {
      const res = await api.get(`/sites/${activeSite._id}/measurement-book`);
      if (res.data?.success) {
        setMbData(res.data.measurementBook);
      }
    } catch (e) {
      console.log('Error loading MB:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Site Cost / Measurement Book" subtitle="Internal cost reconciliation" navigation={navigation} showSiteSelector={true} />

      <View style={styles.content}>
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeTitle}>📌 INTERNAL SITE COST MEASUREMENT</Text>
          <Text style={styles.noticeText}>
            This internal report aggregates actual site measurements, quantities, and rates for contractor internal reconciliation.
          </Text>
        </View>

        <FlatList
          data={mbData}
          keyExtractor={(item, index) => `${item.itemName}-${index}`}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMB} tintColor={Colors.accent} />}
          renderItem={({ item, index }) => {
            const addedByStr = item.addedByUsers && item.addedByUsers.length > 0 ? item.addedByUsers.join(', ') : 'Supervisor';
            return (
              <Card style={styles.card}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNum}>#{index + 1}</Text>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.catBadge}>{item.category}</Text>
                </View>

                <View style={styles.grid}>
                  <View style={styles.col}>
                    <Text style={styles.lbl}>QUANTITY</Text>
                    <Text style={styles.val}>{item.totalQuantity} {item.unit}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.lbl}>APPLICABLE RATE</Text>
                    <Text style={styles.val}>₹{item.averageRate.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.lbl}>TOTAL AMOUNT</Text>
                    <Text style={styles.amountVal}>₹{item.totalCost.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <Text style={styles.remarksText}>{item.remarks}</Text>
                  <Text style={{ color: Colors.accent, fontSize: 10, fontWeight: '700' }}>👤 Added by: {addedByStr}</Text>
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
  noticeBanner: { backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.accent, marginBottom: 12 },
  noticeTitle: { color: Colors.accent, fontSize: 11, fontWeight: '800' },
  noticeText: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  card: { padding: 12, marginBottom: 8 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemNum: { color: Colors.accent, fontWeight: '900', fontSize: 14, marginRight: 8 },
  itemName: { color: Colors.textPrimary, fontWeight: '800', fontSize: 14, flex: 1 },
  catBadge: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.inputBg, padding: 8, borderRadius: 6 },
  col: { flex: 1 },
  lbl: { color: Colors.textMuted, fontSize: 9, fontWeight: '800' },
  val: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  amountVal: { color: Colors.accent, fontSize: 13, fontWeight: '900', marginTop: 2 },
  remarksText: { color: Colors.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: 8 }
});
