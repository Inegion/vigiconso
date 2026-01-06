export function Hero() {
  return (
    <div className="bg-gradient-to-br from-red-50 via-white to-orange-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-red-100 mb-6">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Service officiel du gouvernement français
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Protégez votre famille
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 mt-2">
              Restez informé
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Accédez en temps réel aux alertes de sécurité sur les produits de consommation
          </p>
        </div>
      </div>
    </div>
  );
}
