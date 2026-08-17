resource "cloudflare_worker" "portfolio" {
  account_id = var.account_id
  name       = "portfolio"
}

# KV namespace for vinext server-side data cache (free tier — included in Workers free plan)
resource "cloudflare_workers_kv_namespace" "vinext_kv_cache" {
  account_id = var.account_id
  title      = "VINEXT_KV_CACHE"
}

# D1 database for persistent page view counters (free tier — 5GB, 5M rows/day)
resource "cloudflare_d1_database" "portfolio_views" {
  account_id = var.account_id
  name       = "portfolio-views"

  read_replication = {
    mode = "disabled"
  }
}

# Cloudflare Turnstile widget for email protection (Free tier — unlimited challenges)
resource "cloudflare_turnstile_widget" "portfolio_email_turnstile" {
  account_id = var.account_id
  name       = "portfolio-email-protection"
  domains    = ["bradleyyeo.com", "localhost"]
  mode       = "managed"
}
