import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header } from '../components';
import { Notif, NotifKind } from '../notifications';
import { colors, spacing } from '../theme';

const TAG: Record<NotifKind, string> = {
  plan_new: 'NUOVA SCHEDA',
  plan_soon: 'IN SCADENZA',
  plan_expired: 'SCADUTA',
  inactive: 'PROMEMORIA',
  workout_done: 'ALLENAMENTO',
  no_plan: 'DA ASSEGNARE',
};

export function NotificationsScreen({
  items,
  read,
  onRead,
  onReadAll,
  onOpen,
  onBack,
}: {
  items: Notif[];
  read: string[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onOpen?: (n: Notif) => void;
  onBack: () => void;
}) {
  const unread = items.filter((n) => !read.includes(n.id)).length;
  return (
    <View style={{ flex: 1 }}>
      <Header
        title="Notifiche"
        onBack={onBack}
        right={
          unread > 0 ? (
            <Text testID="read-all" style={styles.readAll} onPress={onReadAll}>
              Segna tutte come lette
            </Text>
          ) : null
        }
      />
      <ScrollView contentContainerStyle={styles.list}>
        {items.length === 0 ? <Text style={styles.empty}>Nessuna notifica per ora.</Text> : null}
        {items.map((n) => {
          const isRead = read.includes(n.id);
          const urgent = n.kind === 'plan_expired' || n.kind === 'plan_soon';
          return (
            <Pressable
              key={n.id}
              testID="notif"
              onPress={() => {
                onRead(n.id);
                onOpen?.(n);
              }}
            >
              <Card style={[{ gap: 4 }, isRead && { opacity: 0.6 }]}>
                <View style={styles.row}>
                  {!isRead ? <View style={styles.dot} /> : null}
                  <Text style={[styles.tag, urgent && { color: colors.accentInk }]}>{TAG[n.kind]}</Text>
                </View>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.text}>{n.text}</Text>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  tag: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  text: { color: colors.text, fontSize: 14, lineHeight: 20 },
  readAll: { color: colors.accentInk, fontSize: 13, fontWeight: '800' },
});
