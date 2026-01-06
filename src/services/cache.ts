import type { Recall } from "./api";

const CACHE_KEY = "rappelconso_cache";
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface CacheData {
  recalls: Recall[];
  timestamp: number;
  total: number;
}

export function getCachedRecalls(): { recalls: Recall[]; total: number } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CacheData = JSON.parse(cached);
    const now = Date.now();

    // Vérifier si le cache est encore valide
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    console.log(`✓ Rappels récents chargés depuis le cache (${data.recalls.length} rappels)`);
    return { recalls: data.recalls, total: data.total };
  } catch (error) {
    console.error("Erreur lors de la lecture du cache:", error);
    return null;
  }
}

export function setCachedRecalls(recalls: Recall[], total: number): void {
  try {
    const data: CacheData = {
      recalls,
      timestamp: Date.now(),
      total,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    console.log(`✓ Rappels récents mis en cache (${recalls.length} rappels, expire dans 30 min)`);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du cache:", error);
  }
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log("✓ Cache des rappels récents vidé");
}

export function clearAllCache(): void {
  // Vider le cache des rappels récents
  localStorage.removeItem(CACHE_KEY);
  // Vider le cache des données historiques
  localStorage.removeItem("rappelconso_historical_data");
  console.log("✓ Tous les caches vidés (récents + historiques)");
}

export function getCacheInfo(): {
  recentCache: { size: string; age: string } | null;
  historicalCache: { size: string; age: string } | null;
} {
  const getSize = (key: string) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const sizeInBytes = new Blob([item]).size;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    return sizeInMB;
  };

  const getAge = (key: string) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      const data = JSON.parse(item);
      const ageInMinutes = Math.floor((Date.now() - data.timestamp) / (1000 * 60));
      return `${ageInMinutes} min`;
    } catch {
      return "inconnu";
    }
  };

  const recentSize = getSize(CACHE_KEY);
  const historicalSize = getSize("rappelconso_historical_data");

  return {
    recentCache: recentSize
      ? { size: `${recentSize} MB`, age: getAge(CACHE_KEY) || "inconnu" }
      : null,
    historicalCache: historicalSize
      ? { size: `${historicalSize} MB`, age: getAge("rappelconso_historical_data") || "inconnu" }
      : null,
  };
}
