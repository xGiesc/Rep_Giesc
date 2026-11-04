import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BRAND, brand } from './brand';

const LOGOS = {
  red: require('../assets/logo-red.png'),
  cyan: require('../assets/logo-cyan.png'),
};

/**
 * Intestazione: banda nera con logo ritagliato e centrato, angoli inferiori arrotondati
 * e filo colorato del marchio sotto.
 */
export function Banner({ large }: { large?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.band, large && { paddingTop: 30, paddingBottom: 34 }]}>
        <Image
          source={LOGOS[BRAND]}
          style={{ width: '100%', height: large ? 120 : 54 }}
          resizeMode="contain"
          accessibilityLabel="GR Personal Trainer"
        />
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: 'transparent' },
  band: {
    backgroundColor: '#000',
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  line: {
    height: 3,
    marginHorizontal: 72,
    marginTop: -3,
    backgroundColor: brand.accent,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});
