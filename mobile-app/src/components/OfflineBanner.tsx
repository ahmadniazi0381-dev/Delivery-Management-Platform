import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const heightAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false;
      setIsOffline(offline);

      Animated.timing(heightAnim, {
        toValue: offline ? 40 : 0,
        duration: 300,
        useNativeDriver: false, // height animations can't use native driver
      }).start();
    });

    return () => unsubscribe();
  }, [heightAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      <Text style={styles.text}>⚠️ You are offline. Showing cached catalog.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
