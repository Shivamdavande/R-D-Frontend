import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  type?: 'default' | 'expense' | 'profit' | 'contract';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, type = 'default' }) => {
  const getBorderColor = () => {
    if (type === 'contract') return Colors.info;
    if (type === 'expense') return Colors.danger;
    if (type === 'profit') return Colors.success;
    return Colors.accent;
  };

  const getValueColor = () => {
    if (type === 'profit') return Colors.success;
    if (type === 'expense') return Colors.danger;
    if (type === 'contract') return Colors.info;
    return Colors.accent;
  };

  return (
    <View style={[styles.card, { borderLeftColor: getBorderColor() }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: getValueColor() }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderLeftWidth: 4,
    marginHorizontal: 4,
    marginBottom: 8
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  value: {
    fontSize: 15,
    fontWeight: '900'
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2
  }
});
