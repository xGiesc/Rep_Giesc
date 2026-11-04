# Gym Tracker

App per gestire gli allenamenti in palestra (stile Coach Plus): crei le tue schede, registri kg e ripetizioni serie per serie e rivedi lo storico. Un solo codice (React Native + Expo) per **iPhone, Android e web**.

## Funzioni

- **Schede**: crea, modifica ed elimina schede; gli esercizi si scelgono da un elenco di 876 esercizi (ricerca per nome, filtro per muscolo e attrezzo) oppure con un nome personalizzato. Per ogni esercizio imposti serie, ripetizioni e **tempo di recupero**
- **Allenamento**: per ogni serie inserisci kg e ripetizioni e spunti il completamento; i kg vengono precompilati con l'ultimo carico usato. Alla spunta parte il **timer di recupero** a video (−15 / +15 secondi, Salta); a fine tempo suona e vibra (dove il dispositivo lo permette). Lo schermo resta acceso durante l'allenamento
- **Scheda esercizio** ("Video e info"): immagini della posizione di partenza e di arrivo, muscoli coinvolti, istruzioni e pulsante per cercare il video su YouTube
- **Storico**: allenamenti passati con serie e volume totale (kg × ripetizioni)
- Dati salvati sul dispositivo (su web nel browser), nessun account necessario

## Dati degli esercizi

I nomi, i muscoli, le istruzioni e le immagini vengono da **[Free Exercise DB](https://github.com/yuhonas/free-exercise-db)** (pubblico dominio, licenza Unlicense). L'elenco è incluso nell'app (`src/data/exercises.json`), quindi la ricerca funziona anche offline; le immagini vengono caricate da GitHub. Nomi e istruzioni sono in inglese.

Per aggiornare l'elenco all'ultima versione del database: `node scripts/update-exercises.mjs`.

## Provala online (nessuna installazione)

Dopo ogni push su `main` l'app viene pubblicata automaticamente su GitHub Pages:

**https://xgiesc.github.io/Rep_Giesc/**

Aprila dal browser del PC o del telefono. Per averla come app:

- **iPhone (Safari)**: Condividi → *Aggiungi a schermata Home*
- **Android (Chrome)**: menu ⋮ → *Installa app* / *Aggiungi a schermata Home*

I dati restano salvati nel browser del dispositivo che usi.

> Prima pubblicazione: su GitHub vai in *Settings → Pages* e come *Source* scegli **GitHub Actions**.

## Avvio sul PC (sviluppo, serve Node.js)

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
src/exerciseDb.ts            ricerca esercizi, immagini, etichette in italiano
src/useRestTimer.ts          timer di recupero
src/feedback.ts              bip, vibrazione, schermo acceso
src/components.tsx           componenti UI condivisi
src/screens/                 Schede, Editor, Picklist esercizi, Allenamento,
                             Scheda esercizio, Storico
```

## Idee per i prossimi passi

- Grafici di progressione per esercizio
- Nomi degli esercizi in italiano
- Backup/sincronizzazione su cloud
- Pubblicazione negli store con EAS Build
