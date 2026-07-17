import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonItem({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const shimmerAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnimatedValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerAnimatedValue]);

  const translateX = shimmerAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, width === '100%' ? 350 : Number(width) + 100],
  });

  return (
    <View style={[styles.skeleton, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

export function SkeletonFoodCard() {
  const cardWidth = width / 2 - 24;
  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <SkeletonItem width="100%" height={110} borderRadius={12} style={{ marginBottom: 10 }} />
      <SkeletonItem width="80%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonItem width="60%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonItem width="40%" height={16} borderRadius={4} />
        <SkeletonItem width="30" height={30} borderRadius={15} />
      </View>
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <SkeletonItem width={50} height={50} borderRadius={25} style={{ marginRight: 12 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonItem width="70%" height={16} borderRadius={4} />
        <SkeletonItem width="40%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

export function SkeletonStat() {
  return (
    <View style={styles.stat}>
      <SkeletonItem width="50%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
      <SkeletonItem width="80%" height={24} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#F5E6D0',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(254, 243, 199, 0.5)',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  card: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5E6D0',
    margin: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF0E0',
    backgroundColor: '#FFFFFF',
  },
  stat: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5E6D0',
    flex: 1,
  },
});
