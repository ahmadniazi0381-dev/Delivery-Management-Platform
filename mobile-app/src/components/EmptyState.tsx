import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  onCta?: () => void;
}

export default function EmptyState({ emoji = '🍽️', title, subtitle, ctaText, onCta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {ctaText && onCta && (
        <TouchableOpacity style={styles.button} onPress={onCta} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{ctaText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C0A00',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B4226',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: '#D97706',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
