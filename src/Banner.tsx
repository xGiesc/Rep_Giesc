import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/** Banda nera con il logo, in testa a ogni pagina. */
export function Banner({ large }: { large?: boolean }) {
  return (
    <View style={[styles.band, large && { paddingVertical: 18 }]}>
      <Image
        source={require('../assets/logo-banner.png')}
        style={{ width: '100%', height: large ? 150 : 62 }}
        resizeMode="contain"
        accessibilityLabel="GR Personal Trainer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { backgroundColor: '#000', paddingVertical: 4, paddingHorizontal: 16 },
});
