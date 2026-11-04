# GRG Personal Trainer

App per gestire gli allenamenti in palestra (stile Coach Plus): crei le tue schede, registri kg e ripetizioni serie per serie e rivedi lo storico. Un solo codice (React Native + Expo) per **iPhone, Android e web**.

## Funzioni

- **Schede**: gli esercizi si scelgono da un catalogo di circa 130 esercizi (ricerca per nome, filtro per muscolo e attrezzo) oppure con un nome personalizzato. Per ogni esercizio imposti serie, ripetizioni e **tempo di recupero**
- **Allenamento**: per ogni serie inserisci kg e ripetizioni e spunti il completamento; i kg vengono precompilati con l'ultimo carico usato. Alla spunta parte il **timer di recupero** a video (−15 / +15 secondi, Salta); a fine tempo suona e vibra (dove il dispositivo lo permette). Lo schermo resta acceso durante l'allenamento
- **Scheda esercizio** ("Video e info"): un omino animato disegnato dall’app mostra il movimento con i muscoli che lavorano in nero; poi muscoli coinvolti e istruzioni, tutto in italiano. Sono animazioni schematiche, non video reali
- **Storico**: allenamenti passati con serie e volume totale (kg × ripetizioni)
- Dati salvati sul dispositivo (su web nel browser), nessun account necessario

## Account, PT e clienti (Supabase)

Con il cloud attivo ogni persona accede con email e password e ha le sue schede e il suo storico. L’atleta **non può modificare le schede** (le assegna il PT; può solo aprirle, guardarle e, durante l’allenamento, aggiungere esercizi solo per quella seduta). Il **personal trainer** ha come schermata principale l’elenco dei **atleti** (con scadenze e ultimo allenamento, prima quelli da controllare); da Account può passare alla modalità allenamento per usare anche le proprie schede. Per ogni atleta crea/modifica/elimina le loro schede (compaiono subito sul loro telefono con la dicitura "Assegnata dal tuo personal trainer") e consulta il loro storico. I clienti si collegano al PT con il **codice PT** (6 caratteri, in Account del PT), in registrazione o dopo.

Attivazione (una volta sola):

1. Crea un progetto gratuito su https://supabase.com
2. *SQL Editor* → incolla tutto `supabase/schema.sql` → Run
3. *Authentication → Providers → Email*: disattiva **Confirm email** (così la registrazione è immediata)
4. *Project Settings → API*: copia **Project URL** e la chiave **anon public** in `src/config.ts`
5. Registrati nell'app, poi in SQL Editor: `update public.profiles set role = 'pt' where email = 'la-tua-email';`

Senza queste chiavi l'app funziona solo sul dispositivo, senza login.

## Scadenza delle schede

Ogni scheda può avere una **finestra temporale** (2, 4, 6, 8 o 12 settimane da oggi, oppure nessuna). Dopo la data la scheda risulta "scaduta" ed è il momento del controllo con il PT; nella home del PT i atleti con schede scadute o in scadenza (entro 7 giorni) compaiono per primi. Su ogni scheda si vede anche quanti allenamenti sono stati fatti.

## Catalogo esercizi

I nomi, i muscoli e le istruzioni sono scritti per questa app, in italiano, in `src/catalog.ts` (ogni esercizio ha il suo movimento animato in `src/anim/`). Per aggiungere un esercizio basta una riga in `ROWS`; per un movimento nuovo si aggiunge anche la posa in `src/anim/patterns.ts`.

## Provala online (nessuna installazione)

Dopo ogni push su `main` l'app viene pubblicata automaticamente su GitHub Pages:

**https://xgiesc.github.io/Rep_Giesc/**

Aprila dal browser del PC o del telefono. Per averla come app:

- **iPhone (Safari)**: Condividi → *Aggiungi a schermata Home*
- **Android (Chrome)**: menu ⋮ → *Installa app* / *Aggiungi a schermata Home*

I dati restano salvati nel browser del dispositivo che usi.

> Prima pubblicazione: su GitHub vai in *Settings → Pages* e come *Source* scegli **GitHub Actions**.

## Test automatici

```bash
npm test            # tipi + logica + browser (telefono e PC)
npm run test:logic  # solo logica: catalogo, animazioni, scadenze
npm run test:e2e    # solo browser (dopo npm run build:test)
```

Cosa controllano:

- **Logica**: ogni esercizio ha nome, istruzioni, muscoli e un movimento animato; ogni fotogramma di ogni animazione è valido e dentro il riquadro; scadenze e riconoscimento dei nomi in italiano.
- **Browser** (Chromium, schermo telefono 390 px e PC 1280 px): schede, apri scheda senza iniziare, animazione che si muove, allenamento, timer di recupero (parte, scorre, +15, salta, fine), esercizio aggiunto al volo, editor con scadenza e picklist, storico e dati dopo ricarica; login con banda del logo; atleta senza "Modifica"; PT con home dei atleti, cambio modalità e modifica schede dell'atleta; nessun errore in console e nessun elemento che sborda dallo schermo. Il cloud è simulato.

Su GitHub i test partono a ogni push (scheda *Actions*): **se falliscono l'app non viene pubblicata**. Gli screenshot delle schermate principali si scaricano dal report di ogni esecuzione.

Non c'è invece un confronto pixel-per-pixel degli screenshot (cambia con font e sistema): l'aspetto estetico va ancora guardato a occhio.

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
src/catalog.ts               catalogo esercizi in italiano
src/exerciseDb.ts            ricerca esercizi, etichette
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

## Sicurezza

- `supabase/schema.sql` va incollato in Supabase → SQL Editor (si può rieseguire). Attiva RLS su tutte le tabelle, toglie ogni permesso a chi non è loggato, l'atleta non può modificare schede, ruolo, PT o codice invito; il PT vede/gestisce solo i propri atleti.
- `supabase/verify.sql`: controlli da lanciare dopo lo schema.
- `npm run test:security` esegue davvero lo schema su un Postgres in memoria e prova le regole (fa parte della CI: se fallisce non si pubblica).
- Mai mettere nell'app la chiave `sb_secret_…` (solo quella `sb_publishable_…`). Se una secret key è stata condivisa, rigenerala in Supabase → Settings → API Keys.
- Consigliato in Supabase → Authentication: password minima 8 caratteri, rate limit attivi, (facoltativo) CAPTCHA.

## Marchio

Arancio/antracite di default. Alternative: `EXPO_PUBLIC_BRAND=cyan` o `red` in fase di build (vedi `src/brand.ts`).

## Notifiche e sblocco biometrico

- **Campanella** in alto per tutti gli utenti cloud. Atleta: scheda ricevuta, scheda in scadenza/scaduta, promemoria se non si allena da 7 giorni. Coach: schede degli atleti in scadenza/scadute, atleta fermo da 7+ giorni, allenamento completato, atleta senza schede (tocca la notifica per aprire l'atleta). Sono calcolate dai dati (nessuna tabella in più); lo stato "letta" è salvato sul dispositivo. Sono notifiche **dentro l'app**: non arrivano a app chiusa (servirebbero le notifiche push).
- **Sblocco con impronta / Face ID**: facoltativo, si attiva da Account (solo web/PWA, su dispositivi che lo supportano). Blocco locale al riavvio e dopo 1 minuto in background.
- Il coach, aprendo un atleta, parte direttamente dall'elenco di tutte le sue schede (Tutte / Da fare / Eseguite) e può aggiungerne.

## Tema chiaro/scuro

Da Account → Aspetto ognuno sceglie Chiaro o Scuro (antracite); la scelta resta sul dispositivo e la pagina si ricarica al cambio. Predefinito: chiaro.

## GIF di ExerciseDB (sperimentale)

Nella scheda di un esercizio l'app prova a caricare la GIF da ExerciseDB (ricerca per nome inglese ricavato da movimento e attrezzo; risultato ricordato sul dispositivo). Se il servizio non risponde o non trova nulla, mostra la sua animazione schematica; con "Mostra animazione schematica" si può tornare allo schema. Disattivare: `EXPO_PUBLIC_EXERCISEDB=off` in build, oppure revert del commit. Verificare i termini d'uso di ExerciseDB.
