import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Linking,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import api, { DEFAULT_API_URL, getFullImageUrl, getThumbnailUrl } from '../../services/api';
import { SiteImage } from '../../types';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 2;

/**
 * Memoized Grid Item Component to prevent unnecessary re-rendering during scroll
 */
const GridGalleryItem = React.memo(({ item, onPress }: { item: SiteImage; onPress: (img: SiteImage) => void }) => {
  return (
    <TouchableOpacity
      style={styles.gridItem}
      activeOpacity={0.85}
      onPress={() => onPress(item)}
    >
      <Image
        source={{ uri: getThumbnailUrl(item.imageUrl, 350, 350) }}
        style={styles.gridImage}
        resizeMode="cover"
      />
      <View style={styles.gridImageOverlay}>
        <Text style={styles.gridImageDate}>
          {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('en-IN') : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export const SiteImagesScreen = ({ route, navigation }: any) => {
  const { siteId, siteName } = route.params || {};
  const { user, isOwner } = useAuth();

  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Take Photo / Preview State
  const [capturedAsset, setCapturedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('Uploading photo...');

  // Selected Image Detail View Modal State
  const [selectedImage, setSelectedImage] = useState<SiteImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fullImageError, setFullImageError] = useState(false);

  // PDF Exporting State
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    loadImages();
  }, [siteId]);

  // Reset error state when a new image is selected
  useEffect(() => {
    if (selectedImage) {
      setFullImageError(false);
    }
  }, [selectedImage]);

  /**
   * Helper to format file size from asset
   */
  const getAssetSizeInfo = (asset: ImagePicker.ImagePickerAsset | null) => {
    if (!asset) return { bytes: 0, text: '' };
    let bytes = asset.fileSize || 0;
    if (!bytes && asset.base64) {
      bytes = Math.round((asset.base64.length * 3) / 4);
    }
    if (!bytes) return { bytes: 0, text: '' };

    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return { bytes, text: `${mb.toFixed(1)} MB`, isLarge: mb > 1.5 };
    }
    const kb = bytes / 1024;
    return { bytes, text: `${Math.round(kb)} KB`, isLarge: false };
  };

  /**
   * Compresses image down to ~100-200 KB using expo-image-manipulator before uploading
   */
  const compressImageTo100_200KB = async (uri: string, originalBase64?: string): Promise<ImagePicker.ImagePickerAsset> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Resize resolution to max 1200px width
        { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      let calculatedSize = 0;
      if (Platform.OS !== 'web' && manipResult.uri) {
        const info = await FileSystem.getInfoAsync(manipResult.uri);
        if (info.exists && 'size' in info) {
          calculatedSize = info.size;
        }
      }

      if (!calculatedSize && manipResult.base64) {
        calculatedSize = Math.round((manipResult.base64.length * 3) / 4);
      }

      console.log(`Client compressed image size: ${(calculatedSize / 1024).toFixed(1)} KB`);

      return {
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
        fileSize: calculatedSize,
        base64: manipResult.base64 || originalBase64
      } as ImagePicker.ImagePickerAsset;
    } catch (err) {
      console.error('Image compression error, using original:', err);
      return { uri, base64: originalBase64 } as ImagePicker.ImagePickerAsset;
    }
  };

  const loadImages = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = await api.get(`/sites/${siteId}/images`);
      if (res.data?.success) {
        setImages(res.data.images || []);
      }
    } catch (err: any) {
      console.log('Error fetching site images:', err);
      setImages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Camera permission & photo capture flow with automatic ~100-200KB compression
   */
  const handleTakePhoto = async () => {
    try {
      // 1. Check camera permissions
      const permissionRes = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionRes.granted) {
        if (!permissionRes.canAskAgain) {
          Alert.alert(
            'Camera Access Required',
            'Camera access is required to take site photos. Please allow camera access from your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        } else {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to take site photos.',
            [{ text: 'Allow Camera', onPress: handleTakePhoto }, { text: 'Cancel', style: 'cancel' }]
          );
        }
        return;
      }

      // 2. Launch Camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'] as any,
        quality: 0.8,
        allowsEditing: false,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoAsset = result.assets[0];

        // Compress photo to 100-200 KB target range
        const compressedAsset = await compressImageTo100_200KB(photoAsset.uri, photoAsset.base64 || undefined);
        setCapturedAsset(compressedAsset);
        setShowPreviewModal(true);

        // Auto-save captured photo to phone gallery
        if (Platform.OS !== 'web' && photoAsset.uri) {
          try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
              await MediaLibrary.saveToLibraryAsync(photoAsset.uri);
              console.log('Photo automatically saved to device gallery.');
            }
          } catch (libErr) {
            console.log('Notice: Gallery auto-save skipped:', libErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Error opening camera:', err);
      Alert.alert('Camera Error', 'Could not access device camera.');
    }
  };

  /**
   * Pick image from phone gallery flow with automatic ~100-200KB compression
   */
  const handlePickFromGallery = async () => {
    try {
      const permissionRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionRes.granted) {
        Alert.alert('Permission Required', 'Gallery access is required to choose photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        quality: 0.8,
        allowsEditing: false,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedAsset = result.assets[0];

        // Compress photo to 100-200 KB target range
        const compressedAsset = await compressImageTo100_200KB(pickedAsset.uri, pickedAsset.base64 || undefined);
        setCapturedAsset(compressedAsset);
        setShowPreviewModal(true);
      }
    } catch (err: any) {
      console.error('Error opening gallery:', err);
      Alert.alert('Gallery Error', 'Could not open photo gallery.');
    }
  };

  /**
   * Manual helper to save/download any photo to phone gallery
   */
  const handleSavePhotoToGallery = async (imageUrl: string) => {
    try {
      if (Platform.OS === 'web') {
        const fullUrl = getFullImageUrl(imageUrl);
        const a = document.createElement('a');
        a.href = fullUrl;
        a.target = '_blank';
        a.download = `site_photo_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Alert.alert('Photo Downloaded ✅', 'Photo saved to your downloads.');
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Storage permission is required to save photos to your gallery.');
        return;
      }

      const fullUrl = getFullImageUrl(imageUrl);
      const localUri = `${FileSystem.cacheDirectory}photo_${Date.now()}.jpg`;
      const downloadRes = await FileSystem.downloadAsync(fullUrl, localUri);

      if (downloadRes.status === 200) {
        await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
        Alert.alert('Saved to Gallery 💾', 'Photo has been saved to your phone gallery successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (e: any) {
      Alert.alert('Save Failed', e.message || 'Could not save photo to gallery.');
    }
  };

  /**
   * Confirm photo upload to ImageKit via backend
   */
  const handleConfirmUpload = async () => {
    if (!capturedAsset || uploading) return;
    setUploading(true);

    const sizeInfo = getAssetSizeInfo(capturedAsset);
    if (sizeInfo.isLarge) {
      setUploadProgressText(`Uploading Large Photo (${sizeInfo.text})... Please wait`);
    } else if (sizeInfo.text) {
      setUploadProgressText(`Uploading Photo (${sizeInfo.text})...`);
    } else {
      setUploadProgressText('Uploading photo...');
    }

    try {
      const formData = new FormData();
      const filename = capturedAsset.uri.split('/').pop() || `site_photo_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        if (capturedAsset.base64) {
          await api.post(`/sites/${siteId}/images`, {
            imageBase64: capturedAsset.base64,
            fileName: filename
          });
        } else {
          const fetchRes = await fetch(capturedAsset.uri);
          const blob = await fetchRes.blob();
          formData.append('image', blob, filename);
          await api.post(`/sites/${siteId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // Native mobile multipart form upload
        formData.append('image', {
          uri: capturedAsset.uri,
          name: filename,
          type
        } as any);

        await api.post(`/sites/${siteId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      Alert.alert('Success ✅', 'Photo uploaded successfully.');
      setShowPreviewModal(false);
      setCapturedAsset(null);
      await loadImages();
    } catch (err: any) {
      console.error('Upload failed error:', err);
      Alert.alert('Photo upload failed', 'Could not upload photo to server. Please try again.', [
        { text: 'Try Again', onPress: () => handleConfirmUpload() },
        { text: 'Cancel', style: 'cancel' }
      ]);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Delete Photo
   */
  const executeDelete = async () => {
    if (!selectedImage) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/sites/${siteId}/images/${selectedImage._id}`);
      if (res.data?.success) {
        if (Platform.OS === 'web') {
          window.alert('Site photo deleted successfully.');
        } else {
          Alert.alert('Deleted ✅', 'Site photo deleted successfully.');
        }
        setSelectedImage(null);
        await loadImages();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to delete photo.';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${errMsg}`);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePhoto = () => {
    if (!selectedImage) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Delete this site photo? This action cannot be undone.');
      if (confirmed) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Delete Photo',
        'Delete this site photo? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: executeDelete
          }
        ]
      );
    }
  };

  /**
   * Export ALL site images as ONE single PDF
   */
  const handleExportPDF = async () => {
    if (images.length === 0) {
      Alert.alert(
        'No Site Photos',
        'No site photos available. Take at least one photo before exporting the PDF.',
        [
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    setExportingPDF(true);
    try {
      const sanitizedName = (siteName || 'Site').replace(/[^a-zA-Z0-9_-]/g, '_');
      const today = new Date().toISOString().split('T')[0];
      const pdfFileName = `${sanitizedName}_SiteImages_${today}.pdf`;

      const token = await AsyncStorage.getItem('@r2r_jwt_token');
      const customUrl = await AsyncStorage.getItem('@r2r_custom_api_url');
      let baseUrl = DEFAULT_API_URL;
      if (customUrl && customUrl.trim()) {
        let formatted = customUrl.trim().replace(/\/+$/, '');
        baseUrl = formatted.endsWith('/api') ? formatted : `${formatted}/api`;
      }
      const downloadUrl = `${baseUrl}/sites/${siteId}/images/pdf`;

      // Web platform export
      if (Platform.OS === 'web') {
        try {
          const response = await api.get(`/sites/${siteId}/images/pdf`, { responseType: 'blob' });
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = pdfFileName;
          link.click();
          Alert.alert('PDF Exported ✅', 'Site Images PDF downloaded successfully!');
          return;
        } catch (e) {
          // Fallback to local expo-print
        }
      }

      // Try downloading from backend endpoint first on mobile native
      if (Platform.OS !== 'web') {
        const localUri = `${FileSystem.documentDirectory}${pdfFileName}`;
        try {
          const downloadRes = await FileSystem.downloadAsync(downloadUrl, localUri, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          if (downloadRes.status === 200) {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(downloadRes.uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share / Save Site Images PDF',
                UTI: 'com.adobe.pdf'
              });
            } else {
              await Print.printAsync({ uri: downloadRes.uri });
            }
            return;
          }
        } catch (backendErr) {
          console.log('Backend PDF export fallback to local expo-print HTML:', backendErr);
        }
      }

      // Offline / Local Expo-Print HTML fallback matching user's exact reference format (4 photos / page)
      const imagesHtml = images.map((img, idx) => `
        <div class="photo-cell ${idx > 0 && idx % 4 === 0 ? 'page-break' : ''}">
          <img class="photo-img" src="${getFullImageUrl(img.imageUrl)}" alt="Site Photo ${idx + 1}" />
        </div>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${siteName} - Site Images</title>
          <style>
            @page { size: A4; margin: 15px; }
            body { font-family: Arial, sans-serif; padding: 15px; margin: 0; color: #000000; border: 1px solid #000000; box-sizing: border-box; min-height: 96vh; }
            .header-title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 20px; color: #000000; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .photo-cell { height: 370px; display: flex; align-items: center; justify-content: center; overflow: hidden; page-break-inside: avoid; }
            .photo-img { width: 100%; height: 100%; object-fit: contain; }
            .page-break { page-break-before: always; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header-title">
            ${siteName || 'Site Project'} Photographs during visit dated ${new Date().toLocaleDateString('en-IN')}
          </div>
          <div class="grid">
            ${imagesHtml}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share / Save Site Images PDF',
          UTI: 'com.adobe.pdf'
        });
      } else {
        await Print.printAsync({ uri });
      }
    } catch (err: any) {
      Alert.alert('PDF Export Error', err.message || 'Failed to export images PDF.');
    } finally {
      setExportingPDF(false);
    }
  };

  /**
   * Helper to format image uploader string
   */
  const getUploaderName = (img: SiteImage) => {
    if (!img.uploadedBy) return 'Team Member';
    if (typeof img.uploadedBy === 'string') return 'Team Member';
    return img.uploadedBy.name || 'Team Member';
  };

  // Check if current user can delete selected photo
  const canDeleteCurrentPhoto = () => {
    if (!selectedImage || !user) return false;
    if (isOwner) return true;
    const uploaderObj = selectedImage.uploadedBy as any;
    const uploaderId = typeof uploaderObj === 'string' ? uploaderObj : (uploaderObj?._id || uploaderObj?.id);
    return uploaderId === user.id;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Site Images"
        subtitle={`${siteName || 'Site Project'} • ${images.length} Photos`}
        navigation={navigation}
        showSiteSelector={false}
      />

      {/* ACTION TOOLBAR */}
      <View style={styles.actionHeaderBar}>
        <TouchableOpacity style={styles.takePhotoBtn} onPress={handleTakePhoto}>
          <Text style={styles.takePhotoBtnText}>📷 Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
          <Text style={styles.galleryBtnText}>📁 Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportPdfBtn, images.length === 0 && styles.exportPdfBtnDisabled]}
          onPress={handleExportPDF}
          disabled={exportingPDF}
        >
          {exportingPDF ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.exportPdfBtnText}>📄 Export PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* GALLERY BODY */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading site photos...</Text>
        </View>
      ) : images.length === 0 ? (
        /* EMPTY STATE (Requirement #27) */
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>No site photos added yet.</Text>
            <Text style={styles.emptySub}>
              Capture photos of the site, materials or completed work to keep a visual record.
            </Text>
            <View style={{ gap: 10, width: '100%', marginTop: 16 }}>
              <Button title="📷 TAKE PHOTO" onPress={handleTakePhoto} variant="primary" />
              <Button title="📁 CHOOSE FROM GALLERY" onPress={handlePickFromGallery} variant="secondary" />
              <Button
                title="📄 EXPORT IMAGES AS PDF"
                onPress={handleExportPDF}
                variant="outline"
              />
            </View>
          </Card>
        </ScrollView>
      ) : (
        /* 2-COLUMN GRID GALLERY (Requirement #7) with virtualization optimizations */
        <FlatList
          data={images}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.gridList}
          showsVerticalScrollIndicator={false}
          onRefresh={loadImages}
          refreshing={refreshing}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={(data, index) => ({
            length: GRID_ITEM_SIZE + 12,
            offset: (GRID_ITEM_SIZE + 12) * Math.floor(index / 2),
            index
          })}
          renderItem={({ item }) => <GridGalleryItem item={item} onPress={setSelectedImage} />}
        />
      )}

      {/* 1. PHOTO PREVIEW MODAL (Requirement #4) */}
      <Modal visible={showPreviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.previewContainer}>
            <Text style={styles.modalHeaderTitle}>PHOTO PREVIEW</Text>
            <Text style={styles.modalHeaderSub}>Confirm photo before uploading to site gallery</Text>

            {capturedAsset && (
              <View style={styles.previewImageBox}>
                <Image
                  source={{ uri: capturedAsset.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {capturedAsset && getAssetSizeInfo(capturedAsset).text ? (
              <View style={styles.sizeBadgeBox}>
                <Text style={styles.sizeBadgeText}>
                  ⚡ Compressed Size: {getAssetSizeInfo(capturedAsset).text} (Target: ~100-200 KB)
                </Text>
              </View>
            ) : null}

            {uploading ? (
              <View style={styles.uploadingOverlayCard}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={styles.uploadingTitle}>
                  {getAssetSizeInfo(capturedAsset).isLarge ? '⚡ Uploading Large Photo...' : '📤 Uploading Photo...'}
                </Text>
                <Text style={styles.uploadingSub}>{uploadProgressText}</Text>
              </View>
            ) : (
              <View style={styles.previewActionRow}>
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => {
                    setShowPreviewModal(false);
                    setCapturedAsset(null);
                    handleTakePhoto();
                  }}
                  disabled={uploading}
                >
                  <Text style={styles.retakeBtnText}>🔄 Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                  onPress={handleConfirmUpload}
                  disabled={uploading}
                >
                  <Text style={styles.uploadBtnText}>📤 Upload Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. FULL SCREEN DETAIL & DELETE MODAL (Requirement #8, #9) */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.fullScreenOverlay}>
          <View style={styles.fullScreenHeader}>
            <View>
              <Text style={styles.fullScreenDate}>
                {selectedImage?.uploadedAt ? new Date(selectedImage.uploadedAt).toLocaleString('en-IN') : ''}
              </Text>
              <Text style={styles.fullScreenUploader}>
                Uploaded by: {selectedImage ? getUploaderName(selectedImage) : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
              <Text style={styles.closeBtnText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.fullScreenImageBox}>
              {fullImageError && (
                <View style={styles.fullImageLoadingBox}>
                  <Text style={{ color: '#F87171', fontSize: 13, fontWeight: '700' }}>⚠️ Image unavailable or failed to load</Text>
                </View>
              )}
              <Image
                source={{ uri: getFullImageUrl(selectedImage.imageUrl) }}
                style={styles.fullScreenImage}
                resizeMode="contain"
                onError={() => setFullImageError(true)}
              />
            </View>
          )}

          <View style={styles.fullScreenFooter}>
            <TouchableOpacity
              style={styles.saveGalleryBtn}
              onPress={() => selectedImage && handleSavePhotoToGallery(selectedImage.imageUrl)}
            >
              <Text style={styles.saveGalleryBtnText}>💾 Save to Gallery</Text>
            </TouchableOpacity>

            {canDeleteCurrentPhoto() && (
              <TouchableOpacity
                style={styles.deletePhotoBtn}
                onPress={handleDeletePhoto}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deletePhotoBtnText}>🗑️ Delete Photo</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  actionHeaderBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder
  },
  takePhotoBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  takePhotoBtnText: {
    color: Colors.buttonPrimaryText,
    fontWeight: '800',
    fontSize: 13
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent
  },
  galleryBtnText: {
    color: Colors.accent,
    fontWeight: '800',
    fontSize: 13
  },
  exportPdfBtn: {
    flex: 1,
    backgroundColor: Colors.textPrimary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exportPdfBtnDisabled: {
    opacity: 0.6
  },
  exportPdfBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 10
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    width: '100%'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center'
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },
  gridList: {
    padding: 16,
    gap: 12
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  gridImage: {
    width: '100%',
    height: '100%'
  },
  gridImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  gridImageDate: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  previewContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxHeight: '90%'
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center'
  },
  modalHeaderSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12
  },
  previewImageBox: {
    width: '100%',
    height: 320,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  previewActionRow: {
    flexDirection: 'row',
    gap: 10
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  retakeBtnText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 13
  },
  uploadBtn: {
    flex: 1.5,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  uploadBtnDisabled: {
    opacity: 0.7
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between'
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  fullScreenDate: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  fullScreenUploader: {
    color: '#94A3B8',
    fontSize: 11
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  fullScreenImageBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  fullScreenImage: {
    width: '100%',
    height: '100%'
  },
  fullImageLoadingBox: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  fullImageLoadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8
  },
  sizeBadgeBox: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  sizeBadgeText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700'
  },
  uploadingOverlayCard: {
    padding: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
    marginVertical: 4
  },
  uploadingTitle: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8
  },
  uploadingSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center'
  },
  fullScreenFooter: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    gap: 10
  },
  saveGalleryBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveGalleryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  deletePhotoBtn: {
    flex: 1,
    backgroundColor: Colors.danger,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deletePhotoBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  }
});
