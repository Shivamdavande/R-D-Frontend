import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import api from '../../services/api';

export const AdminSettingsScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [newCat, setNewCat] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const resCat = await api.get('/settings/categories');
      const resUnit = await api.get('/settings/units');

      if (resCat.data?.success) setCategories(resCat.data.categories);
      if (resUnit.data?.success) setUnits(resUnit.data.units);
    } catch (e) {
      console.log('Error loading settings:', e);
    }
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/settings/categories', { name: newCat.trim() });
      if (res.data?.success) {
        Alert.alert('Category Added', `Custom category "${newCat}" created.`);
        setNewCat('');
        loadSettings();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/settings/units', { name: newUnit.trim() });
      if (res.data?.success) {
        Alert.alert('Unit Added', `Custom measurement unit "${newUnit}" created.`);
        setNewUnit('');
        loadSettings();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Admin Settings & Config" subtitle="Custom categories & units" navigation={navigation} showSiteSelector={false} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Categories Section */}
        <Card>
          <Text style={styles.cardTitle}>EXPENSE CATEGORIES ({categories.length})</Text>
          <View style={styles.badgeWrap}>
            {categories.map((c) => (
              <Badge key={c} label={c} variant="category" categoryName={c} />
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Input
              placeholder="Add Custom Category..."
              value={newCat}
              onChangeText={setNewCat}
              containerStyle={{ flex: 1, marginBottom: 0 }}
            />
            <Button title="+ Add" onPress={handleAddCategory} loading={loading} size="small" />
          </View>
        </Card>

        {/* Units Section */}
        <Card>
          <Text style={styles.cardTitle}>MEASUREMENT UNITS ({units.length})</Text>
          <View style={styles.badgeWrap}>
            {units.map((u) => (
              <Badge key={u} label={u} variant="info" />
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Input
              placeholder="Add Custom Unit (e.g. Barrel, CFT)..."
              value={newUnit}
              onChangeText={setNewUnit}
              containerStyle={{ flex: 1, marginBottom: 0 }}
            />
            <Button title="+ Add" onPress={handleAddUnit} loading={loading} size="small" />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  cardTitle: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }
});
