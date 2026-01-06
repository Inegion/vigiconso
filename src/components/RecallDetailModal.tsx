import { useEffect } from "react";
import type { Recall } from "../services/api";

interface RecallDetailModalProps {
  recall: Recall | null;
  onClose: () => void;
}

const riskConfig = {
  critical: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Danger critique",
  },
  high: {
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "Risque élevé",
  },
  medium: {
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    label: "Attention",
  },
  low: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Information",
  },
};

export function RecallDetailModal({ recall, onClose }: RecallDetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (recall) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [recall]);

  if (!recall) return null;

  const config = riskConfig[recall.riskLevel];

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 last:border-0">
        <dt className="text-sm font-semibold text-gray-700">{label}</dt>
        <dd className="col-span-2 text-sm text-gray-900">{value}</dd>
      </div>
    );
  };

  const parseActions = (actions?: string) => {
    if (!actions) return [];
    return actions.split("|").map(action => action.trim()).filter(Boolean);
  };

  const actionsList = parseActions(recall.consumerActions);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10 bg-white shadow-sm"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {recall.image && (
            <div className="w-full h-80 bg-gray-100 overflow-hidden rounded-t-2xl">
              <img src={recall.image} alt={recall.title} className="w-full h-full object-contain" />
            </div>
          )}

          <div className="p-8">
            {/* Alerte raison du rappel */}
            <div className={`rounded-lg p-6 mb-8 ${config.bg} ${config.border} border-2`}>
              <div className="flex items-start gap-4">
                <div className={`${config.color} mt-1`}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-bold uppercase mb-1 ${config.color}`}>
                    Raison du rappel : {config.label}
                  </h3>
                  <p className={`text-lg font-semibold ${config.color}`}>{recall.reason}</p>
                  {recall.riskDescription && (
                    <p className={`text-sm mt-2 ${config.color}`}>{recall.riskDescription}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 1: Identification du produit */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                Identification du produit
              </h2>
              <dl className="divide-y divide-gray-100">
                <InfoRow label="Catégorie" value={recall.category} />
                <InfoRow label="Sous-catégorie" value={recall.subCategory} />
                <InfoRow label="Marque" value={recall.brand} />
                <InfoRow label="Modèle" value={recall.title} />
                <InfoRow label="N° de fiche" value={recall.numeroFiche} />
                {recall.batchNumber && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">Numéro de lot</dt>
                    <dd className="col-span-2">
                      <code className="text-sm bg-gray-100 px-3 py-1 rounded font-mono text-gray-900">
                        {recall.batchNumber}
                      </code>
                    </dd>
                  </div>
                )}
                <InfoRow label="Conditionnement" value={recall.packaging} />
                <InfoRow label="Conservation" value={recall.temperatureConservation} />
              </dl>
            </section>

            {/* SECTION 2: Commercialisation et distribution */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                Commercialisation et distribution
              </h2>
              <dl className="divide-y divide-gray-100">
                {recall.commercialisationStart && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">Dates</dt>
                    <dd className="col-span-2 text-sm text-gray-900">
                      Du {new Date(recall.commercialisationStart).toLocaleDateString("fr-FR")}
                      {recall.commercialisationEnd && ` au ${new Date(recall.commercialisationEnd).toLocaleDateString("fr-FR")}`}
                    </dd>
                  </div>
                )}
                <InfoRow label="Zone" value={recall.geographicZone} />
                {recall.distributors && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">Distributeurs</dt>
                    <dd className="col-span-2 text-sm text-gray-900 whitespace-pre-line">
                      {recall.distributors.split("¤").join("\n")}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* SECTION 3: Consignes et rappel */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                Consignes et rappel
              </h2>
              <dl className="divide-y divide-gray-100">
                <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                  <dt className="text-sm font-semibold text-gray-700">Action</dt>
                  <dd className="col-span-2 text-sm font-bold text-red-700">
                    Ne plus consommer | Ne plus utiliser le produit | Détruire le produit
                  </dd>
                </div>
                {recall.healthRecommendations && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">Conseil</dt>
                    <dd className="col-span-2 text-sm text-gray-900">{recall.healthRecommendations}</dd>
                  </div>
                )}
                {actionsList.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">Conduites à tenir</dt>
                    <dd className="col-span-2">
                      <ul className="text-sm text-gray-900 space-y-1">
                        {actionsList.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span className="capitalize">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                <InfoRow label="Indemnisation" value={recall.compensationMethod} />
                {recall.procedureEndDate && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">Fin de rappel</dt>
                    <dd className="col-span-2 text-sm text-gray-900">
                      {new Date(recall.procedureEndDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </dd>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                  <dt className="text-sm font-semibold text-gray-700">Publié le</dt>
                  <dd className="col-span-2 text-sm text-gray-900">
                    {new Date(recall.recallDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </dd>
                </div>
              </dl>
            </section>

            {/* SECTION 4: Informations officielles */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                Informations officielles
              </h2>
              <dl className="divide-y divide-gray-100">
                <InfoRow label="Version" value={recall.numeroVersion?.toString()} />
                <InfoRow label="GUID" value={recall.guid} />
                {recall.contactNumber && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">Contact</dt>
                    <dd className="col-span-2">
                      <a href={`tel:${recall.contactNumber}`} className="text-sm text-blue-600 hover:underline font-mono">
                        {recall.contactNumber}
                      </a>
                    </dd>
                  </div>
                )}
                {recall.recallPageLink && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">Fiche web</dt>
                    <dd className="col-span-2">
                      <a
                        href={recall.recallPageLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Consulter
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </dd>
                  </div>
                )}
                {recall.posterPdfLink && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">PDF</dt>
                    <dd className="col-span-2">
                      <a
                        href={recall.posterPdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Télécharger
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <button
              onClick={onClose}
              className="w-full bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
