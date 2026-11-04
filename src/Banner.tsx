import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BRAND, brand } from './brand';

const LOGOS = {
  red: require('../assets/logo-red.png'),
  cyan: require('../assets/logo-cyan.png'),
};

/**
 * Intestazione: banda nera con logo ritagliato e centrato, angoli inferiori arrotondati
 * e filo colorato del marchio sotto.
 */
export function Banner({ large, right }: { large?: boolean; right?: React.ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.band, large && { paddingTop: 30, paddingBottom: 34 }]}>
        <Image
          source={LOGOS[BRAND]}
          style={{ width: '100%', height: large ? 120 : 54 }}
          resizeMode="contain"
          accessibilityLabel="GR Personal Trainer"
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <View style={styles.line} />
    </View>
  );
}

/** Campanella delle notifiche con contatore, da mettere in `Banner right`. */
export function Bell({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable testID="bell" onPress={onPress} accessibilityLabel="Notifiche" hitSlop={10} style={styles.bell}>
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path d="M6 16V11a6 6 0 0112 0v5l1.6 2H4.4L6 16z" stroke="#fff" strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d="M10 21h4" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      </Svg>
      {count > 0 ? (
        <View style={styles.badge}>
          <Text testID="bell-count" style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  right: { position: 'absolute', right: 14, top: 8, bottom: 14, justifyContent: 'center' },
  bell: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: brand.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: brand.accentText, fontSize: 11, fontWeight: '900' },
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
