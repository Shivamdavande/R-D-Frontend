import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { useSites } from '../../context/SiteContext';
import api, { getFullImageUrl } from '../../services/api';
import { customAlert } from '../../utils/alertHelper';

export const SiteBillsScreen = ({ route, navigation }: any) => {
  const { siteId, siteName } = route.params || {};
  const { isOwner } = useAuth();
  const { activeSite } = useSites();
  const targetSiteId = siteId || activeSite?._id;

  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [billNotes, setBillNotes] = useState('');

  useEffect(() => {
    if (targetSiteId) {
      loadBills();
    } else {
      setLoading(false);
    }
  }, [targetSiteId]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sites/${targetSiteId}/bills`);
      if (res.data?.success) {
        setBills(res.data.bills || []);
      }
    } catch (err: any) {
      console.log('Error loading site bills:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Universal File Selection & Upload (Web & Mobile Native)
   */
  const handlePickAndUploadBill = async () => {
    if (!isOwner) {
      customAlert('Access Denied 🔒', 'Only the Owner can upload bill documents.');
      return;
    }

    try {
      if (Platform.OS === 'web' || typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv,.pdf,.doc,.docx,.png,.jpg';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            await uploadSelectedFile(file, file.name);
          }
        };
        input.click();
      } else {
        const pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8
        });

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
          const asset = pickerResult.assets[0];
          const fileName = asset.fileName || `site_bill_${Date.now()}.jpg`;
          const fileObj = {
            uri: asset.uri,
            name: fileName,
            type: asset.mimeType || 'image/jpeg'
          };
          await uploadSelectedFile(fileObj, fileName);
        }
      }
    } catch (pickerErr: any) {
      console.log('Document picker error:', pickerErr);
      customAlert('Error ⚠️', 'Failed to pick bill document file.');
    }
  };

  const uploadSelectedFile = async (fileObj: any, fileName: string) => {
    setUploading(true);
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        formData.append('billFile', fileObj);
      } else {
        formData.append('billFile', {
          uri: fileObj.uri,
          name: fileObj.name,
          type: fileObj.type
        } as any);
      }

      if (billNotes) {
        formData.append('notes', billNotes);
      }

      const res = await api.post(`/sites/${targetSiteId}/bills`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        customAlert('Success ✅', `Excel bill "${fileName}" uploaded successfully!`);
        setBillNotes('');
        await loadBills();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload bill file.';
      customAlert('Upload Error ⚠️', errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenBill = async (bill: any) => {
    const staticUrl = getFullImageUrl(bill.fileUrl);

    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = staticUrl;
      link.download = bill.originalName || 'Site_Bill.xlsx';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      try {
        const token = await AsyncStorage.getItem('@r2r_jwt_token');
        const baseUrl = api.defaults.baseURL || '';
        const downloadUrl = `${baseUrl}/sites/${targetSiteId}/bills/${bill._id}/download?token=${token || ''}`;
        Linking.openURL(downloadUrl).catch(() => {
          Linking.openURL(staticUrl);
        });
      } catch (err) {
        Linking.openURL(staticUrl);
      }
    }
  };

  const handleDeleteBill = (bill: any) => {
    customAlert(
      'Delete Bill Document 🗑️',
      `Are you sure you want to delete "${bill.originalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/sites/${targetSiteId}/bills/${bill._id}`);
              if (res.data?.success) {
                customAlert('Deleted ✅', 'Bill document deleted.');
                await loadBills();
              }
            } catch (err: any) {
              const errorMsg = err.response?.data?.message || err.message || 'Failed to delete bill document.';
              customAlert('Error ⚠️', errorMsg);
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'File Attachment';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileBadgeDetails = (fileName: string = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return { label: `.${ext.toUpperCase()}`, icon: '📊', bg: '#DCFCE7', text: '#15803D' };
    }
    if (ext === 'pdf') {
      return { label: '.PDF', icon: '📄', bg: '#FEE2E2', text: '#B91C1C' };
    }
    if (ext === 'doc' || ext === 'docx') {
      return { label: `.${ext.toUpperCase()}`, icon: '📝', bg: '#DBEAFE', text: '#1E40AF' };
    }
    return { label: 'FILE', icon: '📁', bg: '#F3F4F6', text: '#374151' };
  };

  return (
    <View style={styles.container}>
      <Header
        title="Site Excel Bills"
        subtitle={siteName || 'Bill Document Vault'}
        navigation={navigation}
        showSiteSelector={false}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Modern Upload Zone for Owner */}
        {isOwner && (
          <View style={styles.uploadDropzoneCard}>
            <View style={styles.uploadHeaderRow}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 20 }}>📊</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.uploadTitle}>Attach Site Excel / Bill Sheets</Text>
                <Text style={styles.uploadSub}>Store Excel workbooks, CSVs or PDFs securely for this site</Text>
              </View>
            </View>

            <View style={styles.notesInputContainer}>
              <Input
                label="Bill Summary / Reference Notes (Optional)"
                placeholder="e.g. October Material Supplier Billing Sheet"
                value={billNotes}
                onChangeText={setBillNotes}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryUploadBtn, uploading && { opacity: 0.7 }]}
              onPress={handlePickAndUploadBill}
              activeOpacity={0.85}
              disabled={uploading}
            >
              <Text style={styles.uploadBtnIcon}>{uploading ? '⏳' : '📤'}</Text>
              <Text style={styles.primaryUploadBtnText}>
                {uploading ? 'UPLOADING BILL FILE...' : 'SELECT EXCEL FILE (.XLSX / .CSV / .PDF)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bills List Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>DOCUMENT VAULT</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{bills.length} File{bills.length === 1 ? '' : 's'}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading site bills...</Text>
          </View>
        ) : bills.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconBox}>
              <Text style={{ fontSize: 36 }}>📊</Text>
            </View>
            <Text style={styles.emptyTitle}>No Bill Documents Uploaded</Text>
            <Text style={styles.emptySubtitle}>
              {isOwner
                ? 'Click the upload button above to select and store Excel bills & documents for this site.'
                : 'No bill files have been attached for this site by the owner yet.'}
            </Text>
          </View>
        ) : (
          bills.map(bill => {
            const badge = getFileBadgeDetails(bill.originalName);
            return (
              <View key={bill._id} style={styles.billItemCard}>
                <View style={styles.billCardTop}>
                  <View style={[styles.badgeCircle, { backgroundColor: badge.bg }]}>
                    <Text style={{ fontSize: 22 }}>{badge.icon}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text style={styles.fileNameText} numberOfLines={1}>
                        {bill.originalName}
                      </Text>
                      <View style={[styles.extTag, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.extTagText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>

                    <Text style={styles.metaRowText}>
                      📅 {new Date(bill.uploadedAt || bill.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}{' '}
                      • 📦 {formatFileSize(bill.fileSize)}
                    </Text>

                    {bill.notes ? (
                      <View style={styles.noteBox}>
                        <Text style={styles.noteText}>"{bill.notes}"</Text>
                      </View>
                    ) : null}

                    {bill.uploadedBy?.name ? (
                      <Text style={styles.uploaderText}>Uploaded by: {bill.uploadedBy.name}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Actions Footer */}
                <View style={styles.cardActionsContainer}>
                  <TouchableOpacity
                    style={styles.viewDownloadBtn}
                    onPress={() => handleOpenBill(bill)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewDownloadBtnText}>👁️ View / Download Bill</Text>
                  </TouchableOpacity>

                  {isOwner && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteBill(bill)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },

  /* Dropzone Card */
  uploadDropzoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  uploadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  uploadSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  notesInputContainer: {
    marginTop: 4,
    marginBottom: 12
  },
  primaryUploadBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  uploadBtnIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#FFFFFF'
  },
  primaryUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },

  /* List Header */
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1
  },
  countPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155'
  },

  /* Loading & Empty States */
  loadingContainer: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600'
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },

  /* Bill Item Cards */
  billItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  billCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
    marginRight: 6
  },
  extTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2
  },
  extTagText: {
    fontSize: 10,
    fontWeight: '900'
  },
  metaRowText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 6
  },
  noteText: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic'
  },
  uploaderText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4
  },

  /* Card Action Buttons */
  cardActionsContainer: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  viewDownloadBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  viewDownloadBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800'
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800'
  }
});
