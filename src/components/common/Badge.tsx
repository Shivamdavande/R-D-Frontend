import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'category' | 'default';
  categoryName?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', categoryName }) => {
  const getBadgeStyle = () => {
    if (variant === 'success') return { backgroundColor: Colors.successLight, borderColor: Colors.success };
    if (variant === 'warning') return { backgroundColor: Colors.warningLight, borderColor: Colors.warning };
    if (variant === 'danger') return { backgroundColor: Colors.dangerLight, borderColor: Colors.danger };
    if (variant === 'info') return { backgroundColor: Colors.infoLight, borderColor: Colors.info };
    if (variant === 'category' && categoryName) {
      const color = (Colors.categories as any)[categoryName] || Colors.accent;
      return { backgroundColor: `${color}20`, borderColor: color };
    }
    return { backgroundColor: Colors.primaryLight, borderColor: Colors.surfaceBorder };
  };

  const getTextStyle = () => {
    if (variant === 'success') return { color: Colors.success };
    if (variant === 'warning') return { color: Colors.warning };
    if (variant === 'danger') return { color: Colors.danger };
    if (variant === 'info') return { color: Colors.info };
    if (variant === 'category' && categoryName) {
      const color = (Colors.categories as any)[categoryName] || Colors.accent;
      return { color };
    }
    return { color: Colors.textSecondary };
  };

  return (
    <View style={[styles.badge, getBadgeStyle()]}>
      <Text style={[styles.text, getTextStyle()]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3
  }
});
