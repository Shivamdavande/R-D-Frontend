import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password.trim());
      if (res?.requiresOtp) {
        navigation.navigate('OtpVerification', {
          email: res.email || email.trim(),
          devOtp: res.devOtp
        });
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      const devOtp = err.response?.data?.devOtp || err.data?.devOtp;
      if (errMsg.includes('not verified') || err.requiresOtp || err.data?.requiresOtp) {
        Alert.alert(
          'Email Verification Required 📩',
          'Your account email address is not verified yet. A 6-digit OTP code has been sent to your email.',
          [
            {
              text: 'Verify OTP Now',
              onPress: () => navigation.navigate('OtpVerification', {
                email: email.trim(),
                devOtp
              })
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      if (
        errMsg.toLowerCase().includes('invalid email') ||
        errMsg.toLowerCase().includes('invalid credentials') ||
        errMsg.toLowerCase().includes('deactivated') ||
        errMsg.toLowerCase().includes('required')
      ) {
        Alert.alert('Login Failed ❌', errMsg);
        return;
      }

      // Catch network connection error
      Alert.alert(
        'Server Network Notice 🌐',
        `Unable to reach backend server.\n(${errMsg || 'Network timeout'})\n\nPlease check your internet connection or configure your Server URL.`,
        [
          {
            text: '⚙️ Configure Server URL',
            onPress: () => setShowConfig(true)
          },
          { text: 'OK', style: 'cancel' }
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
    Alert.alert('URL Saved ✅', `Server URL set to:\n${formatted}`);
    setShowConfig(false);
  };

  const handleResetDefaultUrl = async () => {
    await AsyncStorage.removeItem('@r2r_custom_api_url');
    setServerIp('');
    Alert.alert('Reset Complete ✅', 'Reset back to default Cloud API Server:\nhttps://r-d-q9ix.onrender.com/api');
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
          placeholder="e.g. owner@randd.com or raj@randd.com"
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

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={{ alignSelf: 'flex-end', marginTop: -6, marginBottom: 14 }}
        >
          <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '700' }}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          title="SIGN IN"
          onPress={() => handleLogin()}
          loading={loading}
          style={styles.submitBtn}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>Don't have an account? <Text style={{ color: Colors.accent }}>Register Here</Text></Text>
        </TouchableOpacity>
      </View>

      {/* Server IP / URL Config Toggle */}
      <TouchableOpacity onPress={() => setShowConfig(!showConfig)} style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={{ color: Colors.textMuted, fontSize: 11 }}>⚙️ {showConfig ? 'Hide Server URL Settings' : 'Configure Server URL'}</Text>
      </TouchableOpacity>

      {showConfig && (
        <View style={styles.configBox}>
          <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: '800', marginBottom: 6 }}>ENTER CUSTOM SERVER URL OR LAPTOP WI-FI IP:</Text>
          <Input
            placeholder="e.g. https://r-d-q9ix.onrender.com or 192.168.1.15"
            value={serverIp}
            onChangeText={setServerIp}
            containerStyle={{ marginBottom: 8 }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button title="SAVE SERVER URL" onPress={handleSaveIp} size="small" />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="RESET TO CLOUD API" onPress={handleResetDefaultUrl} variant="outline" size="small" />
            </View>
          </View>
        </View>
      )}
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
  }
});
