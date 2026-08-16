# KV namespace for vinext server-side data cache (free tier — included in Workers free plan)
resource "cloudflare_workers_kv_namespace" "vinext_kv_cache" {
  account_id = var.account_id
  title      = "VINEXT_KV_CACHE"
}

# D1 database for persistent page view counters (free tier — 5GB, 5M rows/day)
resource "cloudflare_d1_database" "portfolio_views" {
  account_id            = var.account_id
  name                  = "portfolio-views"
  # primary_location_hint = "apac"

  read_replication = {
    mode = "disabled"
  }
}

# # Patch wrangler.jsonc with the real KV namespace ID and D1 database ID
# resource "local_file" "wrangler_jsonc" {
#   content = jsonencode({
#     "$schema"           = "node_modules/wrangler/config-schema.json"
#     name                = "portfolio"
#     compatibility_date  = "2026-08-11"
#     compatibility_flags = ["nodejs_compat"]
#     main                = "vinext/server/fetch-handler"
#     assets = {
#       directory          = "dist/client"
#       not_found_handling = "none"
#       binding            = "ASSETS"
#     }
#     cache = { enabled = true }
#     kv_namespaces = [
#       {
#         binding = "VINEXT_KV_CACHE"
#         id      = cloudflare_workers_kv_namespace.vinext_kv_cache.id
#       }
#     ]
#     d1_databases = [
#       {
#         binding       = "VIEWS_DB"
#         database_name = cloudflare_d1_database.portfolio_views.name
#         database_id   = cloudflare_d1_database.portfolio_views.id
#       }
#     ]
#   })
#   filename = "${path.module}/../portfolio/wrangler.jsonc"
# }

# Cloudflare Turnstile widget for email protection (Free tier — unlimited challenges)
resource "cloudflare_turnstile_widget" "portfolio_email_turnstile" {
  account_id = var.account_id
  name       = "portfolio-email-protection"
  domains    = ["bradleyyeo.com", "localhost"]
  mode       = "managed"
}



# Permission	Scope
# Account → Workers Scripts → Edit	Account
# Zone → Workers Routes → Edit	Zone (All zones, or the specific zone you're deploying to)
# User → User Details → Read	User (optional, removes the email warning)