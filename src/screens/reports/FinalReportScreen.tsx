import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { useSites } from '../../context/SiteContext';
import api, { API_BASE_URL, DEFAULT_API_URL } from '../../services/api';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';

const generateHTMLReport = (site: any, metrics: any, itemsData: any[]) => {
  const itemsRows = itemsData.map(item => {
    const addedByStr = item.addedByUsers && item.addedByUsers.length > 0 ? item.addedByUsers.join(', ') : 'Supervisor';
    return `
      <tr>
        <td>${item.itemName}</td>
        <td>${item.category}</td>
        <td style="text-align:center;">${item.totalQuantity} ${item.unit}</td>
        <td>${addedByStr}</td>
        <td style="text-align:right;">₹${(item.averageRate || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:right; font-weight:bold;">₹${(item.totalCost || 0).toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  const userRows = (metrics?.userEntrySummary || []).map((u: any) => `
    <tr>
      <td>${u.userName}</td>
      <td>${u.userRole}</td>
      <td style="text-align:center;">${u.count} entries</td>
      <td style="text-align:right; font-weight:bold;">₹${(u.totalAmount || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Site Report - ${site.siteName}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 25px; color: #0F172A; }
        .header { background-color: #1E293B; color: #FFFFFF; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .logo { color: #F59E0B; font-size: 24px; font-weight: 900; margin: 0; }
        .sub { font-size: 11px; color: #94A3B8; margin-top: 4px; }
        .meta-box { background-color: #F8FAFC; border: 1px solid #CBD5E1; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .meta-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #0F172A; }
        .meta-row { font-size: 12px; margin-bottom: 4px; color: #475569; }
        .kpi-grid { display: flex; gap: 10px; margin-bottom: 20px; }
        .kpi { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #CBD5E1; }
        .kpi-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748B; }
        .kpi-val { font-size: 16px; font-weight: bold; margin-top: 4px; }
        .sec-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #F59E0B; margin-top: 20px; margin-bottom: 8px; border-bottom: 2px solid #F59E0B; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th { background-color: #334155; color: white; font-size: 10px; text-align: left; padding: 8px; }
        td { padding: 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; }
        tr:nth-child(even) { background-color: #F8FAFC; }
        .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #94A3B8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">R&D CONSTRUCTIONS</div>
        <div class="sub">OFFICIAL SITE COST & P&L RECONCILIATION REPORT</div>
      </div>

      <div class="meta-box">
        <div class="meta-title">${site.siteName}</div>
        <div class="meta-row">Client: ${site.clientName} | Work Order #: ${site.workOrderNumber}</div>
        <div class="meta-row">Status: ${site.status} | Location: ${site.location || 'N/A'}</div>
      </div>

      <div class="kpi-grid">
        <div class="kpi" style="background:#EFF6FF; border-color:#93C5FD;">
          <div class="kpi-label" style="color:#1E40AF;">Contract Value</div>
          <div class="kpi-val" style="color:#1E3A8A;">₹${(metrics.contractValue || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi" style="background:#FEF2F2; border-color:#FCA5A5;">
          <div class="kpi-label" style="color:#991B1B;">Total Site Expenses</div>
          <div class="kpi-val" style="color:#7F1D1D;">₹${(metrics.totalCost || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi" style="background:${metrics.grossProfit >= 0 ? '#ECFDF5' : '#FEF2F2'}; border-color:${metrics.grossProfit >= 0 ? '#6EE7B7' : '#FCA5A5'};">
          <div class="kpi-label" style="color:${metrics.grossProfit >= 0 ? '#065F46' : '#991B1B'};">${metrics.grossProfit >= 0 ? 'Gross Profit' : 'Gross Loss'}</div>
          <div class="kpi-val" style="color:${metrics.grossProfit >= 0 ? '#065F46' : '#991B1B'};">₹${(metrics.grossProfit || 0).toLocaleString('en-IN')} (${metrics.profitPercentage}%)</div>
        </div>
      </div>

      <div class="sec-title">Item-Wise Quantity & Rate Summary</div>
      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Category</th>
            <th style="text-align:center;">Total Qty</th>
            <th>Added By</th>
            <th style="text-align:right;">Avg Rate</th>
            <th style="text-align:right;">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="sec-title" style="margin-top:25px;">User Entry Contribution</div>
      <table>
        <thead>
          <tr>
            <th>User Name</th>
            <th>Role</th>
            <th style="text-align:center;">Entries Logged</th>
            <th style="text-align:right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${userRows}
        </tbody>
      </table>

      <div class="footer">
        Report Generated on ${new Date().toLocaleDateString('en-IN')} via R&D CONSTRUCTIONS Contractor Management System
      </div>
    </body>
    </html>
  `;
};

export const FinalReportScreen = ({ route, navigation }: any) => {
  const { sites, activeSite, setActiveSite } = useSites();
  const routeSiteId = route.params?.siteId;

  // View mode state: 'ALL_SITES' hub or 'SITE_DETAIL' breakdown
  const [viewMode, setViewMode] = useState<'ALL_SITES' | 'SITE_DETAIL'>(
    routeSiteId ? 'SITE_DETAIL' : 'ALL_SITES'
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(
    routeSiteId || activeSite?._id || (sites.length > 0 ? sites[0]._id : null)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [itemsData, setItemsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSiteId && viewMode === 'SITE_DETAIL') {
      loadReportData(selectedSiteId);
    }
  }, [selectedSiteId, viewMode]);

  const loadReportData = async (targetSiteId: string) => {
    if (!targetSiteId || targetSiteId === 'undefined' || targetSiteId === 'null') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const resSum = await api.get(`/sites/${targetSiteId}/summary`);
      const resItems = await api.get(`/sites/${targetSiteId}/item-summary`);

      if (resSum.data?.success) setSummaryData(resSum.data);
      if (resItems.data?.success) setItemsData(resItems.data.items);
    } catch (e) {
      console.log('Error loading report preview:', e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Universal Helper to Download Site P&L Report PDF
   */
  const handleDownloadSitePDF = async (targetSiteId: string, targetSiteName: string) => {
    if (!targetSiteId || targetSiteId === 'undefined' || targetSiteId === 'null') {
      Alert.alert('Invalid Site', 'Please select a valid site before downloading the PDF report.');
      return;
    }
    setDownloadingId(`pdf_${targetSiteId}`);
    try {
      const token = await AsyncStorage.getItem('@r2r_jwt_token');
      const customUrl = await AsyncStorage.getItem('@r2r_custom_api_url');
      let baseUrl = DEFAULT_API_URL;
      if (customUrl && customUrl.trim()) {
        let formatted = customUrl.trim().replace(/\/+$/, '');
        baseUrl = formatted.endsWith('/api') ? formatted : `${formatted}/api`;
      }
      const downloadUrl = `${baseUrl}/reports/site/${targetSiteId}/pdf`;
      const sanitizedName = (targetSiteName || 'Site').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `RD_Report_${sanitizedName}_${Date.now()}.pdf`;

      // 1. Web browser download
      if ((Platform.OS as string) === 'web') {
        try {
          const response = await api.get(`/reports/site/${targetSiteId}/pdf`, { responseType: 'blob' });
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          Alert.alert('PDF Downloaded ✅', `${targetSiteName} report downloaded!`);
          return;
        } catch (webErr) {
          // Fallback to preview fetch
        }
      }

      // 2. Mobile native download
      if ((Platform.OS as string) !== 'web') {
        const localUri = `${FileSystem.documentDirectory}${fileName}`;
        try {
          const downloadRes = await FileSystem.downloadAsync(downloadUrl, localUri, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          if (downloadRes.status === 200) {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(downloadRes.uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Share / Save ${targetSiteName} Report`,
                UTI: 'com.adobe.pdf'
              });
            } else {
              await Print.printAsync({ uri: downloadRes.uri });
            }
            return;
          }
        } catch (networkErr) {
          console.log('Download network fallback:', networkErr);
        }
      }

      // 3. Client HTML fallback print
      const resSum = await api.get(`/sites/${targetSiteId}/summary`);
      const resItems = await api.get(`/sites/${targetSiteId}/item-summary`);
      if (resSum.data?.success && resItems.data?.success) {
        const htmlContent = generateHTMLReport(resSum.data.site, resSum.data.metrics, resItems.data.items);
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
        } else {
          await Print.printAsync({ uri });
        }
      }
    } catch (err: any) {
      Alert.alert('PDF Report Error', err.message || 'Failed to download report PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * Helper to Download Site Images PDF
   */
  const handleDownloadSitePhotosPDF = async (targetSiteId: string, targetSiteName: string) => {
    if (!targetSiteId || targetSiteId === 'undefined' || targetSiteId === 'null') {
      Alert.alert('Invalid Site', 'Please select a valid site before downloading photos PDF.');
      return;
    }
    setDownloadingId(`photos_${targetSiteId}`);
    try {
      const token = await AsyncStorage.getItem('@r2r_jwt_token');
      const customUrl = await AsyncStorage.getItem('@r2r_custom_api_url');
      let baseUrl = DEFAULT_API_URL;
      if (customUrl && customUrl.trim()) {
        let formatted = customUrl.trim().replace(/\/+$/, '');
        baseUrl = formatted.endsWith('/api') ? formatted : `${formatted}/api`;
      }
      const downloadUrl = `${baseUrl}/sites/${targetSiteId}/images/pdf`;
      const sanitizedName = (targetSiteName || 'Site').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${sanitizedName}_SiteImages_${Date.now()}.pdf`;

      if ((Platform.OS as string) === 'web') {
        const response = await api.get(`/sites/${targetSiteId}/images/pdf`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        Alert.alert('PDF Downloaded ✅', `${targetSiteName} photos PDF downloaded!`);
        return;
      }

      if ((Platform.OS as string) !== 'web') {
        const localUri = `${FileSystem.documentDirectory}${fileName}`;
        const downloadRes = await FileSystem.downloadAsync(downloadUrl, localUri, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (downloadRes.status === 200) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadRes.uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share / Save ${targetSiteName} Photos PDF`,
              UTI: 'com.adobe.pdf'
            });
          } else {
            await Print.printAsync({ uri: downloadRes.uri });
          }
          return;
        }
      }
    } catch (err: any) {
      Alert.alert('No Site Photos', 'No site photos uploaded for this site yet.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter sites for search query
  const filteredSites = sites.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      s.siteName.toLowerCase().includes(q) ||
      s.clientName.toLowerCase().includes(q) ||
      (s.workOrderNumber && s.workOrderNumber.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      <Header
        title="Reports Hub"
        subtitle="View and download PDF reports for all construction sites"
        navigation={navigation}
        showSiteSelector={false}
      />

      {/* TOP NAVIGATION SEGMENTS & QUICK SITE PILL BAR */}
      <View style={styles.topTabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillContainer}>
          <TouchableOpacity
            style={[styles.pillBtn, viewMode === 'ALL_SITES' && styles.pillBtnActive]}
            onPress={() => setViewMode('ALL_SITES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, viewMode === 'ALL_SITES' && styles.pillTextActive]}>
              🏢 All Sites Hub ({sites.length})
            </Text>
          </TouchableOpacity>

          {sites.map((s) => {
            const isSelected = viewMode === 'SITE_DETAIL' && selectedSiteId === s._id;
            return (
              <TouchableOpacity
                key={s._id}
                style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
                onPress={() => {
                  setSelectedSiteId(s._id);
                  setViewMode('SITE_DETAIL');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {s.siteName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* VIEW MODE 1: ALL SITES REPORTS HUB */}
      {viewMode === 'ALL_SITES' ? (
        <View style={styles.content}>
          <Input
            placeholder="🔍 Search site name, client, work order..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ marginBottom: 12 }}
          />

          <FlatList
            data={filteredSites}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={Platform.OS !== 'web'}
            renderItem={({ item }) => {
              const contract = item.contractValue || 0;
              const expenses = item.totalExpenses || 0;
              const profit = item.profit || 0;
              const isPdfDownloading = downloadingId === `pdf_${item._id}`;
              const isPhotosDownloading = downloadingId === `photos_${item._id}`;

              return (
                <Card style={styles.siteCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.siteTitle}>{item.siteName}</Text>
                      <Text style={styles.siteSub}>{item.clientName} • WO: {item.workOrderNumber}</Text>
                    </View>
                    <Badge label={item.status} variant={item.status === 'ACTIVE' ? 'success' : 'danger'} />
                  </View>

                  {/* Metrics Summary Row */}
                  <View style={styles.metricsRow}>
                    <View style={styles.mBox}>
                      <Text style={styles.mLbl}>Contract</Text>
                      <Text style={styles.mVal}>₹{contract.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.mBox}>
                      <Text style={styles.mLbl}>Expenses</Text>
                      <Text style={[styles.mVal, { color: Colors.danger }]}>₹{expenses.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.mBox}>
                      <Text style={styles.mLbl}>Est. Profit</Text>
                      <Text style={[styles.mVal, { color: profit >= 0 ? Colors.success : Colors.danger }]}>
                        ₹{profit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* DIRECT DOWNLOAD ACTION BUTTONS */}
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.downloadPdfBtn}
                      onPress={() => handleDownloadSitePDF(item._id, item.siteName)}
                      disabled={isPdfDownloading}
                    >
                      {isPdfDownloading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.downloadPdfBtnText}>📄 P&L Report PDF</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.downloadPhotosBtn}
                      onPress={() => handleDownloadSitePhotosPDF(item._id, item.siteName)}
                      disabled={isPhotosDownloading}
                    >
                      {isPhotosDownloading ? (
                        <ActivityIndicator size="small" color={Colors.textPrimary} />
                      ) : (
                        <Text style={styles.downloadPhotosBtnText}>📷 Photos PDF</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewDetailBtn}
                      onPress={() => {
                        setSelectedSiteId(item._id);
                        setViewMode('SITE_DETAIL');
                      }}
                    >
                      <Text style={styles.viewDetailBtnText}>👁️ View</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            }}
          />
        </View>
      ) : (
        /* VIEW MODE 2: DETAILED SINGLE SITE REPORT PREVIEW */
        loading || !summaryData ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Generating report preview...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Printable A4 PDF Banner */}
            <Card style={styles.pdfBannerCard}>
              <Text style={styles.pdfBannerTitle}>📄 OFFICIAL SITE COST & P&L REPORT</Text>
              <Text style={styles.pdfBannerSub}>Complete financial reconciliation report formatted for printable A4.</Text>
              <Button
                title="📥 DOWNLOAD PRINTABLE A4 PDF REPORT"
                onPress={() => handleDownloadSitePDF(summaryData.site._id || summaryData.site.id, summaryData.site.siteName)}
                loading={downloadingId === `pdf_${summaryData.site._id || summaryData.site.id}`}
                style={{ marginTop: 10 }}
              />
            </Card>

            {/* Section 1: Site Metadata Summary */}
            <Card>
              <Text style={styles.sectionHeader}>1. SITE METADATA SUMMARY</Text>
              <View style={styles.metaRow}><Text style={styles.metaLbl}>Company:</Text><Text style={styles.metaVal}>R&D CONSTRUCTIONS</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLbl}>Site Name:</Text><Text style={styles.metaVal}>{summaryData.site.siteName}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLbl}>Client Name:</Text><Text style={styles.metaVal}>{summaryData.site.clientName}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLbl}>Work Order #:</Text><Text style={styles.metaVal}>{summaryData.site.workOrderNumber}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLbl}>Contract Status:</Text><Text style={[styles.metaVal, { color: Colors.accent }]}>{summaryData.site.status}</Text></View>
            </Card>

            {/* Section 2: Financial P&L Cards */}
            <Text style={styles.sectionHeader}>2. FINANCIAL P&L SUMMARY</Text>
            <View style={styles.statsGrid}>
              <StatCard title="CONTRACT VALUE" value={`₹${summaryData.metrics.contractValue.toLocaleString('en-IN')}`} type="contract" />
              <StatCard title="TOTAL SITE COST" value={`₹${summaryData.metrics.totalCost.toLocaleString('en-IN')}`} type="expense" />
            </View>
            <View style={styles.statsGrid}>
              <StatCard title="GROSS PROFIT" value={`₹${summaryData.metrics.grossProfit.toLocaleString('en-IN')}`} type="profit" />
              <StatCard title="PROFIT MARGIN %" value={`${summaryData.metrics.profitPercentage}%`} type="profit" />
            </View>

            {/* Section 3: Item-Wise Details */}
            <Card>
              <Text style={styles.sectionHeader}>3. ITEM-WISE QUANTITY DETAILS</Text>
              {itemsData.map((item) => {
                const addedByStr = item.addedByUsers && item.addedByUsers.length > 0 ? item.addedByUsers.join(', ') : 'Supervisor';
                return (
                  <View key={`${item.itemName}-${item.unit}`} style={styles.itemRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.itemName}>{item.itemName}</Text>
                      <Text style={styles.itemCat}>{item.category}</Text>
                      <Text style={{ color: Colors.accent, fontSize: 9, fontWeight: '700', marginTop: 2 }}>👤 Added by: {addedByStr}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.itemQty}>{item.totalQuantity} {item.unit}</Text>
                      <Text style={styles.itemRate}>Avg: ₹{item.averageRate.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.itemCost}>₹{item.totalCost.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                );
              })}
            </Card>

            {/* Section 4: User Entry Contribution */}
            <Card>
              <Text style={styles.sectionHeader}>4. USER ENTRY CONTRIBUTION</Text>
              {summaryData.metrics.userEntrySummary?.map((u: any) => (
                <View key={u.userName} style={styles.userRow}>
                  <Text style={styles.userName}>{u.userName} ({u.userRole})</Text>
                  <Text style={styles.userVal}>{u.count} entries • ₹{u.totalAmount.toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </Card>

            <Button
              title="EXPORT AS CSV / EXCEL"
              onPress={() => Alert.alert('CSV Exported', `CSV exported to: ${API_BASE_URL}/reports/site/${summaryData.site._id || summaryData.site.id}/csv`)}
              variant="secondary"
              style={{ marginBottom: 40 }}
            />
          </ScrollView>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 14 },
  topTabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingVertical: 8
  },
  pillContainer: { paddingHorizontal: 14, gap: 8 },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  pillBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent
  },
  pillText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  pillTextActive: { color: '#FFFFFF' },
  siteCard: { marginBottom: 12, borderRadius: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  siteTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  siteSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12
  },
  mBox: { flex: 1 },
  mLbl: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  mVal: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 8 },
  downloadPdfBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  downloadPdfBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  downloadPhotosBtn: {
    flex: 1.5,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  downloadPhotosBtnText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '800' },
  viewDetailBtn: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  viewDetailBtnText: { color: Colors.accent, fontSize: 11, fontWeight: '800' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: Colors.textSecondary, fontSize: 13, marginTop: 10 },
  pdfBannerCard: { backgroundColor: Colors.primaryLight, borderColor: Colors.accent, marginBottom: 14 },
  pdfBannerTitle: { color: Colors.accent, fontSize: 13, fontWeight: '900' },
  pdfBannerSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2, marginBottom: 4 },
  sectionHeader: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  metaLbl: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  metaVal: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  itemName: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800' },
  itemCat: { color: Colors.textMuted, fontSize: 10 },
  itemQty: { color: Colors.accent, fontSize: 12, fontWeight: '800' },
  itemRate: { color: Colors.textMuted, fontSize: 9 },
  itemCost: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800' },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  userName: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
  userVal: { color: Colors.textSecondary, fontSize: 11 }
});
