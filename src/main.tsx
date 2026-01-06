import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { clearAllCache, getCacheInfo } from './services/cache'

// Exposer des utilitaires de cache dans la console pour le développement
(window as any).rappelconso = {
  clearCache: () => {
    clearAllCache();
    console.log("🗑️  Cache vidé ! Rechargez la page pour voir l'effet.");
  },
  cacheInfo: () => {
    const info = getCacheInfo();
    console.log("📦 Informations du cache:");
    console.log("  Rappels récents:", info.recentCache || "Non mis en cache");
    console.log("  Données historiques:", info.historicalCache || "Non mises en cache");
  }
};

// Vider l'ancien cache volumineux au démarrage (une seule fois)
if (!localStorage.getItem('cache_migrated_v2')) {
  console.log("🔄 Migration du cache vers le nouveau format compressé...");
  clearAllCache();
  localStorage.setItem('cache_migrated_v2', 'true');
}

// Message de bienvenue dans la console
console.log(`
%c🚀 RappelConso - Tableau de bord
%cCommandes disponibles dans la console:
%c  rappelconso.cacheInfo()  %c- Afficher les infos du cache
%c  rappelconso.clearCache() %c- Vider tout le cache
`,
  "color: #dc2626; font-size: 16px; font-weight: bold;",
  "color: #4b5563; font-size: 12px;",
  "color: #2563eb; font-size: 11px;", "color: #6b7280; font-size: 11px;",
  "color: #2563eb; font-size: 11px;", "color: #6b7280; font-size: 11px;"
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
