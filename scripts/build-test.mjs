// Costruisce le due versioni web usate dai test:
//  - dist-local: senza cloud (tutto sul dispositivo, senza login)
//  - dist-cloud: con cloud "finto" (le chiamate vengono simulate dai test)
import { execSync } from 'node:child_process';

const run = (outDir, env) =>
  execSync(`npx expo export --platform web --output-dir ${outDir}`, {
    stdio: 'inherit',
    env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', ...env },
  });

run('dist-local', { EXPO_PUBLIC_SUPABASE_URL: '', EXPO_PUBLIC_SUPABASE_ANON_KEY: '' });
run('dist-cloud', {
  EXPO_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'mock-key',
});
