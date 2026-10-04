import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { forgotPassword, resetPassword } = useAuth();

  // Step 1 = Request OTP, Step 2 = Enter OTP & New Password
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Timers & Loaders
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, cooldown]);

  const handleSendResetOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your registered email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g. user@example.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res?.success) {
        setStep(2);
        setCooldown(60);
        setOtp('');
        Alert.alert('Reset Code Sent 📩', res.message || 'A 6-digit password reset OTP has been sent to your email.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.data?.message || err.message || 'Unable to request password reset. Please check your email.';
      Alert.alert('Reset Request Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || otp.trim().length < 6) {
      Alert.alert('OTP Required', 'Please enter the 6-digit reset code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords entered do not match. Please recheck.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
      if (res?.success) {
        Alert.alert('Success ✅', 'Password reset successfully! Welcome back.');
        // NavigationStack automatically redirects to Home when token/user is set
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.data?.message || err.message || 'Invalid or expired OTP code. Please try again.';
      Alert.alert('Reset Failed ❌', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    setResendLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res?.success) {
        setOtp('');
        Alert.alert('OTP Resent 📩', 'A new 6-digit password reset code has been sent to your email.');
        setCooldown(60);
      }
    } catch (err: any) {
      Alert.alert('Resend Failed', err.message || 'Unable to resend reset OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.brandBox}>
        <Text style={styles.logoTitle}>R&D</Text>
        <Text style={styles.brandName}>{step === 1 ? 'Reset Password' : 'Enter Reset Code'}</Text>
      </View>

      <View style={styles.card}>
        {step === 1 ? (
          // STEP 1: Enter Email
          <>
            <Text style={styles.title}>Forgot Your Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address and we will send you a 6-digit verification code to reset your password.
            </Text>

            <Input
              label="Registered Email Address *"
              placeholder="e.g. rajesh@randd.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title="SEND RESET OTP 📩"
              onPress={handleSendResetOtp}
              loading={loading}
              style={{ marginTop: 16 }}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: 20, alignItems: 'center' }}
            >
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
                Remember your password? <Text style={{ color: Colors.accent, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // STEP 2: Enter OTP & New Password
          <>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit reset code to <Text style={styles.emailHighlight}>{email}</Text>.
            </Text>

            <Input
              label="6-DIGIT RESET CODE *"
              placeholder="e.g. 123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              style={styles.otpInput}
            />

            <Input
              label="New Password *"
              placeholder="•••••••• (Min 6 characters)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Input
              label="Confirm New Password *"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button
              title="RESET PASSWORD & SIGN IN ✅"
              onPress={handleResetPassword}
              loading={loading}
              style={{ marginTop: 16 }}
            />

            <View style={styles.resendBox}>
              {cooldown > 0 ? (
                <Text style={styles.cooldownText}>
                  Resend OTP in <Text style={{ color: Colors.accent, fontWeight: '800' }}>{cooldown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading}>
                  <Text style={styles.resendActiveText}>
                    {resendLoading ? 'Sending new OTP...' : '🔄 Resend Reset Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setStep(1)}
              style={{ marginTop: 20, alignItems: 'center' }}
            >
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
                ← Change Email Address
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  brandBox: { alignItems: 'center', marginVertical: 20 },
  logoTitle: { color: Colors.accent, fontSize: 36, fontWeight: '900' },
  brandName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: Colors.surfaceBorder },
  title: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 16, lineHeight: 18 },
  emailHighlight: { color: Colors.accent, fontWeight: '700' },
  otpInput: { fontSize: 22, letterSpacing: 6, textAlign: 'center', fontWeight: '800' },
  resendBox: { marginTop: 18, alignItems: 'center' },
  cooldownText: { color: Colors.textMuted, fontSize: 13 },
  resendActiveText: { color: Colors.accent, fontSize: 14, fontWeight: '700' }
});
