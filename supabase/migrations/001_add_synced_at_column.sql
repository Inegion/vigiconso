-- Ajouter une colonne pour tracker la dernière synchronisation
ALTER TABLE rappel ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW();

-- Créer un index sur numero_fiche pour l'upsert
CREATE UNIQUE INDEX IF NOT EXISTS rappel_numero_fiche_idx ON rappel(numero_fiche);

-- Créer un index sur date_publication pour les requêtes triées
CREATE INDEX IF NOT EXISTS rappel_date_publication_idx ON rappel(date_publication DESC);

-- Créer un index sur categorie_produit pour les filtres
CREATE INDEX IF NOT EXISTS rappel_categorie_produit_idx ON rappel(categorie_produit);
