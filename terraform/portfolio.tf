# KV namespace for vinext server-side data cache (free tier — included in Workers free plan)
resource "cloudflare_workers_kv_namespace" "vinext_kv_cache" {
  account_id = var.account_id
  title      = "VINEXT_KV_CACHE"
}

# Portfolio Worker (free tier — 100k req/day, no charge)
resource "cloudflare_worker_script" "portfolio" {
  account_id = var.account_id
  name       = "portfolio"
  content    = file("../portfolio/dist/server/index.js")

  kv_namespace_binding {
    name         = "VINEXT_KV_CACHE"
    namespace_id = cloudflare_workers_kv_namespace.vinext_kv_cache.id
  }
}

# Patch wrangler.jsonc with the real KV namespace ID so `vinext dev` works locally
resource "local_file" "wrangler_jsonc" {
  content = jsonencode({
    "$schema"           = "node_modules/wrangler/config-schema.json"
    name                = "portfolio"
    compatibility_date  = "2026-08-11"
    compatibility_flags = ["nodejs_compat"]
    main                = "vinext/server/fetch-handler"
    assets = {
      directory         = "dist/client"
      not_found_handling = "none"
      binding           = "ASSETS"
    }
    cache = { enabled = true }
    kv_namespaces = [
      {
        binding = "VINEXT_KV_CACHE"
        id      = cloudflare_workers_kv_namespace.vinext_kv_cache.id
      }
    ]
  })
  filename = "${path.module}/../portfolio/wrangler.jsonc"
}

# Outputs for reference
output "kv_namespace_id" {
  description = "VINEXT_KV_CACHE namespace ID"
  value       = cloudflare_workers_kv_namespace.vinext_kv_cache.id
}

output "worker_name" {
  description = "Deployed Worker name"
  value       = cloudflare_worker_script.portfolio.name
}
