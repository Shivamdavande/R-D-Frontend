import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { Colors } from '../../theme/colors';

interface OtpInputProps {
  value: string;
  onChangeText: (code: string) => void;
  length?: number;
  label?: string;
  onComplete?: (code: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value = '',
  onChangeText,
  length = 6,
  label = 'ENTER 6-DIGIT OTP CODE *',
  onComplete
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(cleaned);
    if (cleaned.length === length && onComplete) {
      onComplete(cleaned);
    }
  };

  const digits = value.split('');

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable onPress={handlePress} style={styles.boxContainer}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index];
          const isCurrentIndex = index === digits.length;
          const isLastIndex = index === length - 1 && digits.length === length;
          const isBoxFocused = isFocused && (isCurrentIndex || isLastIndex);
          const isFilled = digit !== undefined && digit !== '';

          return (
            <View
              key={index}
              style={[
                styles.box,
                isFilled && styles.boxFilled,
                isBoxFocused && styles.boxFocused
              ]}
            >
              <Text style={[styles.boxText, isFilled && styles.boxTextFilled]}>
                {digit || (isBoxFocused ? '|' : '•')}
              </Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  boxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease-in-out',
      } as any,
    }),
  },
  boxFilled: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  boxFocused: {
    borderColor: Colors.accent,
    borderWidth: 2,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  boxText: {
    color: Colors.textMuted,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  boxTextFilled: {
    color: Colors.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
