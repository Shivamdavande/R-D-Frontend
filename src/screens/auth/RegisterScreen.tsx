import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'OWNER' | 'SUPERVISOR'>('SUPERVISOR');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in Name, Email, and Password.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, role, phone);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.brandBox}>
        <Text style={styles.logoTitle}>R2R</Text>
        <Text style={styles.brandName}>Create Account</Text>
      </View>

      <View style={styles.card}>
        <Input label="Full Name" placeholder="e.g. Rajesh Kumar" value={name} onChangeText={setName} />
        <Input label="Email Address" placeholder="e.g. rajesh@r2r.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone Number" placeholder="+91 98765 00000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.roleLabel}>Select Account Role:</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'SUPERVISOR' && styles.roleActive]}
            onPress={() => setRole('SUPERVISOR')}
          >
            <Text style={[styles.roleText, role === 'SUPERVISOR' && styles.roleActiveText]}>👷 SUPERVISOR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'OWNER' && styles.roleActive]}
            onPress={() => setRole('OWNER')}
          >
            <Text style={[styles.roleText, role === 'OWNER' && styles.roleActiveText]}>👑 OWNER / ADMIN</Text>
          </TouchableOpacity>
        </View>

        <Button title="CREATE ACCOUNT" onPress={handleRegister} loading={loading} style={{ marginTop: 16 }} />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Already have an account? <Text style={{ color: Colors.accent }}>Sign In</Text></Text>
        </TouchableOpacity>
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
  roleLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  roleBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.inputBorder, alignItems: 'center', backgroundColor: Colors.inputBg },
  roleActive: { borderColor: Colors.accent, backgroundColor: Colors.primaryLight },
  roleText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  roleActiveText: { color: Colors.accent }
});
