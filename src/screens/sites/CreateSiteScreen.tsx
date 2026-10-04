import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useSites } from '../../context/SiteContext';
import api from '../../services/api';

export const CreateSiteScreen = ({ navigation }: any) => {
  const { createSite } = useSites();
  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSupervisors();
  }, []);

  const loadSupervisors = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        setSupervisors(res.data.users);
      }
    } catch (e) {
      console.log('Failed loading supervisors for site creation:', e);
    }
  };

  const handleSubmit = async () => {
    if (!siteName || !clientName || !workOrderNumber) {
      Alert.alert('Validation Error', 'Please fill in Site Name, Client Name, and Work Order Number.');
      return;
    }

    setLoading(true);
    try {
      const newSite = await createSite({
        siteName: siteName.trim(),
        clientName: clientName.trim(),
        workOrderNumber: workOrderNumber.trim(),
        contractValue: Number(contractValue) || 0,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        status: 'ACTIVE'
      });

      // Automatically assign selected supervisor if chosen
      if (selectedSupervisorId && newSite?._id) {
        try {
          await api.post(`/sites/${newSite._id}/members`, {
            userId: selectedSupervisorId,
            role: 'SUPERVISOR'
          });
        } catch (err) {
          console.log('Failed auto-assigning supervisor:', err);
        }
      }

      Alert.alert('Success ✅', 'New construction site created and assigned successfully!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create site.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Create New Work Site" subtitle="Owner site creation" navigation={navigation} showSiteSelector={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <Input label="SITE NAME *" placeholder="e.g. BPCL XYZ Petrol Pump" value={siteName} onChangeText={setSiteName} />
        <Input label="CLIENT / DEPARTMENT NAME *" placeholder="e.g. Bharat Petroleum Corp Ltd" value={clientName} onChangeText={setClientName} />
        <Input label="WORK ORDER NUMBER *" placeholder="e.g. BPCL/2026/001" value={workOrderNumber} onChangeText={setWorkOrderNumber} />
        <Input label="CONTRACT VALUE (₹)" placeholder="e.g. 1250000" prefix="₹" value={contractValue} onChangeText={setContractValue} keyboardType="numeric" />
        <Input label="SITE LOCATION" placeholder="e.g. Plot 42, Sector 18, Highway Junction" value={location} onChangeText={setLocation} />

        {/* Supervisor Assignment Picker */}
        <Text style={styles.sectionLabel}>ASSIGN SITE SUPERVISOR (OPTIONAL)</Text>
        <Text style={styles.subText}>Select a supervisor to grant them instant access to this site:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, selectedSupervisorId === '' && styles.chipActive]}
            onPress={() => setSelectedSupervisorId('')}
          >
            <Text style={[styles.chipText, selectedSupervisorId === '' && styles.chipTextActive]}>None (Owner Only)</Text>
          </TouchableOpacity>
          {supervisors.map((sup) => (
            <TouchableOpacity
              key={sup._id}
              style={[styles.chip, selectedSupervisorId === sup._id && styles.chipActive]}
              onPress={() => setSelectedSupervisorId(sup._id)}
            >
              <Text style={[styles.chipText, selectedSupervisorId === sup._id && styles.chipTextActive]}>
                👷 {sup.name} ({sup.email})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label="SITE DESCRIPTION" placeholder="Brief scope of civil work..." value={description} onChangeText={setDescription} multiline numberOfLines={3} />

        <Button title="CREATE SITE WORKSPACE" onPress={handleSubmit} loading={loading} style={{ marginTop: 20, marginBottom: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 4, textTransform: 'uppercase' },
  subText: { color: Colors.textMuted, fontSize: 11, marginTop: 2, marginBottom: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 14 },
  chip: { backgroundColor: Colors.inputBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.inputBorder, marginRight: 8 },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: Colors.buttonPrimaryText }
});
