import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const RegisterScreen = ({ navigation }: any) => {
  const { register, verifyOtp, resendOtp } = useAuth();

  // Step 1 = Account Details, Step 2 = Enter 6-Digit OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'OWNER' | 'SUPERVISOR'>('SUPERVISOR');

  // OTP State
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(60);

  // Loaders
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

  const handleSendOtp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Fields Missing', 'Please enter your Name, Email, and Password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email Address', 'Please enter a valid email address (e.g. user@example.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name.trim(), email.trim().toLowerCase(), password, role, phone.trim());
      // Step 2 Inline OTP display - component stays active, empty OTP field for manual entry
      setStep(2);
      setCooldown(60);
      setOtp('');
      Alert.alert('OTP Sent 📩', `A 6-digit OTP code has been sent to ${email.trim().toLowerCase()}. Please check your email inbox.`);
    } catch (err: any) {
      const errorData = err.response?.data;
      const errMsg = errorData?.message || err.message || 'Error sending OTP';

      if (errorData?.requiresOtp) {
        setStep(2);
        setCooldown(60);
        setOtp('');
        Alert.alert('OTP Sent 📩', errMsg);
        return;
      }

      if (errMsg.includes('already exists') && errMsg.includes('verified')) {
        Alert.alert(
          'Account Verified & Active',
          'An account with this email address is already verified. Please sign in.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => navigation.navigate('Login') }
          ]
        );
      } else {
        // Even for generic unverified errors, switch to Step 2 OTP field
        setStep(2);
        setCooldown(60);
        setOtp('');
        Alert.alert('Registration Note', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), otp.trim());
      if (res?.success) {
        Alert.alert('Success ✅', 'Account verified and registered successfully. Welcome!');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed ❌', err.message || err.response?.data?.message || 'Invalid or expired OTP code. Please enter the correct OTP from your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    setResendLoading(true);
    try {
      const res = await resendOtp(email.trim().toLowerCase());
      if (res?.success) {
        setOtp('');
        Alert.alert('OTP Resent 📩', 'A new 6-digit OTP code has been sent to your email.');
        setCooldown(60);
      }
    } catch (err: any) {
      Alert.alert('Resend Failed', err.message || 'Unable to resend OTP right now.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.brandBox}>
        <Text style={styles.logoTitle}>R&D</Text>
        <Text style={styles.brandName}>{step === 1 ? 'Create Account' : 'Verify Email OTP'}</Text>
      </View>

      <View style={styles.card}>
        {step === 1 ? (
          // STEP 1: Details Form
          <>
            <Input label="Full Name *" placeholder="e.g. Rajesh Kumar" value={name} onChangeText={setName} />
            <Input label="Email Address *" placeholder="e.g. rajesh@randd.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Phone Number" placeholder="+91 98765 00000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Password *" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

            <Button title="SEND OTP & CONTINUE 📩" onPress={handleSendOtp} loading={loading} style={{ marginTop: 16 }} />

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Already have an account? <Text style={{ color: Colors.accent, fontWeight: '700' }}>Sign In</Text></Text>
            </TouchableOpacity>
          </>
        ) : (
          // STEP 2: 6-Digit OTP Field Form
          <>
            <Text style={styles.title}>Enter 6-Digit Verification Code</Text>
            <Text style={styles.subtitle}>
              An OTP email has been sent to <Text style={styles.emailHighlight}>{email}</Text>. Please enter the code below to complete registration:
            </Text>

            <Input
              label="6-DIGIT OTP CODE *"
              placeholder="e.g. 123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              style={styles.otpInput}
            />

            <Button
              title="VERIFY OTP & COMPLETE REGISTRATION ✅"
              onPress={handleVerifyOtp}
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
                    {resendLoading ? 'Sending new OTP...' : '🔄 Resend OTP Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setStep(1)}
              style={{ marginTop: 20, alignItems: 'center' }}
            >
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
                ← Edit Account Details / Email
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

