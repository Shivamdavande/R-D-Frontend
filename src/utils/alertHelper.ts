import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Universal alert helper compatible with both React Native mobile and React Native Web.
 * Native Web's default Alert.alert ignores button callbacks and confirmation dialogs.
 * customAlert guarantees that window.alert and window.confirm trigger button onPress callbacks on Web.
 */
export const customAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (Platform.OS === 'web') {
    const fullMessage = message ? `${title}\n\n${message}` : title;

    if (buttons && buttons.length > 1) {
      // Confirmation dialog (e.g. Cancel vs Delete/Action)
      const confirmed = window.confirm(fullMessage);
      if (confirmed) {
        const actionBtn = buttons.find(b => b.style !== 'cancel') || buttons[1];
        if (actionBtn?.onPress) {
          actionBtn.onPress();
        }
      } else {
        const cancelBtn = buttons.find(b => b.style === 'cancel');
        if (cancelBtn?.onPress) {
          cancelBtn.onPress();
        }
      }
    } else {
      // Single action alert (e.g. OK)
      window.alert(fullMessage);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
