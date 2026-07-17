import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Animated, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [slideAnim]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setToast({ id: String(Date.now()), message, type });

      // Animate in
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();

      timeoutRef.current = setTimeout(() => {
        dismissToast();
      }, 3000);
    },
    [slideAnim, dismissToast]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { bg: '#D1FAE5', border: '#10B981', text: '#065F46', icon: 'checkmark-circle' };
      case 'error':
        return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', icon: 'alert-circle' };
      case 'warning':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', icon: 'warning' };
      case 'info':
      default:
        return { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', icon: 'information-circle' };
    }
  };

  const toastInfo = toast ? getToastStyles(toast.type) : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && toastInfo && (
        <SafeAreaView style={styles.container} pointerEvents="none">
          <Animated.View
            style={[
              styles.toast,
              {
                backgroundColor: toastInfo.bg,
                borderColor: toastInfo.border,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Ionicons name={toastInfo.icon as any} size={22} color={toastInfo.border} style={styles.icon} />
            <Text style={[styles.text, { color: toastInfo.text }]}>{toast.message}</Text>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#1A0D06',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
