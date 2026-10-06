import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { OtpInput } from '../../components/common/OtpInput';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const OtpVerificationScreen = ({ route, navigation }: any) => {
  const { email } = route.params || {};
  const { verifyOtp, resendOtp } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const handleVerify = async (codeToVerify?: string) => {
    const finalOtp = codeToVerify || otp;
    if (!finalOtp || finalOtp.trim().length < 6) {
      Alert.alert('Invalid Input', 'Please enter the complete 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, finalOtp.trim());
      if (res?.success) {
        Alert.alert('Success ✅', 'Email verified successfully. Welcome!');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setResendLoading(true);
    try {
      const res = await resendOtp(email);
      if (res?.success) {
        if (res.devOtp) {
          setOtp(String(res.devOtp));
        }
        Alert.alert('OTP Sent 📩', res.message || 'A new 6-digit OTP code has been generated.');
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
        <Text style={styles.brandName}>Email Verification</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Enter 6-Digit Verification Code</Text>
        <Text style={styles.subtitle}>
          We have sent a 6-digit verification code to <Text style={styles.emailHighlight}>{email || 'your email'}</Text>.
        </Text>

        <OtpInput
          label="6-DIGIT VERIFICATION CODE *"
          value={otp}
          onChangeText={setOtp}
          onComplete={(code) => handleVerify(code)}
        />

        <Button
          title="VERIFY OTP CODE ✅"
          onPress={() => handleVerify()}
          loading={loading}
          style={{ marginTop: 20 }}
        />

        <View style={styles.resendBox}>
          {cooldown > 0 ? (
            <Text style={styles.cooldownText}>
              Resend OTP available in <Text style={{ color: Colors.accent, fontWeight: '800' }}>{cooldown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              <Text style={styles.resendActiveText}>
                {resendLoading ? 'Sending new OTP...' : '🔄 Resend OTP Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
            Back to <Text style={{ color: Colors.accent, fontWeight: '700' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  brandBox: { alignItems: 'center', marginVertical: 24 },
  logoTitle: { color: Colors.accent, fontSize: 38, fontWeight: '900' },
  brandName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 14, borderWidth: 1, borderColor: Colors.surfaceBorder },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 18, lineHeight: 18 },
  emailHighlight: { color: Colors.accent, fontWeight: '700' },
  otpInput: { fontSize: 20, letterSpacing: 6, textAlign: 'center', fontWeight: '800' },
  resendBox: { marginTop: 20, alignItems: 'center' },
  cooldownText: { color: Colors.textMuted, fontSize: 13 },
  resendActiveText: { color: Colors.accent, fontSize: 14, fontWeight: '700' }
});
