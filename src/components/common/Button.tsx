import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) => {
  const getContainerStyle = () => {
    let bgStyle: ViewStyle = {};
    if (variant === 'primary') bgStyle = { backgroundColor: Colors.accent };
    if (variant === 'secondary') bgStyle = { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.surfaceBorder };
    if (variant === 'danger') bgStyle = { backgroundColor: Colors.danger };
    if (variant === 'success') bgStyle = { backgroundColor: Colors.success };
    if (variant === 'outline') bgStyle = { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.accent };

    let paddingStyle: ViewStyle = {};
    if (size === 'small') paddingStyle = { paddingVertical: 8, paddingHorizontal: 12 };
    if (size === 'medium') paddingStyle = { paddingVertical: 12, paddingHorizontal: 18 };
    if (size === 'large') paddingStyle = { paddingVertical: 16, paddingHorizontal: 24 };

    return [styles.button, bgStyle, paddingStyle, disabled && styles.disabled, style];
  };

  const getTextStyle = () => {
    let colorStyle: TextStyle = { color: Colors.buttonPrimaryText };
    if (variant === 'secondary' || variant === 'danger' || variant === 'success') colorStyle = { color: '#FFFFFF' };
    if (variant === 'outline') colorStyle = { color: Colors.accent };

    let fontSizeStyle: TextStyle = { fontSize: 14 };
    if (size === 'small') fontSizeStyle = { fontSize: 12 };
    if (size === 'large') fontSizeStyle = { fontSize: 16 };

    return [styles.text, colorStyle, fontSizeStyle, textStyle];
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.buttonPrimaryText : '#FFFFFF'} />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  text: {
    fontWeight: '700',
    textAlign: 'center'
  },
  disabled: {
    opacity: 0.5
  }
});
