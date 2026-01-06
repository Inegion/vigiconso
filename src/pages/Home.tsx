import { useState, useEffect } from "react";
import { RecallCard } from "../components/RecallCard";
import { RecallDetailModal } from "../components/RecallDetailModal";
import { fetchRecalls } from "../services/api";
import { getCachedRecalls, setCachedRecalls } from "../services/cache";
import type { Recall } from "../services/api";

export function Home() {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedRecall, setSelectedRecall] = useState<Recall | null>(null);

  // Charger les rappels depuis l'API avec cache
  useEffect(() => {
    const loadRecalls = async () => {
      try {
        setLoading(true);

        // Vérifier le cache d'abord
        const cached = getCachedRecalls();
        if (cached) {
          setRecalls(cached.recalls);
          setLoading(false);
          return;
        }

        // Si pas de cache, charger depuis l'API
        const { recalls: data } = await fetchRecalls({ limit: 50 });
        setRecalls(data);
        setCachedRecalls(data, data.length);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les rappels. Veuillez réessayer.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRecalls();
  }, []);

  // Filtrer les rappels par niveau de risque
  const filteredRecalls =
    filter === "all"
      ? recalls
      : recalls.filter((r) => r.riskLevel === filter);

  // Calculer les statistiques
  const getStats = () => {
    const categoryStats: Record<string, number> = {};
    const riskStats: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    recalls.forEach((recall) => {
      categoryStats[recall.category] = (categoryStats[recall.category] || 0) + 1;
      riskStats[recall.riskLevel]++;
    });

    return {
      categories: Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4),
      risks: riskStats,
      total: recalls.length,
    };
  };

  const stats = getStats();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Rappels de produits récents
          </h1>
          <p className="text-lg text-gray-600">
            Consultez les {recalls.length} derniers rappels de produits en France
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loader */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-sm w-full">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-900 font-semibold mb-1">Chargement des rappels</p>
                <p className="text-sm text-gray-500">Récupération des derniers rappels...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Statistiques globales */}
            <div id="statistiques" className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Statistiques générales
              </h2>

              {/* Statistiques par niveau de risque */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-700">
                    {stats.risks.critical}
                  </div>
                  <div className="text-xs text-red-600 mt-1 font-medium uppercase">
                    Danger critique
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-700">
                    {stats.risks.high}
                  </div>
                  <div className="text-xs text-orange-600 mt-1 font-medium uppercase">
                    Risque élevé
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-700">
                    {stats.risks.medium}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1 font-medium uppercase">
                    Attention
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-700">
                    {stats.risks.low}
                  </div>
                  <div className="text-xs text-blue-600 mt-1 font-medium uppercase">
                    Information
                  </div>
                </div>
              </div>

              {/* Statistiques par catégorie */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Catégories les plus touchées
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.categories.map(([category, count]: [string, number]) => (
                    <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-600 mt-1">{category}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Tous les rappels
          </button>
          <button
            onClick={() => setFilter("critical")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "critical"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Danger critique
          </button>
          <button
            onClick={() => setFilter("high")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "high"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Risque élevé
          </button>
          <button
            onClick={() => setFilter("medium")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "medium"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Attention
          </button>
        </div>

        {/* Nombre de résultats */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {filteredRecalls.length} rappel
            {filteredRecalls.length > 1 ? "s" : ""} trouvé
            {filteredRecalls.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Liste des rappels */}
        <div id="rappels" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecalls.map((recall) => (
            <RecallCard
              key={recall.id}
              title={recall.title}
              brand={recall.brand}
              category={recall.category}
              subCategory={recall.subCategory}
              riskLevel={recall.riskLevel}
              reason={recall.reason}
              risks={recall.risks}
              batchNumber={recall.batchNumber}
              recallDate={recall.recallDate}
              image={recall.image}
              packaging={recall.packaging}
              temperatureConservation={recall.temperatureConservation}
              geographicZone={recall.geographicZone}
              distributors={recall.distributors}
              compensationMethod={recall.compensationMethod}
              contactNumber={recall.contactNumber}
              posterPdfLink={recall.posterPdfLink}
              recallPageLink={recall.recallPageLink}
              onClick={() => setSelectedRecall(recall)}
            />
          ))}
        </div>

        {/* Information pratique */}
        <div id="informations" className="mt-12 bg-white border border-gray-200 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Que faire en cas de rappel ?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-900 font-bold mb-3">
                1
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                Ne pas consommer
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Si vous possédez ce produit, ne le consommez pas et ne
                l'utilisez pas.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-900 font-bold mb-3">
                2
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                Rapporter en magasin
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Retournez le produit au point de vente pour un remboursement
                complet.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-900 font-bold mb-3">
                3
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                Consulter un médecin
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                En cas de symptômes, contactez votre médecin ou le centre
                antipoison.
              </p>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer id="a-propos" className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-600">
            Données officielles fournies par RappelConso - Gouvernement français
          </p>
        </div>
      </footer>

      {/* Modal de détail */}
      <RecallDetailModal
        recall={selectedRecall}
        onClose={() => setSelectedRecall(null)}
      />
    </>
  );
}
