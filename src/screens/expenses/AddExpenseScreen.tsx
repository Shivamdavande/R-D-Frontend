import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useSites } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import api from '../../services/api';
import { savePendingExpense } from '../../services/offlineStorage';

const CATEGORIES = [
  'Material',
  'Labour',
  'Transport',
  'Machinery',
  'Fuel',
  'Electrical',
  'Plumbing',
  'Tools',
  'Safety',
  'Food/Refreshment',
  'Accommodation',
  'Miscellaneous'
];

const COMMON_UNITS = ['Sheet', 'Bag', 'Kg', 'Tonne', 'Litre', 'Nos', 'Meter', 'Sq Ft', 'Day', 'Hour', 'Trip'];
const ITEM_SUGGESTIONS = ['18mm Ply', 'Cement', 'Steel (TMT 12mm)', 'Sand / Aggregate', 'JCB Earthmover', 'Mason Daily Wage', 'Diesel Fuel'];

export const AddExpenseScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { activeSite, sites, setActiveSite } = useSites();
  const { isOnline, refreshPendingCount } = useNetwork();

  const preselectedSiteId = route.params?.siteId || activeSite?._id;

  const [siteId, setSiteId] = useState(preselectedSiteId || '');
  const [category, setCategory] = useState('Material');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('3');
  const [unit, setUnit] = useState('Sheet');
  
  // Total Lump Sum & Per Unit Rate states for bi-directional auto calculation
  const [totalAmountInput, setTotalAmountInput] = useState('8000');
  const [rateInput, setRateInput] = useState('');
  const [perUnitRate, setPerUnitRate] = useState<number>(2666.67);
  const [finalTotalAmount, setFinalTotalAmount] = useState<number>(8000);
  
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeSite && !siteId) {
      setSiteId(activeSite._id);
    }
  }, [activeSite]);

  // Recalculate when Quantity or Total Amount Input changes
  const handleTotalAmountChange = (val: string) => {
    setTotalAmountInput(val);
    const tot = parseFloat(val);
    const qty = parseFloat(quantity);
    if (!isNaN(tot) && !isNaN(qty) && qty > 0) {
      const calcRate = Number((tot / qty).toFixed(2));
      setPerUnitRate(calcRate);
      setRateInput(calcRate.toString());
      setFinalTotalAmount(tot);
    } else {
      setFinalTotalAmount(0);
    }
  };

  const handleRateChange = (val: string) => {
    setRateInput(val);
    const r = parseFloat(val);
    const qty = parseFloat(quantity);
    if (!isNaN(r) && !isNaN(qty) && qty > 0) {
      const calcTot = Number((qty * r).toFixed(2));
      setFinalTotalAmount(calcTot);
      setTotalAmountInput(calcTot.toString());
      setPerUnitRate(r);
    }
  };

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const qty = parseFloat(val);
    const tot = parseFloat(totalAmountInput);
    if (!isNaN(tot) && !isNaN(qty) && qty > 0) {
      const calcRate = Number((tot / qty).toFixed(2));
      setPerUnitRate(calcRate);
      setRateInput(calcRate.toString());
    }
  };

  const handleSubmit = async () => {
    if (!siteId) {
      Alert.alert('Validation Error', 'Please select a Site.');
      return;
    }
    if (!itemName.trim()) {
      Alert.alert('Validation Error', 'Please enter Item Name.');
      return;
    }
    const q = parseFloat(quantity);

    if (isNaN(q) || q <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid Quantity.');
      return;
    }
    if (finalTotalAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter Total Amount or Rate.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        siteId,
        date: new Date().toISOString(),
        category,
        itemName: itemName.trim(),
        quantity: q,
        unit,
        rate: perUnitRate,
        amount: finalTotalAmount,
        vendor: vendor.trim() || undefined,
        paymentMethod: 'CASH',
        notes: notes.trim() || undefined,
        createdBy: user
      };

      if (!isOnline) {
        await savePendingExpense(payload as any);
        await refreshPendingCount();
        Alert.alert('Saved Offline ⏳', 'Saved locally. Marked as "Pending Sync".', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const res = await api.post(`/sites/${siteId}/expenses`, payload);
        if (res.data?.success) {
          Alert.alert('Success ✅', `Expense of ₹${finalTotalAmount.toLocaleString('en-IN')} added!`, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Add Site Expense" subtitle="Minimal & fast expense entry" navigation={navigation} showSiteSelector={false} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Site Selector */}
        <Text style={styles.label}>TARGET SITE *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPicker}>
          {sites.map((s) => (
            <TouchableOpacity
              key={s._id}
              style={[styles.chip, siteId === s._id && styles.chipActive]}
              onPress={() => {
                setSiteId(s._id);
                setActiveSite(s);
              }}
            >
              <Text style={[styles.chipText, siteId === s._id && styles.chipTextActive]}>{s.siteName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Pills */}
        <Text style={styles.label}>CATEGORY *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPicker}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Item Name */}
        <Input
          label="ITEM NAME *"
          placeholder="e.g. 18mm Ply, Cement"
          value={itemName}
          onChangeText={setItemName}
        />
        <View style={styles.suggestionsRow}>
          {ITEM_SUGGESTIONS.map((sug) => (
            <TouchableOpacity key={sug} style={styles.sugChip} onPress={() => setItemName(sug)}>
              <Text style={styles.sugText}>+ {sug}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity & Unit Inputs */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="QUANTITY *"
              placeholder="e.g. 3"
              value={quantity}
              onChangeText={handleQuantityChange}
              keyboardType="numeric"
            />
          </View>

          <View style={{ width: 130, marginLeft: 10 }}>
            <Text style={styles.label}>UNIT *</Text>
            <TouchableOpacity
              style={styles.unitSelector}
              onPress={() => {
                const nextIdx = (COMMON_UNITS.indexOf(unit) + 1) % COMMON_UNITS.length;
                setUnit(COMMON_UNITS[nextIdx]);
              }}
            >
              <Text style={styles.unitText}>{unit} ▾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lump Sum Total Amount Input */}
        <Input
          label="TOTAL LUMP SUM AMOUNT (₹) *"
          placeholder="e.g. 8000"
          prefix="₹"
          value={totalAmountInput}
          onChangeText={handleTotalAmountChange}
          keyboardType="numeric"
        />

        {/* AUTOMATIC PER-UNIT RATE DISPLAY BOX */}
        <View style={styles.autoCalcCard}>
          <Text style={styles.autoCalcTitle}>💡 AUTOMATIC PER-PIECE / UNIT CALCULATION:</Text>
          <View style={styles.autoCalcRow}>
            <Text style={styles.autoCalcMainVal}>
              ₹{perUnitRate.toLocaleString('en-IN')} <Text style={styles.autoCalcUnit}>/ {unit}</Text>
            </Text>
            <Text style={styles.autoCalcSub}>
              ({finalTotalAmount.toLocaleString('en-IN')} ÷ {quantity || '1'} {unit})
            </Text>
          </View>
        </View>

        {/* Optional Per Unit Rate Direct Input */}
        <Input
          label="OR ENTER RATE PER UNIT (₹) DIRECTLY"
          placeholder="e.g. 2666.67"
          prefix="₹"
          value={rateInput}
          onChangeText={handleRateChange}
          keyboardType="numeric"
        />

        <Input
          label="VENDOR / SUPPLIER (OPTIONAL)"
          placeholder="e.g. Apex Plywoods"
          value={vendor}
          onChangeText={setVendor}
        />

        <Input
          label="REMARKS / NOTES"
          placeholder="e.g. Canopy shuttering work"
          value={notes}
          onChangeText={setNotes}
        />

        {/* Submit Button */}
        <Button
          title={isOnline ? "SAVE EXPENSE ENTRY" : "SAVE OFFLINE (PENDING SYNC) ⏳"}
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 14, marginBottom: 40 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  horizontalPicker: { marginBottom: 12, flexDirection: 'row' },
  chip: { backgroundColor: Colors.inputBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.inputBorder, marginRight: 8 },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: Colors.buttonPrimaryText },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12, marginTop: -4 },
  sugChip: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: Colors.surfaceBorder },
  sugText: { color: Colors.accent, fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row' },
  unitSelector: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 8, padding: 11, alignItems: 'center' },
  unitText: { color: Colors.accent, fontWeight: '800', fontSize: 13 },
  autoCalcCard: { backgroundColor: Colors.primaryLight, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.accent, marginVertical: 10 },
  autoCalcTitle: { color: Colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  autoCalcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  autoCalcMainVal: { color: Colors.textPrimary, fontSize: 22, fontWeight: '900' },
  autoCalcUnit: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  autoCalcSub: { color: Colors.textSecondary, fontSize: 11 }
});
