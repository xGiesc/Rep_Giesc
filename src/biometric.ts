import { Platform } from 'react-native';

/**
 * Blocco dell'app con impronta / Face ID (WebAuthn, solo web/PWA).
 * È un blocco locale facoltativo: l'identità resta quella dell'accesso con email e password.
 */
const key = (uid: string) => `biolock:${uid}`;

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!(window as any).PublicKeyCredential;

export async function biometricAvailable(): Promise<boolean> {
  if (!isWeb()) return false;
  try {
    return await (window as any).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function biometricEnabled(uid: string): boolean {
  try {
    return !!window.localStorage.getItem(key(uid));
  } catch {
    return false;
  }
}

const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const rand = (n = 32) => crypto.getRandomValues(new Uint8Array(n));

export async function enableBiometric(uid: string, label: string): Promise<boolean> {
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: rand(),
        rp: { name: 'GRG Personal Trainer' },
        user: { id: new TextEncoder().encode(uid), name: label || uid, displayName: label || 'Utente' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    window.localStorage.setItem(key(uid), toB64(cred.rawId));
    return true;
  } catch {
    return false;
  }
}

export async function unlockBiometric(uid: string): Promise<boolean> {
  try {
    const id = window.localStorage.getItem(key(uid));
    if (!id) return true;
    const res = await navigator.credentials.get({
      publicKey: {
        challenge: rand(),
        allowCredentials: [{ type: 'public-key', id: fromB64(id) }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return !!res;
  } catch {
    return false;
  }
}

export function disableBiometric(uid: string) {
  try {
    window.localStorage.removeItem(key(uid));
  } catch {
    /* niente */
  }
}
