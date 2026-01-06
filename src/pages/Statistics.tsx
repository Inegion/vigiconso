import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { loadHistoricalData } from "../services/historicalData";
import type { Recall } from "../services/api";

const COLORS = {
  critical: "#b91c1c",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#2563eb",
  food: "#16a34a",
  nonFood: "#6b7280",
};

const CATEGORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#6366f1", "#f43f5e", "#14b8a6", "#f97316", "#a855f7"
];

export function Statistics() {
  const [allRecalls, setAllRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les filtres
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("📊 Démarrage du chargement des statistiques depuis Supabase...");
        const startTime = Date.now();

        // Charger toutes les données depuis Supabase (avec cache localStorage)
        const allData = await loadHistoricalData();

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Chargement terminé en ${totalTime}s - ${allData.length} rappels disponibles`);

        setAllRecalls(allData);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Pré-calculer les timestamps pour optimiser les comparaisons de dates
  const recallsWithTimestamps = useMemo(() => {
    return allRecalls.map(recall => ({
      ...recall,
      timestamp: new Date(recall.recallDate).getTime(),
      year: new Date(recall.recallDate).getFullYear().toString()
    }));
  }, [allRecalls]);

  // Appliquer les filtres (optimisé avec timestamps pré-calculés)
  const recalls = useMemo(() => {
    return recallsWithTimestamps.filter((recall) => {
      const matchesYear = selectedYear === "all" || recall.year === selectedYear;
      const matchesCategory = selectedCategory === "all" || recall.category === selectedCategory;
      const matchesRisk = selectedRisk === "all" || recall.riskLevel === selectedRisk;
      return matchesYear && matchesCategory && matchesRisk;
    });
  }, [recallsWithTimestamps, selectedYear, selectedCategory, selectedRisk]);

  // Extraire les valeurs uniques pour les filtres (optimisé)
  const uniqueYears = useMemo(() => {
    const years = Array.from(
      new Set(recallsWithTimestamps.map((r) => r.year))
    ).sort((a, b) => parseInt(b) - parseInt(a));
    return years;
  }, [recallsWithTimestamps]);

  const uniqueCategories = useMemo(() => {
    const categories = Array.from(new Set(recallsWithTimestamps.map((r) => r.category))).sort();
    return categories;
  }, [recallsWithTimestamps]);

  const riskLevels = [
    { value: "critical", label: "Danger critique" },
    { value: "high", label: "Risque élevé" },
    { value: "medium", label: "Attention" },
    { value: "low", label: "Information" },
  ];

  // ======== DÉFINITION DE TOUTES LES FONCTIONS DE CALCUL ========
  // (doivent être définies AVANT les useMemo)

  // Calculs KPIs
  const getKPIs = () => {
    if (recalls.length === 0) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const last30Days = recalls.filter(
      (r) => new Date(r.recallDate) >= thirtyDaysAgo
    ).length;

    const previous30Days = recalls.filter(
      (r) =>
        new Date(r.recallDate) >= sixtyDaysAgo &&
        new Date(r.recallDate) < thirtyDaysAgo
    ).length;

    const trendPercentage =
      previous30Days > 0
        ? ((last30Days - previous30Days) / previous30Days) * 100
        : 0;

    const criticalCount = recalls.filter((r) => r.riskLevel === "critical")
      .length;
    const criticalPercentage = (criticalCount / recalls.length) * 100;

    // Calculer la moyenne par mois
    const oldestDate = new Date(
      Math.min(...recalls.map((r) => new Date(r.recallDate).getTime()))
    );
    const monthsDiff =
      (now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const avgPerMonth = recalls.length / monthsDiff;

    // Top catégorie
    const categoryStats: Record<string, number> = {};
    recalls.forEach((r) => {
      categoryStats[r.category] = (categoryStats[r.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryStats).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      total: recalls.length,
      last30Days,
      trendPercentage,
      criticalPercentage,
      avgPerMonth,
      topCategory: topCategory ? topCategory[0] : "N/A",
      topCategoryCount: topCategory ? topCategory[1] : 0,
    };
  };

  // Graphique: Évolution mensuelle
  const getMonthlyRecalls = () => {
    const monthlyData: Record<string, { count: number; date: Date }> = {};

    recalls.forEach((recall) => {
      const date = new Date(recall.recallDate);
      const monthYear = `${date.toLocaleString("fr-FR", {
        month: "short",
      })} ${date.getFullYear()}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { count: 0, date };
      }
      monthlyData[monthYear].count++;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        mois: month,
        rappels: data.count,
        sortDate: data.date.getTime(),
      }))
      .sort((a, b) => a.sortDate - b.sortDate)
      .slice(-12) // 12 derniers mois (optimisé)
      .map(({ mois, rappels }) => ({ mois, rappels }));
  };

  // Graphique: Évolution par niveau de risque
  const getRiskEvolution = () => {
    const monthlyRiskData: Record<
      string,
      { critical: number; high: number; medium: number; low: number; date: Date }
    > = {};

    recalls.forEach((recall) => {
      const date = new Date(recall.recallDate);
      const monthYear = `${date.toLocaleString("fr-FR", {
        month: "short",
      })} ${date.getFullYear()}`;

      if (!monthlyRiskData[monthYear]) {
        monthlyRiskData[monthYear] = { critical: 0, high: 0, medium: 0, low: 0, date };
      }

      monthlyRiskData[monthYear][recall.riskLevel]++;
    });

    return Object.entries(monthlyRiskData)
      .map(([month, data]) => ({
        mois: month,
        "Danger critique": data.critical,
        "Risque élevé": data.high,
        Attention: data.medium,
        Information: data.low,
        sortDate: data.date.getTime(),
      }))
      .sort((a, b) => a.sortDate - b.sortDate)
      .slice(-12) // 12 derniers mois (optimisé)
      .map(({ mois, ...rest }) => {
        const { sortDate, ...risks } = rest;
        return { mois, ...risks };
      });
  };

  // Graphique: Top catégories détaillé
  const getTopCategories = (limit: number = 10) => {
    const categoryStats: Record<string, number> = {};

    recalls.forEach((recall) => {
      categoryStats[recall.category] = (categoryStats[recall.category] || 0) + 1;
    });

    return Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category, count]) => ({
        catégorie: category.length > 25 ? category.substring(0, 25) + "..." : category,
        rappels: count,
        pourcentage: ((count / recalls.length) * 100).toFixed(1),
      }));
  };

  // Graphique: Top marques
  const getTopBrands = () => {
    const brandStats: Record<string, number> = {};

    recalls.forEach((recall) => {
      brandStats[recall.brand] = (brandStats[recall.brand] || 0) + 1;
    });

    return Object.entries(brandStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand, count]) => ({
        marque: brand.length > 20 ? brand.substring(0, 20) + "..." : brand,
        rappels: count,
      }));
  };

  // Graphique: Aliments vs Non-Aliments
  const getFoodVsNonFood = () => {
    const foodCategories = [
      "alimentation",
      "boulangerie",
      "charcuterie",
      "produits laitiers",
      "viandes",
      "poissons",
      "fruits et légumes",
      "boissons",
      "épicerie",
    ];

    let foodCount = 0;
    let nonFoodCount = 0;

    recalls.forEach((recall) => {
      const isFood = foodCategories.some((cat) =>
        recall.category.toLowerCase().includes(cat.toLowerCase())
      );

      if (isFood) {
        foodCount++;
      } else {
        nonFoodCount++;
      }
    });

    return [
      {
        name: "Alimentaire",
        value: foodCount,
        color: COLORS.food,
        pourcentage: ((foodCount / recalls.length) * 100).toFixed(1),
      },
      {
        name: "Non-alimentaire",
        value: nonFoodCount,
        color: COLORS.nonFood,
        pourcentage: ((nonFoodCount / recalls.length) * 100).toFixed(1),
      },
    ];
  };

  // Graphique: Répartition par niveau de risque
  const getRiskDistribution = () => {
    const riskStats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    recalls.forEach((recall) => {
      riskStats[recall.riskLevel]++;
    });

    return [
      {
        name: "Danger critique",
        value: riskStats.critical,
        color: COLORS.critical,
        pourcentage: ((riskStats.critical / recalls.length) * 100).toFixed(1),
      },
      {
        name: "Risque élevé",
        value: riskStats.high,
        color: COLORS.high,
        pourcentage: ((riskStats.high / recalls.length) * 100).toFixed(1),
      },
      {
        name: "Attention",
        value: riskStats.medium,
        color: COLORS.medium,
        pourcentage: ((riskStats.medium / recalls.length) * 100).toFixed(1),
      },
      {
        name: "Information",
        value: riskStats.low,
        color: COLORS.low,
        pourcentage: ((riskStats.low / recalls.length) * 100).toFixed(1),
      },
    ];
  };

  // Graphique: Comparaison année par année
  const getYearlyComparison = () => {
    const yearlyData: Record<string, number> = {};

    recalls.forEach((recall) => {
      const year = new Date(recall.recallDate).getFullYear();
      yearlyData[year] = (yearlyData[year] || 0) + 1;
    });

    return Object.entries(yearlyData)
      .map(([year, count]) => ({
        année: year,
        rappels: count,
      }))
      .sort((a, b) => parseInt(a.année) - parseInt(b.année));
  };

  // Graphique: Évolution du taux de risque critique
  const getCriticalRateEvolution = () => {
    const monthlyData: Record<
      string,
      { total: number; critical: number; date: Date }
    > = {};

    recalls.forEach((recall) => {
      const date = new Date(recall.recallDate);
      const monthYear = `${date.toLocaleString("fr-FR", {
        month: "short",
      })} ${date.getFullYear()}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { total: 0, critical: 0, date };
      }

      monthlyData[monthYear].total++;
      if (recall.riskLevel === "critical") {
        monthlyData[monthYear].critical++;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        mois: month,
        taux: data.total > 0 ? ((data.critical / data.total) * 100).toFixed(1) : 0,
        sortDate: data.date.getTime(),
      }))
      .sort((a, b) => a.sortDate - b.sortDate)
      .slice(-12)
      .map(({ mois, taux }) => ({ mois, taux: parseFloat(taux as string) }));
  };

  // Graphique: Catégories par niveau de risque
  const getCategoryRiskBreakdown = () => {
    const topCategories = getTopCategories(6);

    return topCategories.map((cat) => {
      const categoryRecalls = recalls.filter((r) =>
        r.category.includes(cat.catégorie.replace("...", ""))
      );

      const critical = categoryRecalls.filter((r) => r.riskLevel === "critical").length;
      const high = categoryRecalls.filter((r) => r.riskLevel === "high").length;
      const medium = categoryRecalls.filter((r) => r.riskLevel === "medium").length;
      const low = categoryRecalls.filter((r) => r.riskLevel === "low").length;

      return {
        catégorie: cat.catégorie,
        Critique: critical,
        Élevé: high,
        Moyen: medium,
        Faible: low,
      };
    });
  };

  // Analyse radar par catégorie et risque
  const getRadarData = () => {
    const topCategories = getTopCategories(6);

    return topCategories.map((cat) => {
      const categoryRecalls = recalls.filter((r) =>
        r.category.includes(cat.catégorie.replace("...", ""))
      );

      const critical = categoryRecalls.filter((r) => r.riskLevel === "critical").length;
      const high = categoryRecalls.filter((r) => r.riskLevel === "high").length;
      const medium = categoryRecalls.filter((r) => r.riskLevel === "medium").length;

      return {
        catégorie: cat.catégorie,
        critique: critical,
        élevé: high,
        moyen: medium,
      };
    });
  };

  // ======== MÉMORISATION DES CALCULS ========
  // (après les définitions de fonctions, avant tout return!)

  const kpis = useMemo(() => getKPIs(), [recalls]);
  const monthlyData = useMemo(() => getMonthlyRecalls(), [recalls]);
  const riskEvolution = useMemo(() => getRiskEvolution(), [recalls]);
  const topCategories = useMemo(() => getTopCategories(), [recalls]);
  const topBrands = useMemo(() => getTopBrands(), [recalls]);
  const foodVsNonFood = useMemo(() => getFoodVsNonFood(), [recalls]);
  const riskDistribution = useMemo(() => getRiskDistribution(), [recalls]);
  const yearlyComparison = useMemo(() => getYearlyComparison(), [recalls]);
  const criticalRateEvolution = useMemo(() => getCriticalRateEvolution(), [recalls]);
  const categoryRiskBreakdown = useMemo(() => getCategoryRiskBreakdown(), [recalls]);
  const radarData = useMemo(() => getRadarData(), [recalls]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Chargement des données
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Préparation des statistiques en cours...
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Première visite ?</span> Le chargement initial peut prendre quelques secondes.
                Les prochaines visites seront instantanées grâce au cache.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Tableau de bord statistique
          </h1>
          <p className="text-lg text-gray-600">
            Analyse détaillée de {allRecalls.length} rappels de produits
            {recalls.length < allRecalls.length && (
              <span className="text-blue-600 font-medium ml-2">
                ({recalls.length} affichés après filtrage)
              </span>
            )}
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrer les données</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Filtre par année */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="all">Toutes les années</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="all">Toutes les catégories</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par niveau de risque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de risque
              </label>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="all">Tous les niveaux</option>
                {riskLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bouton de réinitialisation */}
          {(selectedYear !== "all" || selectedCategory !== "all" || selectedRisk !== "all") && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSelectedYear("all");
                  setSelectedCategory("all");
                  setSelectedRisk("all");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* KPIs Cards */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total rappels */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Total rappels</h3>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-900 mt-3">{kpis.total}</p>
              <p className="text-sm text-blue-700 mt-2">Produits rappelés</p>
            </div>

            {/* 30 derniers jours */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-900">30 derniers jours</h3>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-purple-900 mt-3">{kpis.last30Days}</p>
              <div className="flex items-center mt-2">
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded-md ${
                    kpis.trendPercentage >= 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {kpis.trendPercentage >= 0 ? "+" : ""}
                  {kpis.trendPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-purple-700 ml-2">vs mois précédent</span>
              </div>
            </div>

            {/* Taux critique */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-900">Taux critique</h3>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-red-900 mt-3">
                {kpis.criticalPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-red-700 mt-2">Rappels critiques</p>
            </div>

            {/* Moyenne mensuelle */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-900">Moyenne mensuelle</h3>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-green-900 mt-3">
                {kpis.avgPerMonth.toFixed(0)}
              </p>
              <p className="text-sm text-green-700 mt-2">Rappels/mois</p>
            </div>
          </div>
        )}

        {/* Section 1: Évolution temporelle */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Évolution temporelle</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Évolution mensuelle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rappels par mois (12 derniers mois)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRappels" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1f2937" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1f2937" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rappels"
                    stroke="#1f2937"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRappels)"
                    name="Rappels"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Comparaison annuelle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comparaison par année
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="année" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="rappels" fill="#6366f1" name="Nombre de rappels" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Section 2: Analyse par risque */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyse par niveau de risque</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Répartition des risques */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Répartition par niveau de risque
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, pourcentage }) => `${name}: ${pourcentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Évolution des risques */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Évolution par niveau de risque
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={riskEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Danger critique"
                    stroke={COLORS.critical}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Risque élevé"
                    stroke={COLORS.high}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Attention"
                    stroke={COLORS.medium}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Information"
                    stroke={COLORS.low}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Section 3: Analyse par catégorie */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyse par catégorie</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top catégories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top 10 catégories les plus touchées
              </h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={topCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis dataKey="catégorie" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="rappels" name="Nombre de rappels" radius={[0, 4, 4, 0]}>
                    {topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Aliments vs Non-aliments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Alimentaire vs Non-alimentaire
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={foodVsNonFood}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, pourcentage }) => `${name}: ${pourcentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {foodVsNonFood.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Radar chart */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Analyse risque par catégorie (Top 6)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="catégorie" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis />
                    <Radar
                      name="Critique"
                      dataKey="critique"
                      stroke={COLORS.critical}
                      fill={COLORS.critical}
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Élevé"
                      dataKey="élevé"
                      stroke={COLORS.high}
                      fill={COLORS.high}
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Moyen"
                      dataKey="moyen"
                      stroke={COLORS.medium}
                      fill={COLORS.medium}
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Analyses complémentaires */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyses complémentaires</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Top marques */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top 10 marques les plus touchées
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topBrands} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis dataKey="marque" type="category" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="rappels" fill="#f59e0b" name="Nombre de rappels" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Évolution taux critique */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Évolution du taux de risque critique
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={criticalRateEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis label={{ value: 'Taux (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Line
                    type="monotone"
                    dataKey="taux"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ fill: '#dc2626', r: 4 }}
                    name="Taux critique"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Répartition des risques par catégorie */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Répartition des niveaux de risque par catégorie (Top 6)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryRiskBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="catégorie" tick={{ fontSize: 10, angle: -15 }} height={100} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="Critique" stackId="a" fill={COLORS.critical} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Élevé" stackId="a" fill={COLORS.high} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Moyen" stackId="a" fill={COLORS.medium} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Faible" stackId="a" fill={COLORS.low} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights clés */}
        {kpis && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Points clés à retenir</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Catégorie la plus touchée</h3>
                <p className="text-gray-700">
                  <span className="text-2xl font-bold text-blue-600">{kpis.topCategory}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  avec {kpis.topCategoryCount} rappels
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Tendance récente</h3>
                <p className="text-gray-700">
                  <span
                    className={`text-2xl font-bold ${
                      kpis.trendPercentage >= 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {kpis.trendPercentage >= 0 ? "Hausse" : "Baisse"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  de {Math.abs(kpis.trendPercentage).toFixed(1)}% sur 30 jours
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Type dominant</h3>
                <p className="text-gray-700">
                  <span className="text-2xl font-bold text-green-600">
                    {foodVsNonFood[0].name}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  représente {foodVsNonFood[0].pourcentage}% des rappels
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Niveau de gravité</h3>
                <p className="text-gray-700">
                  <span className="text-2xl font-bold text-red-600">
                    {kpis.criticalPercentage.toFixed(1)}%
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  de rappels critiques
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Retour */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
