import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Field, Header } from '../components';
import { BASE_FOODS, Food } from '../foodsBase';
import {
  Entry, MEALS, MealKey, entryMacros, foodToEntry, lookupBarcode, num, r1, searchOff,
} from '../nutrition';
import { colors, radius, spacing } from '../theme';
import { newId } from '../types';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function matches(list: Food[], q: string): Food[] {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return list.filter((f) => {
    const n = norm(f.name + ' ' + (f.brand ?? ''));
    return words.every((w) => n.includes(w));
  });
}

type View_ = { kind: 'search' } | { kind: 'custom' } | { kind: 'qty'; food: Food; entry?: Entry };

/**
 * Cerca un alimento (elenco incluso, miei alimenti, Open Food Facts), scegli i grammi e aggiungi al pasto.
 * Con `entry` modifica una voce già inserita.
 */
export function FoodSearch({
  meal: initialMeal, entry, foods, recents, onAdd, onUpdate, onDelete, onSaveFood, onRemoveFood, onBack,
}: {
  meal: MealKey;
  entry?: Entry;
  foods: Food[];
  recents: Food[];
  onAdd: (e: Entry) => void;
  onUpdate: (e: Entry) => void;
  onDelete: (id: string) => void;
  onSaveFood: (f: Food) => void;
  onRemoveFood: (id: string) => void;
  onBack: () => void;
}) {
  const [view, setView] = useState<View_>(
    entry
      ? { kind: 'qty', entry, food: { id: entry.id, name: entry.name, brand: entry.brand, kcal: entry.kcal, p: entry.p, c: entry.c, f: entry.f } }
      : { kind: 'search' },
  );
  const [meal, setMeal] = useState<MealKey>(initialMeal);

  if (view.kind === 'custom') {
    return (
      <CustomFood
        onBack={() => setView({ kind: 'search' })}
        onSave={(f) => {
          onSaveFood(f);
          setView({ kind: 'qty', food: f });
        }}
      />
    );
  }
  if (view.kind === 'qty') {
    return (
      <Quantity
        food={view.food}
        entry={view.entry}
        meal={meal}
        setMeal={setMeal}
        onBack={entry ? onBack : () => setView({ kind: 'search' })}
        onConfirm={(grams) => {
          if (view.entry) onUpdate({ ...view.entry, meal, grams });
          else onAdd(foodToEntry(view.food, grams, meal, newId()));
          onBack();
        }}
        onDelete={view.entry ? () => { onDelete(view.entry!.id); onBack(); } : undefined}
      />
    );
  }
  return (
    <Search
      meal={meal}
      foods={foods}
      recents={recents}
      onPick={(food) => setView({ kind: 'qty', food })}
      onCustom={() => setView({ kind: 'custom' })}
      onRemoveFood={onRemoveFood}
      onBack={onBack}
    />
  );
}

function Search({
  meal, foods, recents, onPick, onCustom, onRemoveFood, onBack,
}: {
  meal: MealKey;
  foods: Food[];
  recents: Food[];
  onPick: (f: Food) => void;
  onCustom: () => void;
  onRemoveFood: (id: string) => void;
  onBack: () => void;
}) {
  const [q, setQ] = useState('');
  const [online, setOnline] = useState<Food[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const seq = useRef(0);
  const query = q.trim();

  useEffect(() => {
    setOnline([]);
    if (query.length < 3) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const my = ++seq.current;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = /^\d{8,14}$/.test(query)
          ? await lookupBarcode(query, ctl.signal).then((x) => (x ? [x] : []))
          : await searchOff(query, ctl.signal);
        if (seq.current === my) { setOnline(res); setStatus('done'); }
      } catch {
        if (seq.current === my && !ctl.signal.aborted) setStatus('error');
      }
    }, 500);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [query]);

  const mine = useMemo(() => (query ? matches(foods, query) : foods), [foods, query]);
  const base = useMemo(() => matches(BASE_FOODS, query), [query]);
  const rec = useMemo(() => (query ? [] : recents.slice(0, 12)), [query, recents]);
  const label = MEALS.find((m) => m.key === meal)?.label ?? '';

  return (
    <View style={{ flex: 1 }}>
      <Header title={`Aggiungi a ${label.toLowerCase()}`} onBack={onBack} />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Field
          value={q}
          onChangeText={setQ}
          placeholder="Cerca un alimento o un codice a barre…"
          autoFocus
          autoCorrect={false}
          testID="food-search"
        />
      </View>
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <Button label="+ Crea un alimento" variant="ghost" onPress={onCustom} />
        <Text style={styles.muted}>Gli alimenti comuni sono riferiti al peso a crudo: pesa pasta, riso, carne e pesce prima di cuocerli.</Text>
        {rec.length ? <Section title="Recenti">{rec.map((f) => <FoodRow key={f.id} food={f} onPress={() => onPick(f)} />)}</Section> : null}
        {mine.length ? (
          <Section title="I miei alimenti">
            {mine.map((f) => <FoodRow key={f.id} food={f} onPress={() => onPick(f)} onRemove={() => onRemoveFood(f.id)} />)}
          </Section>
        ) : null}
        {base.length ? <Section title="Alimenti comuni">{base.slice(0, 40).map((f) => <FoodRow key={f.id} food={f} onPress={() => onPick(f)} />)}</Section> : null}
        {query.length >= 3 ? (
          <Section title="Prodotti confezionati (Open Food Facts)">
            {status === 'loading' ? <ActivityIndicator color={colors.accent} style={{ margin: spacing.md }} /> : null}
            {status === 'error' ? <Text style={styles.muted}>Ricerca online non disponibile: controlla la connessione. Gli alimenti comuni restano utilizzabili.</Text> : null}
            {status === 'done' && online.length === 0 ? <Text style={styles.muted}>Nessun prodotto trovato. Puoi crearlo a mano con «Crea un alimento».</Text> : null}
            {online.map((f) => <FoodRow key={f.id} food={f} onPress={() => onPick(f)} />)}
          </Section>
        ) : !rec.length && !mine.length ? (
          <Text style={styles.muted}>Scrivi almeno 3 lettere per cercare anche tra i prodotti confezionati, oppure incolla il codice a barre.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.section}>{title}</Text>
      {children}
    </View>
  );
}

function FoodRow({ food, onPress, onRemove }: { food: Food; onPress: () => void; onRemove?: () => void }) {
  return (
    <View style={styles.rowWrap}>
      <Pressable onPress={onPress} style={styles.food} testID="food-row">
        <View style={{ flex: 1 }}>
          <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
          <Text style={styles.muted} numberOfLines={1}>
            {food.brand ? food.brand + ' · ' : ''}{Math.round(food.kcal)} kcal · P {r1(food.p)} · C {r1(food.c)} · G {r1(food.f)} (100 g)
          </Text>
        </View>
        <Text style={styles.plus}>+</Text>
      </Pressable>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} style={styles.del}><Text style={styles.delText}>✕</Text></Pressable>
      ) : null}
    </View>
  );
}

function Quantity({
  food, entry, meal, setMeal, onConfirm, onDelete, onBack,
}: {
  food: Food;
  entry?: Entry;
  meal: MealKey;
  setMeal: (m: MealKey) => void;
  onConfirm: (grams: number) => void;
  onDelete?: () => void;
  onBack: () => void;
}) {
  const [grams, setGrams] = useState(String(entry?.grams ?? food.serving ?? 100));
  const g = num(grams);
  const m = entryMacros({ grams: g, kcal: food.kcal, p: food.p, c: food.c, f: food.f });
  const ok = g > 0 && g <= 5000;
  return (
    <View style={{ flex: 1 }}>
      <Header title={entry ? 'Modifica quantità' : 'Quantità'} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: spacing.xs }}>
          <Text style={styles.foodTitle}>{food.name}</Text>
          {food.brand ? <Text style={styles.muted}>{food.brand}</Text> : null}
          {food.id.startsWith('base:') ? <Text style={styles.muted}>Peso a crudo, prima della cottura.</Text> : null}
          <Text style={styles.muted}>Per 100 g: {Math.round(food.kcal)} kcal · P {r1(food.p)} · C {r1(food.c)} · G {r1(food.f)}</Text>
        </Card>
        <Field
          label="Quantità (grammi)"
          value={grams}
          onChangeText={setGrams}
          keyboardType="decimal-pad"
          autoFocus
          selectTextOnFocus
          onSubmitEditing={() => ok && onConfirm(g)}
          testID="food-grams"
        />
        <View style={styles.wrap}>
          <Chip label="100 g" active={g === 100} onPress={() => setGrams('100')} />
          {food.serving && food.serving !== 100 ? <Chip label={`1 porzione (${food.serving} g)`} active={g === food.serving} onPress={() => setGrams(String(food.serving))} /> : null}
          {[50, 150, 200].map((x) => <Chip key={x} label={`${x} g`} active={g === x} onPress={() => setGrams(String(x))} />)}
        </View>
        <Card style={styles.totals} testID="food-total">
          <Text style={styles.big}>{Math.round(m.kcal)} kcal</Text>
          <Text style={styles.muted}>Proteine {r1(m.p)} g · Carboidrati {r1(m.c)} g · Grassi {r1(m.f)} g</Text>
        </Card>
        <Text style={styles.section}>Pasto</Text>
        <View style={styles.wrap}>
          {MEALS.map((x) => <Chip key={x.key} label={x.label} active={meal === x.key} onPress={() => setMeal(x.key)} />)}
        </View>
        <Button label={entry ? 'Aggiorna' : 'Aggiungi'} disabled={!ok} onPress={() => onConfirm(g)} />
        {onDelete ? <Button label="Elimina dal diario" variant="ghost" onPress={onDelete} /> : null}
      </ScrollView>
    </View>
  );
}

function CustomFood({ onSave, onBack }: { onSave: (f: Food) => void; onBack: () => void }) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [serving, setServing] = useState('');
  const k = num(kcal);
  const ok = name.trim().length > 0 && k >= 0 && k <= 900 && kcal.trim() !== '' && num(p) >= 0 && num(c) >= 0 && num(f) >= 0;
  return (
    <View style={{ flex: 1 }}>
      <Header title="Nuovo alimento" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <Text style={styles.muted}>Inserisci i valori per 100 g, come scritti sull’etichetta.</Text>
        <Field label="Nome" value={name} onChangeText={setName} placeholder="Es. Pane di mia nonna" autoFocus testID="custom-name" />
        <Field label="Calorie (kcal) per 100 g" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" testID="custom-kcal" />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}><Field label="Proteine (g)" value={p} onChangeText={setP} keyboardType="decimal-pad" testID="custom-p" /></View>
          <View style={{ flex: 1 }}><Field label="Carbo (g)" value={c} onChangeText={setC} keyboardType="decimal-pad" testID="custom-c" /></View>
          <View style={{ flex: 1 }}><Field label="Grassi (g)" value={f} onChangeText={setF} keyboardType="decimal-pad" testID="custom-f" /></View>
        </View>
        <Field label="Porzione tipica in grammi (facoltativo)" value={serving} onChangeText={setServing} keyboardType="decimal-pad" />
        <Button
          label="Salva e scegli la quantità"
          disabled={!ok}
          onPress={() =>
            onSave({
              id: 'custom:' + newId(), name: name.trim().slice(0, 80),
              kcal: r1(k), p: r1(num(p)), c: r1(num(c)), f: r1(num(f)),
              serving: num(serving) > 0 && num(serving) < 1000 ? num(serving) : undefined,
            })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  section: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  food: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  foodName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  plus: { color: colors.accentInk, fontSize: 24, fontWeight: '700' },
  del: { padding: spacing.sm },
  delText: { color: colors.muted, fontSize: 16 },
  foodTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  totals: { gap: spacing.xs, alignItems: 'center' },
  big: { color: colors.text, fontSize: 32, fontWeight: '900' },
  row2: { flexDirection: 'row', gap: spacing.sm },
});
