import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  type?: 'default' | 'expense' | 'profit' | 'loss' | 'contract';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, type = 'default' }) => {
  const isLoss = type === 'loss' || (type === 'profit' && value.includes('-'));

  const getBgColor = () => {
    if (type === 'contract') return Colors.primaryLight;
    if (type === 'expense' || isLoss) return Colors.dangerLight;
    if (type === 'profit') return Colors.successLight;
    return Colors.surface;
  };

  const getValueColor = () => {
    if (isLoss) return Colors.danger;
    if (type === 'profit') return Colors.success;
    if (type === 'expense') return Colors.danger;
    if (type === 'contract') return Colors.accent;
    return Colors.textPrimary;
  };

  const displayTitle = isLoss && title === 'GROSS PROFIT' ? 'GROSS LOSS' : title;

  return (
    <View style={[styles.card, { backgroundColor: getBgColor() }]}>
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={[styles.value, { color: getValueColor() }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  value: {
    fontSize: 16,
    fontWeight: '800'
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4
  }
});
