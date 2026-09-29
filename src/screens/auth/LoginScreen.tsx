import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (userEmail?: string, userPass?: string, role?: 'OWNER' | 'SUPERVISOR') => {
    const targetEmail = userEmail || email;
    const targetPass = userPass || password;

    if (!targetEmail || !targetPass) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(targetEmail, targetPass);
    } catch (err: any) {
      // Catch network connection error on physical device and offer instant local mobile mode
      Alert.alert(
        'Server Network Notice 🌐',
        `Unable to reach laptop backend at default address.\n\nWould you like to enter in Mobile Offline Demo Mode or configure your Laptop Wi-Fi IP?`,
        [
          {
            text: '🚀 Continue Mobile Demo Mode',
            onPress: () => demoLogin(role || (targetEmail.includes('owner') ? 'OWNER' : 'SUPERVISOR'))
          },
          {
            text: '⚙️ Configure Laptop IP',
            onPress: () => setShowConfig(true)
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIp = async () => {
    if (!serverIp.trim()) return;
    let formatted = serverIp.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    if (!formatted.includes(':5000') && !formatted.includes('.onrender.com') && !formatted.startsWith('https://')) {
      formatted = `${formatted}:5000`;
    }
    if (!formatted.endsWith('/api')) {
      formatted = `${formatted}/api`;
    }

    await AsyncStorage.setItem('@r2r_custom_api_url', formatted);
    Alert.alert('IP Saved ✅', `Server URL set to:\n${formatted}`);
    setShowConfig(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.brandBox}>
        <Text style={styles.logoTitle}>R&D</Text>
        <Text style={styles.brandName}>CONSTRUCTIONS</Text>
        <Text style={styles.brandSub}>Civil & Government Contractor Site P&L Management</Text>
      </View>

      {/* Login Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In to Workspace</Text>

        <Input
          label="Email Address"
          placeholder="e.g. owner@r2r.com or raj@r2r.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title="SIGN IN"
          onPress={() => handleLogin()}
          loading={loading}
          style={styles.submitBtn}
        />

        {/* 1-Tap Mobile Mode Button */}
        <Button
          title="⚡ INSTANT MOBILE PREVIEW MODE"
          onPress={() => demoLogin('OWNER')}
          variant="outline"
          style={{ marginTop: 10 }}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>Don't have an account? <Text style={{ color: Colors.accent }}>Register Here</Text></Text>
        </TouchableOpacity>
      </View>

      {/* Server IP Config Toggle */}
      <TouchableOpacity onPress={() => setShowConfig(!showConfig)} style={{ marginTop: 14, alignItems: 'center' }}>
        <Text style={{ color: Colors.textMuted, fontSize: 11 }}>⚙️ {showConfig ? 'Hide' : 'Configure Laptop Wi-Fi IP for Real Device'}</Text>
      </TouchableOpacity>

      {showConfig && (
        <View style={styles.configBox}>
          <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: '800', marginBottom: 6 }}>ENTER LAPTOP WI-FI IP:</Text>
          <Input
            placeholder="e.g. 192.168.1.15"
            value={serverIp}
            onChangeText={setServerIp}
            containerStyle={{ marginBottom: 8 }}
          />
          <Button title="SAVE LAPTOP SERVER IP" onPress={handleSaveIp} size="small" />
        </View>
      )}

      {/* Quick Demo Login Shortcut Box */}
      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>🚀 QUICK DEMO ONE-TAP LOGINS:</Text>
        <Text style={styles.demoSub}>Tap any role to immediately login:</Text>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => handleLogin('owner@r2r.com', 'OwnerPassword123!', 'OWNER')}
        >
          <Text style={styles.demoRole}>👑 OWNER (Admin) - Ghanshyam</Text>
          <Text style={styles.demoEmail}>owner@r2r.com (Full site control, closing & PDF export)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => handleLogin('raj@r2r.com', 'RajPassword123!', 'SUPERVISOR')}
        >
          <Text style={styles.demoRole}>👷 SUPERVISOR 1 - Raj</Text>
          <Text style={styles.demoEmail}>raj@r2r.com (Assigned site expenses & quantity entry)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => handleLogin('amit@r2r.com', 'AmitPassword123!', 'SUPERVISOR')}
        >
          <Text style={styles.demoRole}>👷 SUPERVISOR 2 - Amit</Text>
          <Text style={styles.demoEmail}>amit@r2r.com (Collaborating site supervisor)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  content: {
    padding: 20,
    justifyContent: 'center'
  },
  brandBox: {
    alignItems: 'center',
    marginVertical: 20
  },
  logoTitle: {
    color: Colors.accent,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2
  },
  brandName: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: -4
  },
  brandSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16
  },
  submitBtn: {
    marginTop: 10
  },
  registerLink: {
    marginTop: 14,
    alignItems: 'center'
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: 13
  },
  configBox: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: 10
  },
  demoBox: {
    marginTop: 20,
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent
  },
  demoTitle: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '800'
  },
  demoSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 12,
    marginTop: 2
  },
  demoBtn: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 8
  },
  demoRole: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  demoEmail: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2
  }
});
