import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, isOwner } = useAuth();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out of workspace?')) {
        await logout();
      } else {
        await logout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of workspace?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="User Profile & Settings" subtitle="Account details" navigation={navigation} showSiteSelector={false} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.substring(0, 1).toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={{ marginTop: 8 }}>
            <Badge label={user?.role || 'SUPERVISOR'} variant={isOwner ? 'warning' : 'info'} />
          </View>
        </Card>

        {/* Company Identity */}
        <Card>
          <Text style={styles.cardSectionTitle}>COMPANY IDENTITY</Text>
          <Text style={styles.companyName}>R&D CONSTRUCTIONS</Text>
          <Text style={styles.companyDesc}>Civil & Government Contractor Site Expense & P&L Management System</Text>
        </Card>

        {/* Navigation Options */}
        {isOwner && (
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminSettings')}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Admin Settings & Custom Units</Text>
              <Text style={styles.menuSub}>Manage default categories and measurement units</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PendingSync')}>
          <Text style={styles.menuIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Offline Sync Status</Text>
            <Text style={styles.menuSub}>View pending offline submissions and network status</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <Button title="SIGN OUT OF WORKSPACE" onPress={handleLogout} variant="danger" style={{ marginTop: 24, marginBottom: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  profileCard: { alignItems: 'center', borderColor: Colors.accent, paddingVertical: 20 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { color: Colors.buttonPrimaryText, fontSize: 26, fontWeight: '900' },
  userName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '900' },
  userEmail: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  cardSectionTitle: { color: Colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  companyName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 4 },
  companyDesc: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 10 },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  menuSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  menuArrow: { color: Colors.accent, fontSize: 20, fontWeight: '800' }
});
