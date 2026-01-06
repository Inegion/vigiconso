# 🚀 VigiConso - Architecture Supabase

## 📊 Vue d'ensemble de l'architecture

### Avant (Lent ❌)
```
Site Web → API Gouvernement (lente) → Affichage
```
- Chaque utilisateur attend l'API gouvernementale
- Temps de chargement : 3-10 secondes
- Beaucoup de requêtes vers l'API publique

### Maintenant (Ultra Rapide ✅)
```
Cron Job (toutes les 3h) → API Gouvernement → Supabase
Site Web → Supabase (ultra rapide) → Affichage
```
- Les données sont pré-chargées dans Supabase
- Temps de chargement : < 500ms
- Cache localStorage pour performances maximales

## 🔧 Installation rapide

### 1. Activer Row Level Security sur Supabase

Va dans **Supabase Dashboard → Authentication → Policies**

Exécute ce SQL pour permettre la lecture publique :

```sql
-- Activer RLS
ALTER TABLE rappel ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Allow public read access" ON rappel
FOR SELECT USING (true);

-- Ajouter les colonnes et index nécessaires
ALTER TABLE rappel ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS rappel_numero_fiche_idx ON rappel(numero_fiche);
CREATE INDEX IF NOT EXISTS rappel_date_publication_idx ON rappel(date_publication DESC);
CREATE INDEX IF NOT EXISTS rappel_categorie_produit_idx ON rappel(categorie_produit);
```

### 2. Déployer la Edge Function

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier au projet
supabase link --project-ref xvwieacdkqokusvzfbpq

# Déployer la fonction
supabase functions deploy sync-recalls
```

### 3. Tester manuellement la synchronisation

```bash
curl -X POST \
  https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d2llYWNka3Fva3VzdnpmYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjA0MjMsImV4cCI6MjA4MTYzNjQyM30.CNF_q3VEtSOlCQvmnII3yXdOjSQglNHZTTpNzEWYbaM"
```

Tu devrais voir : `{"success":true,"recordsProcessed":100,"message":"Synchronisation réussie"}`

### 4. Configurer le Cron Job (automatisation)

#### Option A : GitHub Actions (Gratuit, recommandé)

Créer `.github/workflows/sync-recalls.yml` :

```yaml
name: Sync Recalls Every 3 Hours

on:
  schedule:
    - cron: '0 */3 * * *'  # Toutes les 3 heures
  workflow_dispatch:  # Permet déclenchement manuel

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync recalls from API
        run: |
          curl -X POST \
            https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

Puis dans GitHub :
- Aller dans **Settings → Secrets and variables → Actions**
- Ajouter `SUPABASE_ANON_KEY` avec ta clé anon

#### Option B : Cron-job.org (Simple, gratuit)

1. Aller sur https://cron-job.org/en/ et créer un compte
2. Créer un nouveau cron job :
   - **Title** : Sync VigiConso
   - **URL** : `https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls`
   - **HTTP Method** : POST
   - **Schedule** : `0 */3 * * *` (toutes les 3h)
   - **Headers** :
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d2llYWNka3Fva3VzdnpmYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjA0MjMsImV4cCI6MjA4MTYzNjQyM30.CNF_q3VEtSOlCQvmnII3yXdOjSQglNHZTTpNzEWYbaM
     ```

#### Option C : Supabase Cron (si disponible sur ton plan)

Dans l'éditeur SQL Supabase :

```sql
SELECT cron.schedule(
  'sync-recalls',
  '0 */3 * * *',  -- Toutes les 3 heures
  $$
  SELECT net.http_post(
    url := 'https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb
  );
  $$
);
```

## ✅ Vérification

### Tester le site

```bash
npm run dev
```

Ouvre la console du navigateur, tu devrais voir :
```
✓ Données historiques chargées depuis Supabase en 0.42s (16234 rappels)
```

### Vérifier la synchronisation

Dans Supabase Dashboard :
- **Edge Functions → sync-recalls → Logs**
- Tu verras les logs de chaque sync

### Vérifier les données

```sql
-- Combien de rappels dans la table ?
SELECT COUNT(*) FROM rappel;

-- Dernière synchronisation ?
SELECT MAX(synced_at) FROM rappel;

-- Rappels les plus récents
SELECT numero_fiche, marque_produit, date_publication, synced_at
FROM rappel
ORDER BY date_publication DESC
LIMIT 10;
```

## 🎯 Résultat final

### Performance

- ⚡ **Chargement initial** : < 1 seconde (depuis Supabase)
- 💾 **Cache localStorage** : 7 jours (rechargement instantané)
- 🔄 **Mise à jour auto** : Toutes les 3 heures
- 📊 **16k+ rappels** disponibles

### Flux de données

1. **Toutes les 3h** : Cron job appelle la Edge Function
2. **Edge Function** : Récupère 100 derniers rappels de l'API gouvernementale
3. **Upsert Supabase** : Ajoute/met à jour dans la table `rappel`
4. **Site web** : Charge depuis Supabase (ultra rapide)
5. **Cache local** : Stocke pendant 7 jours pour vitesse maximale

## 🔧 Maintenance

### Voir les logs de sync

```bash
# Logs de la Edge Function
supabase functions logs sync-recalls
```

### Forcer une synchronisation

```bash
# Via curl
curl -X POST https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls \
  -H "Authorization: Bearer VOTRE_ANON_KEY"

# Ou via GitHub Actions (si configuré)
# Aller dans Actions → Sync Recalls → Run workflow
```

### Augmenter la limite de sync

Éditer `supabase/functions/sync-recalls/index.ts` :

```typescript
// Ligne 25 environ
limit: "200",  // Au lieu de "100"
```

Puis redéployer :
```bash
supabase functions deploy sync-recalls
```

## 🐛 Troubleshooting

### "CORS error"
→ La Edge Function gère déjà CORS, mais vérifie que tu utilises la bonne URL

### "Aucune donnée"
→ Lance une sync manuelle avec curl pour remplir la base

### "RLS policy error"
→ Vérifie que la politique de lecture publique est activée

### "Rate limit"
→ L'API gouvernementale limite les appels, c'est normal. La sync toutes les 3h évite ce problème.

## 📚 Fichiers modifiés

- ✅ `src/services/supabase.ts` - Client Supabase
- ✅ `src/services/api.ts` - Redirige vers Supabase
- ✅ `src/services/historicalData.ts` - Charge depuis Supabase
- ✅ `supabase/functions/sync-recalls/index.ts` - Edge Function
- ✅ `supabase/migrations/001_add_synced_at_column.sql` - Migration DB
