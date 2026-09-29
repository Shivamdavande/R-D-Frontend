import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useSites } from '../../context/SiteContext';

export const CreateSiteScreen = ({ navigation }: any) => {
  const { createSite } = useSites();
  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!siteName || !clientName || !workOrderNumber) {
      Alert.alert('Validation Error', 'Please fill in Site Name, Client Name, and Work Order Number.');
      return;
    }

    setLoading(true);
    try {
      await createSite({
        siteName: siteName.trim(),
        clientName: clientName.trim(),
        workOrderNumber: workOrderNumber.trim(),
        contractValue: Number(contractValue) || 0,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        status: 'ACTIVE'
      });
      Alert.alert('Success ✅', 'New construction work site created!');
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
        <Input label="SITE DESCRIPTION" placeholder="Brief scope of civil work..." value={description} onChangeText={setDescription} multiline numberOfLines={3} />

        <Button title="CREATE SITE WORKSPACE" onPress={handleSubmit} loading={loading} style={{ marginTop: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 }
});
