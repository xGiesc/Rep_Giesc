# GRG Personal Trainer

App per gestire gli allenamenti in palestra (stile Coach Plus): crei le tue schede, registri kg e ripetizioni serie per serie e rivedi lo storico. Un solo codice (React Native + Expo) per **iPhone, Android e web**.

## Funzioni

- **Schede**: crea, modifica ed elimina schede; gli esercizi si scelgono da un elenco di 876 esercizi (ricerca per nome, filtro per muscolo e attrezzo) oppure con un nome personalizzato. Per ogni esercizio imposti serie, ripetizioni e **tempo di recupero**
- **Allenamento**: per ogni serie inserisci kg e ripetizioni e spunti il completamento; i kg vengono precompilati con l'ultimo carico usato. Alla spunta parte il **timer di recupero** a video (−15 / +15 secondi, Salta); a fine tempo suona e vibra (dove il dispositivo lo permette). Lo schermo resta acceso durante l'allenamento
- **Scheda esercizio** ("Video e info"): per i movimenti principali (circa 115 esercizi su 876) un omino animato disegnato dall’app, con i muscoli in rosso; per gli altri le foto di partenza e arrivo. Sempre muscoli coinvolti e istruzioni (animazioni schematiche, non video reali)
- **Storico**: allenamenti passati con serie e volume totale (kg × ripetizioni)
- Dati salvati sul dispositivo (su web nel browser), nessun account necessario

## Account, PT e clienti (Supabase)

Con il cloud attivo ogni persona accede con email e password e ha le sue schede e il suo storico. L’atleta **non può modificare le schede** (le assegna il PT; può solo aprirle, guardarle e, durante l’allenamento, aggiungere esercizi solo per quella seduta). Il **personal trainer** ha in più la scheda **Ragazzi**: vede i suoi clienti, crea/modifica/elimina le loro schede (compaiono subito sul loro telefono con la dicitura "Assegnata dal tuo personal trainer") e consulta il loro storico. I clienti si collegano al PT con il **codice PT** (6 caratteri, in Account del PT), in registrazione o dopo.

Attivazione (una volta sola):

1. Crea un progetto gratuito su https://supabase.com
2. *SQL Editor* → incolla tutto `supabase/schema.sql` → Run
3. *Authentication → Providers → Email*: disattiva **Confirm email** (così la registrazione è immediata)
4. *Project Settings → API*: copia **Project URL** e la chiave **anon public** in `src/config.ts`
5. Registrati nell'app, poi in SQL Editor: `update public.profiles set role = 'pt' where email = 'la-tua-email';`

Senza queste chiavi l'app funziona solo sul dispositivo, senza login.

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
src/cloud.ts                 dati su Supabase (schede, storico, profili)
src/Home.tsx                 schermate principali riusate da atleta e PT
src/exerciseDb.ts            ricerca esercizi, immagini, etichette in italiano
src/anim/                    motore delle animazioni SVG, movimenti e abbinamento agli esercizi
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
