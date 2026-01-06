export interface RappelConsoRecord {
  id: number;
  numero_fiche: string;
  numero_version?: number;
  nature_juridique_rappel?: string;
  marque_produit: string;
  modeles_ou_references: string;
  categorie_produit: string;
  sous_categorie_produit: string;
  conditionnements?: string;
  motif_rappel: string;
  risques_encourus: string;
  date_publication: string;
  date_debut_commercialisation?: string;
  date_date_fin_commercialisation?: string;
  temperature_conservation?: string;
  marque_salubrite?: string;
  informations_complementaires?: string;
  zone_geographique_de_vente?: string;
  distributeurs?: string;
  identification_produits?: string;
  liens_vers_les_images?: string;
  libelle?: string;
  preconisations_sanitaires?: string;
  description_complementaire_risque?: string;
  conduites_a_tenir_par_le_consommateur?: string;
  numero_contact?: string;
  modalites_de_compensation?: string;
  date_de_fin_de_la_procedure_de_rappel?: string;
  informations_complementaires_publiques?: string;
  lien_vers_la_liste_des_produits?: string;
  lien_vers_la_liste_des_distributeurs?: string;
  lien_vers_affichette_pdf?: string;
  lien_vers_la_fiche_rappel?: string;
  rappel_guid?: string;
}

export interface Recall {
  id: string;
  numeroFiche: string;
  numeroVersion?: number;
  natureJuridique?: string;
  title: string;
  brand: string;
  category: string;
  subCategory?: string;
  packaging?: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  reason: string;
  risks?: string;
  batchNumber?: string;
  recallDate: string;
  image?: string;
  commercialisationStart?: string;
  commercialisationEnd?: string;
  temperatureConservation?: string;
  marqueSalubrite?: string;
  additionalInfo?: string;
  geographicZone?: string;
  distributors?: string;
  healthRecommendations?: string;
  riskDescription?: string;
  consumerActions?: string;
  contactNumber?: string;
  compensationMethod?: string;
  procedureEndDate?: string;
  publicAdditionalInfo?: string;
  productListLink?: string;
  distributorsListLink?: string;
  posterPdfLink?: string;
  recallPageLink?: string;
  guid?: string;
}

// Récupérer les rappels depuis Supabase (remplace l'appel API gouvernemental)
export async function fetchRecalls(params?: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<{ recalls: Recall[]; total: number }> {
  // Note: Maintenant les données viennent de Supabase, pas de l'API gouvernementale
  // La synchronisation est faite toutes les 3h par la Edge Function
  const { searchHistoricalData } = await import('./historicalData');

  return searchHistoricalData({
    category: params?.category,
    limit: params?.limit || 50,
    offset: params?.offset || 0,
  });
}

// Rechercher des rappels par mot-clé (depuis Supabase)
export async function searchRecalls(query: string): Promise<Recall[]> {
  // Note: Recherche maintenant dans Supabase au lieu de l'API gouvernementale
  const { searchHistoricalData } = await import('./historicalData');

  const result = await searchHistoricalData({
    searchQuery: query,
    limit: 100,
  });

  return result.recalls;
}
