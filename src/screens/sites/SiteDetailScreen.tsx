import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, Image } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { useSites } from '../../context/SiteContext';
import api, { getFullImageUrl, getThumbnailUrl } from '../../services/api';
import { Site } from '../../types';

import { customAlert } from '../../utils/alertHelper';

export const SiteDetailScreen = ({ route, navigation }: any) => {
  const rawSiteId = route.params?.siteId;
  const { activeSite, closeSite, reopenSite, deleteSite, refreshSites } = useSites();
  const siteId = rawSiteId && rawSiteId !== 'undefined' ? rawSiteId : activeSite?._id;
  const { isOwner } = useAuth();
  const [siteData, setSiteData] = useState<any>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<any>(null);
  const [siteImages, setSiteImages] = useState<any[]>([]);
  const [siteExpenses, setSiteExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingDailyReport, setSendingDailyReport] = useState(false);

  // Close Site Final Revenue & P&L Modal States
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [finalRevenueInput, setFinalRevenueInput] = useState('');
  const [closingLoading, setClosingLoading] = useState(false);

  useEffect(() => {
    if (siteId && siteId !== 'undefined') {
      loadSiteDetails();
    } else {
      setLoading(false);
    }
  }, [siteId]);

  const loadSiteDetails = async () => {
    if (!siteId || siteId === 'undefined') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [resSite, resSum, resExp, resImg] = await Promise.all([
        api.get(`/sites/${siteId}`).catch(e => ({ data: null })),
        api.get(`/sites/${siteId}/summary`).catch(e => ({ data: null })),
        api.get(`/sites/${siteId}/expenses?limit=15`).catch(e => ({ data: null })),
        api.get(`/sites/${siteId}/images`).catch(e => ({ data: null }))
      ]);

      if (resSite?.data?.success) setSiteData(resSite.data.site);
      if (resSum?.data?.success) setSummaryMetrics(resSum.data.metrics);
      if (resExp?.data?.success) setSiteExpenses(resExp.data.expenses || []);
      if (resImg?.data?.success) setSiteImages(resImg.data.images || []);
    } catch (e: any) {
      console.log('Error loading site details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDailyReport = async () => {
    if (!siteId || siteId === 'undefined') {
      customAlert('Error ⚠️', 'Invalid site selection.');
      return;
    }
    setSendingDailyReport(true);
    try {
      const res = await api.post(`/sites/${siteId}/daily-report`);
      if (res.data?.success) {
        if (res.data.reportSent === false) {
          customAlert(
            'No Activity Today ℹ️',
            res.data.message || `No items were added to "${siteData?.siteName}" today. Daily report emails are skipped when 0 items are added.`
          );
        } else {
          customAlert(
            'Daily Report Sent ✅',
            res.data.message || `Daily report sent to Owner (${res.data.ownerEmail}) with today's ${res.data.itemCount} item(s) (Total: ₹${res.data.totalAmountToday?.toLocaleString('en-IN')}).`
          );
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send daily report.';
      customAlert('Error ⚠️', errorMsg);
    } finally {
      setSendingDailyReport(false);
    }
  };

  const openCloseSiteModal = () => {
    if (!siteData) return;
    setFinalRevenueInput(siteData.contractValue ? siteData.contractValue.toString() : '');
    setShowCloseModal(true);
  };

  const handleConfirmCloseSite = async () => {
    if (!siteData) return;
    const finalRev = parseFloat(finalRevenueInput) || 0;
    setClosingLoading(true);
    try {
      await api.put(`/sites/${siteId}`, { contractValue: finalRev });
      const resData = await closeSite(siteId);
      await refreshSites();
      setShowCloseModal(false);
      
      if (resData?.emailSent === false) {
        customAlert('Site Closed ⚠️', 'Site closed successfully, but the report email could not be sent.');
      } else {
        customAlert('Site Closed ✅', 'Site closed successfully. Final report has been sent to the owner.');
      }

      navigation.navigate('FinalReport', { siteId });
    } catch (err: any) {
      customAlert('Error', err.message || 'Failed to finalize site closing.');
    } finally {
      setClosingLoading(false);
    }
  };

  const handleReopenSite = async () => {
    try {
      await reopenSite(siteId);
      await loadSiteDetails();
      customAlert('Site Reopened ✅', 'Site is now ACTIVE for supervisor entry.');
    } catch (err: any) {
      customAlert('Error', err.message);
    }
  };

  const handleDeleteSite = () => {
    customAlert(
      'Delete Site 🗑️',
      `Are you sure you want to delete "${siteData?.siteName}"? All expenses, photos, collaborators, and audit logs will be permanently deleted. This action is ONLY available to Owner and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSite(siteId);
              customAlert('Site Deleted ✅', `Site "${siteData?.siteName}" has been deleted.`, [
                { text: 'OK', onPress: () => navigation.navigate('SitesList') }
              ]);
            } catch (err: any) {
              customAlert('Error', err.message || 'Failed to delete site.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteExpense = (exp: any) => {
    customAlert(
      'Delete Expense 🗑️',
      `Are you sure you want to delete expense "${exp.itemName}" (₹${exp.amount?.toLocaleString('en-IN')})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/expenses/${exp._id}`);
              if (res.data?.success) {
                customAlert('Deleted ✅', 'Expense item deleted successfully.');
                await loadSiteDetails();
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
      <Header
        title={siteData.siteName}
        subtitle={`Client: ${siteData.clientName} • WO: ${siteData.workOrderNumber}`}
        navigation={navigation}
        showSiteSelector={false}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TOP QUICK ACTION BUTTONS */}
        {!isClosed && (
          <View style={styles.topQuickRow}>
            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => navigation.navigate('AddExpense', { siteId })}
              activeOpacity={0.85}
            >
              <View style={styles.quickBtnIconCircle}>
                <Text style={{ fontSize: 16 }}>➕</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickBtnTitle}>Add Expense</Text>
                <Text style={styles.quickBtnSub}>Material, Labour, Fuel</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickPhotoBtn}
              onPress={() => navigation.navigate('SiteImages', { siteId, siteName: siteData.siteName })}
              activeOpacity={0.85}
            >
              <View style={styles.quickBtnIconCircle}>
                <Text style={{ fontSize: 16 }}>📷</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickBtnTitle}>Site Photos</Text>
                <Text style={styles.quickBtnSub}>{siteImages.length} Uploaded</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Financial Overview Card */}
        <Card style={styles.financialCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.financialCardTitle}>🏗️ {siteData.siteName}</Text>
              {siteData.location ? (
                <Text style={styles.locationText}>📍 {siteData.location}</Text>
              ) : null}
            </View>
            <Badge label={siteData.status} variant={isClosed ? 'danger' : 'success'} />
          </View>

          {isOwner && (
            <>
              <View style={styles.statsGrid}>
                <StatCard title="CONTRACT VALUE" value={`₹${(siteData.contractValue || 0).toLocaleString('en-IN')}`} type="contract" />
                <StatCard title="TOTAL EXPENSES" value={`₹${(siteData.totalExpenses || 0).toLocaleString('en-IN')}`} type="expense" />
              </View>
              <View style={styles.statsGrid}>
                <StatCard title="REMAINING BUDGET" value={`₹${(siteData.contractValue - siteData.totalExpenses).toLocaleString('en-IN')}`} type="contract" />
                <StatCard title="GROSS PROFIT" value={`₹${(siteData.profit || 0).toLocaleString('en-IN')}`} subtitle={`${siteData.profitPercentage}% Margin`} type="profit" />
              </View>
            </>
          )}
        </Card>

        {/* SITE EXPENSES & INLINE DELETE SECTION */}
        <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.cardSectionTitle}>📑 Site Expenses ({siteExpenses.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExpenseList', { siteId })}>
              <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '800' }}>Manage All Log ➔</Text>
            </TouchableOpacity>
          </View>

          {siteExpenses.length > 0 ? (
            siteExpenses.map((exp: any) => {
              const addedBy = exp.createdBy && typeof exp.createdBy === 'object' ? (exp.createdBy.name || 'Supervisor') : 'Supervisor';
              return (
                <View key={exp._id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder }}>
                  <TouchableOpacity style={{ flex: 1, marginRight: 8 }} onPress={() => navigation.navigate('ExpenseDetail', { expenseId: exp._id })}>
                    <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '800' }}>{exp.itemName}</Text>
                    <Text style={{ color: Colors.textSecondary, fontSize: 11, marginTop: 2 }}>{exp.quantity} {exp.unit} × ₹{exp.rate.toLocaleString('en-IN')} • By {addedBy}</Text>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                      <Badge label={exp.category} variant="category" categoryName={exp.category} />
                    </View>
                  </TouchableOpacity>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={{ color: Colors.accent, fontSize: 15, fontWeight: '900' }}>₹{exp.amount.toLocaleString('en-IN')}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(exp)}
                      style={{ backgroundColor: Colors.dangerLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: Colors.danger }}
                    >
                      <Text style={{ color: Colors.danger, fontSize: 11, fontWeight: '800' }}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ color: Colors.textMuted, fontSize: 12, fontStyle: 'italic', marginVertical: 6 }}>
              No expense entries recorded on this site yet. Tap "+ Add Expense" to record one.
            </Text>
          )}
        </Card>

        {/* SITE IMAGES COMPACT PREVIEW SECTION (Requirement #25) */}
        <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.cardSectionTitle}>📷 Site Photos ({siteImages.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SiteImages', { siteId, siteName: siteData.siteName })}>
              <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '800' }}>View Gallery ({siteImages.length}) ➔</Text>
            </TouchableOpacity>
          </View>

          {siteImages.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 4 }}>
              {siteImages.slice(0, 3).map((img, idx) => (
                <TouchableOpacity
                  key={img._id || idx}
                  style={{ width: 70, height: 70, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.surfaceSecondary, borderWidth: 1, borderColor: Colors.surfaceBorder }}
                  onPress={() => navigation.navigate('SiteImages', { siteId, siteName: siteData.siteName })}
                >
                  <Image source={{ uri: getThumbnailUrl(img.imageUrl, 150, 150) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </TouchableOpacity>
              ))}
              {siteImages.length > 3 && (
                <TouchableOpacity
                  style={{ width: 70, height: 70, borderRadius: 10, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent }}
                  onPress={() => navigation.navigate('SiteImages', { siteId, siteName: siteData.siteName })}
                >
                  <Text style={{ color: Colors.accent, fontWeight: '800', fontSize: 13 }}>+{siteImages.length - 3}</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 9 }}>more</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={{ color: Colors.textMuted, fontSize: 12, fontStyle: 'italic', marginVertical: 6 }}>
              No photos added yet. Capture site photos to keep a visual record.
            </Text>
          )}

          <Button
            title="📷 + TAKE SITE PHOTO"
            onPress={() => navigation.navigate('SiteImages', { siteId, siteName: siteData.siteName })}
            variant="outline"
            size="small"
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* Category Breakdown */}
        {summaryMetrics?.categoryBreakdown && summaryMetrics.categoryBreakdown.length > 0 ? (
          <Card>
            <Text style={styles.cardSectionTitle}>🏷️ Category Cost Breakdown</Text>
            {summaryMetrics.categoryBreakdown.map((cat: any) => {
              const pct = siteData.totalExpenses > 0 ? ((cat.totalAmount / siteData.totalExpenses) * 100).toFixed(1) : '0';
              return (
                <View key={cat._id} style={styles.catRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat._id}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${pct}%` as any }]} />
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.cardSectionTitle}>👥 Site Team & Collaborators ({siteData.members?.length || 0})</Text>
            {isOwner && (
              <TouchableOpacity onPress={() => navigation.navigate('SiteMembers', { siteId })}>
                <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '800' }}>Manage Team ⚙️</Text>
              </TouchableOpacity>
            )}
          </View>

          {siteData.members?.map((m: any) => {
            const memberUser = m.userId || {};
            return (
              <View key={m._id} style={styles.memberRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{memberUser.name || 'User'}</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 11 }}>{memberUser.email}</Text>
                </View>
                <Badge label={m.role} variant={m.role === 'OWNER' ? 'warning' : 'info'} />
              </View>
            );
          })}

          {isOwner && (
            <Button
              title="👷 + ASSIGN SUPERVISOR TO THIS SITE"
              onPress={() => navigation.navigate('SiteMembers', { siteId })}
              variant="outline"
              size="small"
              style={{ marginTop: 12 }}
            />
          )}
        </Card>

        {/* Quick Action Navigation Grid */}
        <Text style={styles.sectionHeader}>REPORTS & MANAGEMENT TOOLS</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('SiteImages', { siteId, siteName: siteData.siteName })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.actionIcon}>📷</Text>
            </View>
            <Text style={styles.actionTitle}>Site Photos</Text>
            <Text style={styles.actionSub}>{siteImages.length} Photos Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ItemSummary', { siteId })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.actionIcon}>📊</Text>
            </View>
            <Text style={styles.actionTitle}>Item Summary</Text>
            <Text style={styles.actionSub}>Materials & Rates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MeasurementBook', { siteId })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#F3E8FF' }]}>
              <Text style={styles.actionIcon}>📐</Text>
            </View>
            <Text style={styles.actionTitle}>Cost / MB Book</Text>
            <Text style={styles.actionSub}>Reconciliation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ActivityLog', { siteId })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.actionIcon}>📜</Text>
            </View>
            <Text style={styles.actionTitle}>Audit Log</Text>
            <Text style={styles.actionSub}>History & Edits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('SiteBills', { siteId, siteName: siteData.siteName })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.actionIcon}>📁</Text>
            </View>
            <Text style={styles.actionTitle}>Excel Bills</Text>
            <Text style={styles.actionSub}>Bill Attachments</Text>
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleSendDailyReport}
              activeOpacity={0.8}
              disabled={sendingDailyReport}
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.actionIcon}>📧</Text>
              </View>
              <Text style={styles.actionTitle}>Daily Report Email</Text>
              <Text style={styles.actionSub}>{sendingDailyReport ? 'Sending...' : 'Send Today\'s Items'}</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('FinalReport', { siteId })}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#FFE4E6' }]}>
                <Text style={styles.actionIcon}>📄</Text>
              </View>
              <Text style={styles.actionTitle}>Final Report</Text>
              <Text style={styles.actionSub}>Export Printable PDF</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SITE CLOSING & DELETION ADMIN CONTROLS (OWNER ONLY - AT THE VERY BOTTOM) */}
        {isOwner && (
          <View style={styles.adminBox}>
            <Text style={styles.adminTitle}>SITE CLOSING & MANAGEMENT (OWNER ONLY)</Text>
            
            {/* CLOSE SITE SECTION - DISTINCT AMBER ORANGE COLOR */}
            {isClosed ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.closedNote}>This site is currently CLOSED. Supervisors cannot add new expenses.</Text>
                <Button title="🔓 REOPEN SITE WORKSPACE" onPress={handleReopenSite} variant="success" style={{ marginTop: 10 }} />
              </View>
            ) : (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.closedNote}>Closing site will calculate final net profit/loss, lock expense entries, and generate the PDF report.</Text>
                <TouchableOpacity
                  onPress={openCloseSiteModal}
                  style={styles.closeSiteBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeSiteBtnText}>🔒 CLOSE THIS SITE & RECONCILE P&L</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* DELETE SITE SECTION - DISTINCT CRIMSON RED DANGER COLOR */}
            <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder }}>
              <Text style={{ color: Colors.danger, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>⚠️ DANGER ZONE - PERMANENT DELETION</Text>
              <Text style={styles.closedNote}>Permanently delete this site along with all expenses, photos, and team access.</Text>
              <TouchableOpacity
                onPress={handleDeleteSite}
                style={styles.deleteSiteBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteSiteBtnText}>🗑️ DELETE THIS SITE PERMANENTLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* CLOSE SITE & FINAL RECONCILIATION MODAL */}
      <Modal visible={showCloseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🔒 Close Site & Finalize P&L</Text>

            <Text style={styles.modalSub}>
              Enter the final revenue / total payment received from client for "{siteData?.siteName}":
            </Text>

            <Input
              label="FINAL REVENUE / PAYMENT RECEIVED (₹) *"
              placeholder="e.g. 1250000"
              prefix="₹"
              value={finalRevenueInput}
              onChangeText={setFinalRevenueInput}
              keyboardType="numeric"
            />

            {/* LIVE CALCULATION COMPARISON BOX */}
            {(() => {
              const rev = parseFloat(finalRevenueInput) || 0;
              const exp = siteData?.totalExpenses || 0;
              const net = rev - exp;
              const isProfit = net >= 0;

              return (
                <View style={[styles.calcBox, isProfit ? styles.calcBoxProfit : styles.calcBoxLoss]}>
                  <Text style={styles.calcLabel}>REAL-TIME P&L RECONCILIATION:</Text>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcText}>Final Payment Received:</Text>
                    <Text style={styles.calcVal}>₹{rev.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcText}>Total Site Items/Expenses:</Text>
                    <Text style={[styles.calcVal, { color: Colors.danger }]}>₹{exp.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.calcRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: isProfit ? Colors.success : Colors.danger }]}>
                    <Text style={[styles.netLabel, { color: isProfit ? Colors.success : Colors.danger }]}>
                      {isProfit ? '🎉 NET PROFIT:' : '⚠️ NET LOSS:'}
                    </Text>
                    <Text style={[styles.netVal, { color: isProfit ? Colors.success : Colors.danger }]}>
                      ₹{Math.abs(net).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Button title="CANCEL" onPress={() => setShowCloseModal(false)} variant="secondary" size="small" />
              </View>
              <View style={{ flex: 1.5 }}>
                <Button title="🔒 CONFIRM & REPORT" onPress={handleConfirmCloseSite} loading={closingLoading} variant="danger" size="small" />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  financialCard: { marginBottom: 12, padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  financialCardTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  locationText: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  addBtn: { marginVertical: 8, elevation: 2, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  sectionHeader: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -4 },
  cardSectionTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800', letterSpacing: 0.3, marginBottom: 12 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catName: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: Colors.inputBg, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: Colors.accent, borderRadius: 3 },
  catVal: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800' },
  catPct: { color: Colors.textMuted, fontSize: 10 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  memberName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  topQuickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickAddBtn: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  quickPhotoBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  quickBtnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  quickBtnTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  quickBtnSub: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 10, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  actionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  actionIcon: { fontSize: 22 },
  actionTitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  actionSub: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  adminBox: { backgroundColor: Colors.primaryLight, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 30 },
  adminTitle: { color: Colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  closedNote: { color: Colors.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 16, marginBottom: 6 },
  closeSiteBtn: {
    backgroundColor: '#D97706', // Distinct Warning Amber/Orange Color for Close Site
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  closeSiteBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3
  },
  deleteSiteBtn: {
    backgroundColor: '#DC2626', // Distinct Crimson Red Danger Color for Delete Site
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  deleteSiteBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4
  },
  modalSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 14
  },
  calcBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10
  },
  calcBoxProfit: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success
  },
  calcBoxLoss: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger
  },
  calcLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Colors.textMuted,
    marginBottom: 6
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2
  },
  calcText: {
    color: Colors.textSecondary,
    fontSize: 12
  },
  calcVal: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '900'
  },
  netVal: {
    fontSize: 16,
    fontWeight: '900'
  }
});
