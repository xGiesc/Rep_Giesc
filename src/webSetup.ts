import { Platform } from 'react-native';

/**
 * Solo versione web: collega manifest e icone così che "Aggiungi a schermata
 * Home" (iPhone e Android) installi l'app a schermo intero. I percorsi sono
 * relativi alla pagina, quindi funzionano sia in locale sia su GitHub Pages
 * (sotto /Rep_Giesc/).
 */
export function setupWeb() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const head = document.head;
  const add = (tag: 'link' | 'meta', attrs: Record<string, string>) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    head.appendChild(el);
  };

  add('link', { rel: 'manifest', href: 'manifest.json' });
  add('link', { rel: 'apple-touch-icon', href: 'icons/icon-180.png' });
  add('meta', { name: 'theme-color', content: '#0f1115' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'GRG Personal Trainer' });
  add('meta', {
    name: 'apple-mobile-web-app-status-bar-style',
    content: 'black-translucent',
  });
  document.title = 'GRG Personal Trainer';
}
