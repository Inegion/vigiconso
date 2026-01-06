interface RecallCardProps {
  title: string;
  brand: string;
  category: string;
  subCategory?: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  reason: string;
  risks?: string;
  batchNumber?: string;
  recallDate: string;
  image?: string;
  packaging?: string;
  temperatureConservation?: string;
  geographicZone?: string;
  distributors?: string;
  compensationMethod?: string;
  contactNumber?: string;
  posterPdfLink?: string;
  recallPageLink?: string;
  onClick?: () => void;
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

export function RecallCard({
  title,
  brand,
  category,
  subCategory,
  riskLevel,
  reason,
  risks,
  batchNumber,
  recallDate,
  image,
  packaging,
  temperatureConservation,
  geographicZone,
  distributors,
  compensationMethod,
  contactNumber,
  posterPdfLink,
  recallPageLink,
  onClick,
}: RecallCardProps) {
  const config = riskConfig[riskLevel];

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {image && (
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 ${config.bg} ${config.color} ${config.border} border`}>
          {config.label}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2">
          {title}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
            {brand}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
            {category}
          </span>
          {subCategory && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
              {subCategory}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {reason}
        </p>

        {risks && (
          <p className="text-[11px] text-gray-500 mb-2 line-clamp-1">
            <span className="font-medium">Risques:</span> {risks}
          </p>
        )}

        <div className="space-y-1 mb-2">
          {packaging && (
            <div className="text-[11px] text-gray-600">
              <span className="font-medium">Conditionnement:</span> {packaging}
            </div>
          )}
          {temperatureConservation && (
            <div className="text-[11px] text-gray-600">
              <span className="font-medium">Conservation:</span> {temperatureConservation}
            </div>
          )}
          {geographicZone && (
            <div className="text-[11px] text-gray-600">
              <span className="font-medium">Zone:</span> {geographicZone}
            </div>
          )}
          {distributors && (
            <div className="text-[11px] text-gray-600 line-clamp-1">
              <span className="font-medium">Distributeurs:</span> {distributors.split("¤").filter(d => d.trim()).join(", ")}
            </div>
          )}
          {compensationMethod && (
            <div className="text-[11px] text-gray-600">
              <span className="font-medium">Compensation:</span> {compensationMethod}
            </div>
          )}
          {contactNumber && (
            <div className="text-[11px] text-gray-600">
              <span className="font-medium">Contact:</span>{" "}
              <a href={`tel:${contactNumber}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                {contactNumber}
              </a>
            </div>
          )}
        </div>

        {(posterPdfLink || recallPageLink) && (
          <div className="flex gap-2 mb-2">
            {posterPdfLink && (
              <a
                href={posterPdfLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-[10px] px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-center font-medium"
              >
                📄 PDF
              </a>
            )}
            {recallPageLink && (
              <a
                href={recallPageLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-[10px] px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center font-medium"
              >
                🔗 Fiche
              </a>
            )}
          </div>
        )}

        <div className="flex justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
          {batchNumber && (
            <div>
              <span className="font-medium">Lot:</span> {batchNumber}
            </div>
          )}
          <div>
            {new Date(recallDate).toLocaleDateString("fr-FR")}
          </div>
        </div>
      </div>
    </div>
  );
}
