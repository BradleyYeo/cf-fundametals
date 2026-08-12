output "kv_namespace_id" {
  description = "VINEXT_KV_CACHE namespace ID"
  value       = cloudflare_workers_kv_namespace.vinext_kv_cache.id
}

output "d1_database_id" {
  description = "Portfolio views D1 database ID"
  value       = cloudflare_d1_database.portfolio_views.id
}