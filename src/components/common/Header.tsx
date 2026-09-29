import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
          <Text style={styles.logoText}>R&D</Text>
          <View style={styles.taglineBox}>
            <Text style={styles.tagline}>CONSTRUCTIONS</Text>
            <Text style={styles.subTagline}>Site Expense & Lump Sum P&L</Text>
          </View>
        </View>

        {/* Network Toggle */}
        <TouchableOpacity
          style={[styles.networkBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}
          onPress={() => setIsOnline(!isOnline)}
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
          activeOpacity={0.8}
        >
          <Text style={styles.siteLabel}>SITE:</Text>
          <Text style={styles.siteNameText} numberOfLines={1}>
            {activeSite.siteName}
          </Text>
          <Text style={styles.woText}>WO: {activeSite.workOrderNumber} ▾</Text>
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
    backgroundColor: Colors.primary,
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder
  },
  syncBanner: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 6,
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
    fontWeight: '600'
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
    fontSize: 22,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  subTagline: {
    color: Colors.textSecondary,
    fontSize: 9
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    marginRight: 4
  },
  networkText: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: '800'
  },
  siteSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  siteLabel: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '900',
    marginRight: 6
  },
  siteNameText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 6
  },
  woText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700'
  },
  titleContainer: {
    marginTop: 4
  },
  titleText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  subtitleText: {
    color: Colors.textSecondary,
    fontSize: 12
  }
});
