import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Début de la synchronisation des rappels...");

    // Appeler l'API RappelConso
    const API_BASE_URL = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces";

    // Récupérer les 100 rappels les plus récents (ajustable)
    const queryParams = new URLSearchParams({
      limit: "100",
      offset: "0",
      order_by: "date_publication DESC",
    });

    const response = await fetch(`${API_BASE_URL}/records?${queryParams}`);

    if (!response.ok) {
      throw new Error(`Erreur API gouvernementale: ${response.status}`);
    }

    const data = await response.json();
    const records = data.results;

    console.log(`📦 ${records.length} rappels récupérés depuis l'API gouvernementale`);

    // Préparer les données pour insertion
    const recordsToInsert = records.map((record: any) => ({
      id: record.id,
      numero_fiche: record.numero_fiche,
      numero_version: record.numero_version,
      nature_juridique_rappel: record.nature_juridique_rappel,
      marque_produit: record.marque_produit,
      modeles_ou_references: record.modeles_ou_references,
      categorie_produit: record.categorie_produit,
      sous_categorie_produit: record.sous_categorie_produit,
      conditionnements: record.conditionnements,
      motif_rappel: record.motif_rappel,
      risques_encourus: record.risques_encourus,
      date_publication: record.date_publication,
      date_debut_commercialisation: record.date_debut_commercialisation,
      date_date_fin_commercialisation: record.date_date_fin_commercialisation,
      temperature_conservation: record.temperature_conservation,
      marque_salubrite: record.marque_salubrite,
      informations_complementaires: record.informations_complementaires,
      zone_geographique_de_vente: record.zone_geographique_de_vente,
      distributeurs: record.distributeurs,
      identification_produits: record.identification_produits,
      liens_vers_les_images: record.liens_vers_les_images,
      libelle: record.libelle,
      preconisations_sanitaires: record.preconisations_sanitaires,
      description_complementaire_risque: record.description_complementaire_risque,
      conduites_a_tenir_par_le_consommateur: record.conduites_a_tenir_par_le_consommateur,
      numero_contact: record.numero_contact,
      modalites_de_compensation: record.modalites_de_compensation,
      date_de_fin_de_la_procedure_de_rappel: record.date_de_fin_de_la_procedure_de_rappel,
      informations_complementaires_publiques: record.informations_complementaires_publiques,
      lien_vers_la_liste_des_produits: record.lien_vers_la_liste_des_produits,
      lien_vers_la_liste_des_distributeurs: record.lien_vers_la_liste_des_distributeurs,
      lien_vers_affichette_pdf: record.lien_vers_affichette_pdf,
      lien_vers_la_fiche_rappel: record.lien_vers_la_fiche_rappel,
      rappel_guid: record.rappel_guid,
      synced_at: new Date().toISOString(),
    }));

    // Insérer ou mettre à jour dans Supabase (upsert basé sur numero_fiche)
    const { data: insertedData, error } = await supabase
      .from("rappel")
      .upsert(recordsToInsert, {
        onConflict: "numero_fiche",
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Synchronisation terminée avec succès`);

    return new Response(
      JSON.stringify({
        success: true,
        recordsProcessed: records.length,
        message: "Synchronisation réussie",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
