# Configuration de la synchronisation automatique

## 📋 Vue d'ensemble

Au lieu de faire des appels API lents depuis le site, on synchronise les données toutes les 3h dans Supabase.

## 🚀 Étapes de configuration

### 1. Déployer la Edge Function sur Supabase

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login

# Déployer la fonction
supabase functions deploy sync-recalls --project-ref xvwieacdkqokusvzfbpq
```

### 2. Configurer le Cron Job

**Option A : GitHub Actions (Recommandé - Gratuit)**

Créer `.github/workflows/sync-recalls.yml` :

```yaml
name: Sync Recalls Every 3 Hours

on:
  schedule:
    # Toutes les 3 heures
    - cron: '0 */3 * * *'
  workflow_dispatch: # Permet de lancer manuellement

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

Ajouter `SUPABASE_ANON_KEY` dans les secrets GitHub.

**Option B : Cron-job.org (Gratuit, simple)**

1. Aller sur https://cron-job.org
2. Créer un compte
3. Créer un nouveau cron job :
   - URL : `https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls`
   - Méthode : POST
   - Header : `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (ta anon key)
   - Schedule : Every 3 hours

**Option C : pg_cron dans Supabase (si disponible)**

Exécuter dans l'éditeur SQL Supabase :

```sql
-- Activer pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job (toutes les 3 heures)
SELECT cron.schedule(
  'sync-recalls-every-3h',
  '0 */3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### 3. Ajouter la colonne synced_at

Dans l'éditeur SQL Supabase, exécuter :

```sql
ALTER TABLE rappel ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS rappel_numero_fiche_idx ON rappel(numero_fiche);
CREATE INDEX IF NOT EXISTS rappel_date_publication_idx ON rappel(date_publication DESC);
CREATE INDEX IF NOT EXISTS rappel_categorie_produit_idx ON rappel(categorie_produit);
```

### 4. Première synchronisation manuelle

```bash
# Tester la fonction
curl -X POST \
  https://xvwieacdkqokusvzfbpq.supabase.co/functions/v1/sync-recalls \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ✅ Résultat

- ⚡ Site ultra-rapide (charge uniquement depuis Supabase)
- 📊 Données toujours à jour (sync toutes les 3h)
- 🔄 Pas de latence API gouvernementale
- 💾 Cache localStorage pour performances optimales

## 🔍 Monitoring

Voir les logs de synchronisation :
- Supabase Dashboard → Edge Functions → sync-recalls → Logs
