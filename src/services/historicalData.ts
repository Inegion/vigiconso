import type { Recall, RappelConsoRecord } from "./api";
import { supabase } from "./supabase";

// Fonction pour mapper les données du JSON historique
function mapRecordToRecall(record: RappelConsoRecord): Recall {
  const determineRiskLevel = (
    risks: string,
    reason: string
  ): Recall["riskLevel"] => {
    const text = `${risks} ${reason}`.toLowerCase();

    if (
      text.includes("décès") ||
      text.includes("salmonelle") ||
      text.includes("listeria") ||
      text.includes("e.coli") ||
      text.includes("botulisme") ||
      text.includes("danger grave")
    ) {
      return "critical";
    }

    if (
      text.includes("étouffement") ||
      text.includes("allergène") ||
      text.includes("blessure") ||
      text.includes("brûlure") ||
      text.includes("intoxication")
    ) {
      return "high";
    }

    if (
      text.includes("attention") ||
      text.includes("défaut") ||
      text.includes("contamination")
    ) {
      return "medium";
    }

    return "low";
  };

  const extractBatchNumber = (
    identification: string | undefined
  ): string | undefined => {
    if (!identification) return undefined;
    const parts = identification.split("$");
    if (parts.length >= 2 && parts[1]) {
      return parts[1];
    }
    return undefined;
  };

  const extractFirstImage = (images: string | undefined): string | undefined => {
    if (!images) return undefined;
    const imageUrls = images.split("|");
    return imageUrls[0] || undefined;
  };

  const riskLevel = determineRiskLevel(
    record.risques_encourus || "",
    record.motif_rappel || ""
  );

  return {
    id: record.numero_fiche || String(record.id),
    numeroFiche: record.numero_fiche,
    numeroVersion: record.numero_version,
    natureJuridique: record.nature_juridique_rappel,
    title: record.libelle || record.modeles_ou_references || "Produit sans nom",
    brand: record.marque_produit || "Marque inconnue",
    category: record.categorie_produit || "Non catégorisé",
    subCategory: record.sous_categorie_produit,
    packaging: record.conditionnements,
    riskLevel,
    reason: record.motif_rappel || "Motif non précisé",
    risks: record.risques_encourus,
    batchNumber: extractBatchNumber(record.identification_produits),
    recallDate: record.date_publication,
    image: extractFirstImage(record.liens_vers_les_images),
    commercialisationStart: record.date_debut_commercialisation,
    commercialisationEnd: record.date_date_fin_commercialisation,
    temperatureConservation: record.temperature_conservation,
    marqueSalubrite: record.marque_salubrite,
    additionalInfo: record.informations_complementaires,
    geographicZone: record.zone_geographique_de_vente,
    distributors: record.distributeurs,
    healthRecommendations: record.preconisations_sanitaires,
    riskDescription: record.description_complementaire_risque,
    consumerActions: record.conduites_a_tenir_par_le_consommateur,
    contactNumber: record.numero_contact,
    compensationMethod: record.modalites_de_compensation,
    procedureEndDate: record.date_de_fin_de_la_procedure_de_rappel,
    publicAdditionalInfo: record.informations_complementaires_publiques,
    productListLink: record.lien_vers_la_liste_des_produits,
    distributorsListLink: record.lien_vers_la_liste_des_distributeurs,
    posterPdfLink: record.lien_vers_affichette_pdf,
    recallPageLink: record.lien_vers_la_fiche_rappel,
    guid: record.rappel_guid,
  };
}

// Cache pour les données historiques (7 jours)
const HISTORICAL_CACHE_KEY = "rappelconso_historical_data";
const HISTORICAL_CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 jours

interface HistoricalCache {
  data: Recall[];
  timestamp: number;
}

// Charger depuis le cache localStorage
function getHistoricalCache(): Recall[] | null {
  try {
    const cached = localStorage.getItem(HISTORICAL_CACHE_KEY);
    if (!cached) return null;

    const parsedCache: HistoricalCache = JSON.parse(cached);

    // Vérifier si le cache est encore valide
    if (Date.now() - parsedCache.timestamp > HISTORICAL_CACHE_DURATION) {
      localStorage.removeItem(HISTORICAL_CACHE_KEY);
      return null;
    }

    // Reconstituer les données avec les champs manquants
    const fullData = parsedCache.data.map(recall => ({
      ...recall,
      image: undefined, // Pas d'image dans le cache
    }));

    console.log(`✓ Données historiques chargées depuis le cache (${fullData.length} rappels)`);
    return fullData as Recall[];
  } catch (error) {
    console.error("Erreur lors de la lecture du cache:", error);
    return null;
  }
}

// Sauvegarder dans le cache localStorage (version compressée)
function setHistoricalCache(data: Recall[]): void {
  try {
    // Compresser les données en supprimant les images et en ne gardant que l'essentiel
    const compressedData = data.map(recall => ({
      id: recall.id,
      title: recall.title.substring(0, 100), // Limiter la taille
      brand: recall.brand.substring(0, 50),
      category: recall.category,
      riskLevel: recall.riskLevel,
      reason: recall.reason.substring(0, 100),
      batchNumber: recall.batchNumber,
      recallDate: recall.recallDate,
      // On supprime l'image pour économiser de l'espace
    }));

    const cache = {
      data: compressedData,
      timestamp: Date.now(),
    };

    localStorage.setItem(HISTORICAL_CACHE_KEY, JSON.stringify(cache));
    const sizeInMB = (new Blob([JSON.stringify(cache)]).size / (1024 * 1024)).toFixed(2);
    console.log(`✓ Données historiques mises en cache (${data.length} rappels, ${sizeInMB} MB)`);
  } catch (error) {
    console.error("Erreur lors de la mise en cache:", error);
    // Si le cache échoue, on continue sans cache
  }
}

// Charger les données historiques depuis Supabase
export async function loadHistoricalData(): Promise<Recall[]> {
  // 1. Vérifier le cache d'abord
  const cached = getHistoricalCache();
  if (cached) {
    return cached;
  }

  // 2. Si pas de cache, charger depuis Supabase
  try {
    console.log("⏳ Chargement des données historiques depuis Supabase...");
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('rappel')
      .select('*')
      .order('date_publication', { ascending: false });

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    if (!data) {
      throw new Error('Aucune donnée reçue de Supabase');
    }

    const recalls = data.map(mapRecordToRecall);

    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Données historiques chargées depuis Supabase en ${loadTime}s (${recalls.length} rappels)`);

    // 3. Mettre en cache pour les prochaines fois
    setHistoricalCache(recalls);

    return recalls;
  } catch (error) {
    console.error("Erreur lors du chargement depuis Supabase:", error);
    return [];
  }
}

// Rechercher dans Supabase avec pagination et filtres
export async function searchHistoricalData(params?: {
  category?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}): Promise<{ recalls: Recall[]; total: number }> {
  try {
    let query = supabase
      .from('rappel')
      .select('*', { count: 'exact' });

    // Filtrer par catégorie
    if (params?.category) {
      query = query.eq('categorie_produit', params.category);
    }

    // Recherche textuelle
    if (params?.searchQuery) {
      query = query.or(`marque_produit.ilike.%${params.searchQuery}%,modeles_ou_references.ilike.%${params.searchQuery}%,motif_rappel.ilike.%${params.searchQuery}%`);
    }

    // Pagination
    if (params?.limit) {
      query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);
    }

    // Tri par date
    query = query.order('date_publication', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    const recalls = (data || []).map(mapRecordToRecall);

    return {
      recalls,
      total: count || 0,
    };
  } catch (error) {
    console.error("Erreur lors de la recherche Supabase:", error);
    return { recalls: [], total: 0 };
  }
}
