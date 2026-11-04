# Gym Tracker

App per gestire gli allenamenti in palestra (stile Coach Plus): crei le tue schede, registri kg e ripetizioni serie per serie e rivedi lo storico. Un solo codice (React Native + Expo) per **iPhone, Android e web**.

## Funzioni

- **Schede**: crea, modifica ed elimina schede con esercizi, serie e ripetizioni obiettivo
- **Allenamento**: per ogni serie inserisci kg e ripetizioni e spunti il completamento; i kg vengono precompilati con l'ultimo carico usato per quell'esercizio
- **Storico**: allenamenti passati con serie e volume totale (kg × ripetizioni)
- Dati salvati sul dispositivo (su web nel browser), nessun account necessario

## Avvio sul PC

```bash
npm install
npm run web
```

Si apre nel browser (indirizzo mostrato nel terminale, di solito http://localhost:8081).

## Provarla sul telefono

```bash
npm start
```

Installa l'app **Expo Go** sul telefono (iPhone o Android) e inquadra il QR code mostrato nel terminale. Telefono e PC devono essere sulla stessa rete Wi‑Fi.

## Struttura

```
App.tsx                      navigazione e stato globale
src/types.ts                 tipi (Plan, Exercise, Session)
src/storage.ts               salvataggio persistente
src/components.tsx           componenti UI condivisi
src/screens/                 Schede, Editor scheda, Allenamento, Storico
```

## Idee per i prossimi passi

- Timer di recupero tra le serie
- Grafici di progressione per esercizio
- Libreria di esercizi con ricerca
- Backup/sincronizzazione su cloud
- Pubblicazione negli store con EAS Build
