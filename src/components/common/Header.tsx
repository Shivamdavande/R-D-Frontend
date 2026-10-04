import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { useSites } from '../../context/SiteContext';
import { useNetwork } from '../../context/NetworkContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSiteSelector?: boolean;
  navigation?: any;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showSiteSelector = true, navigation }) => {
  const { activeSite } = useSites();
  const { pendingSyncCount, isOnline, setIsOnline } = useNetwork();
  const canGoBack = navigation?.canGoBack && navigation.canGoBack();

  return (
    <View style={styles.container}>
      {/* Network Offline / Sync Banner */}
      {(!isOnline || pendingSyncCount > 0) && (
        <TouchableOpacity
          style={[styles.syncBanner, !isOnline && styles.offlineBanner]}
          onPress={() => navigation?.navigate('PendingSync')}
        >
          <Text style={styles.syncBannerText}>
            {!isOnline
              ? '⚡ Offline Mode - Entries saved locally'
              : `⏳ ${pendingSyncCount} Pending Sync Entry(ies) - Tap to Sync`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Main Top Header */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          {canGoBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.logoText}>R&D</Text>
          <View style={styles.taglineBox}>
            <Text style={styles.tagline}>CONSTRUCTIONS</Text>
            <Text style={styles.subTagline}>Site Expense & P&L</Text>
          </View>
        </View>

        {/* Network Toggle */}
        <TouchableOpacity
          style={[styles.networkBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}
          onPress={() => setIsOnline(!isOnline)}
          activeOpacity={0.8}
        >
          <View style={[styles.dot, { backgroundColor: isOnline ? Colors.success : Colors.danger }]} />
          <Text style={styles.networkText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
        </TouchableOpacity>
      </View>

      {/* Active Site Picker */}
      {showSiteSelector && activeSite ? (
        <TouchableOpacity
          style={styles.siteSelectorRow}
          onPress={() => navigation?.navigate('SitesList')}
          activeOpacity={0.85}
        >
          <View style={styles.siteIconBadge}>
            <Text style={{ fontSize: 13 }}>🏗️</Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={styles.siteNameText} numberOfLines={1}>
              {activeSite.siteName}
            </Text>
            <Text style={styles.woText}>WO: {activeSite.workOrderNumber}</Text>
          </View>
          <View style={styles.switchSitePill}>
            <Text style={styles.switchSiteText}>Switch Site ▾</Text>
          </View>
        </TouchableOpacity>
      ) : (
        title && (
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{title}</Text>
            {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 38,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  backBtn: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  backBtnText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '800'
  },
  syncBanner: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center'
  },
  offlineBanner: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger
  },
  syncBannerText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoText: {
    color: Colors.accent,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 8
  },
  taglineBox: {
    borderLeftWidth: 1.5,
    borderLeftColor: Colors.surfaceBorder,
    paddingLeft: 8
  },
  tagline: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  subTagline: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '600'
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1
  },
  onlineBadge: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight
  },
  offlineBadge: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  networkText: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: '800'
  },
  siteSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  siteIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  siteNameText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  woText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600'
  },
  switchSitePill: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  switchSiteText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  titleContainer: {
    marginTop: 4
  },
  titleText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800'
  },
  subtitleText: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2
  }
});
