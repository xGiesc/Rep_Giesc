import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header } from '../components';
import { colors, spacing } from '../theme';

const SECTIONS: Array<[string, string]> = [
  ['Chi tratta i tuoi dati', 'Il titolare del trattamento è il tuo personal trainer (GRG Personal Trainer), che usa questa app per seguirti. Per esercitare i tuoi diritti rivolgiti direttamente a lui.'],
  ['Quali dati raccogliamo', 'Nome, indirizzo email, le schede di allenamento che ti vengono assegnate e lo storico dei tuoi allenamenti (esercizi, serie, ripetizioni, carichi, date). Non raccogliamo dati sanitari, posizione o contatti del telefono.'],
  ['Perché li usiamo', 'Solo per farti accedere all’app, mostrarti le tue schede e permettere al tuo personal trainer di assegnarle e controllare i tuoi progressi. Non vengono usati per pubblicità né ceduti a terzi.'],
  ['Chi può vederli', 'Solo tu e il personal trainer a cui ti sei collegato con il suo codice. Gli altri utenti non vedono i tuoi dati. Se ti scolleghi dal personal trainer, lui non li vede più.'],
  ['Dove sono conservati', 'Su Supabase (servizio di database in cloud), con accesso protetto da login e regole che separano i dati di ogni persona. Le password non sono leggibili da nessuno.'],
  ['Per quanto tempo', 'Finché mantieni l’account. Puoi chiedere in qualsiasi momento di cancellarlo insieme ai tuoi dati.'],
  ['I tuoi diritti', 'Puoi chiedere accesso, correzione, copia o cancellazione dei tuoi dati, e opporti al trattamento, contattando il tuo personal trainer. Hai anche il diritto di rivolgerti al Garante per la protezione dei dati personali (garanteprivacy.it).'],
];

/** Informativa privacy (testo di base: il titolare deve verificarla e completarla con i propri recapiti). */
export function PrivacyScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Header title="Informativa privacy" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        {SECTIONS.map(([t, body]) => (
          <Card key={t} style={{ gap: spacing.xs }}>
            <Text style={styles.h}>{t}</Text>
            <Text style={styles.p}>{body}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  h: { color: colors.text, fontSize: 16, fontWeight: '800' },
  p: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
