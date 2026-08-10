terraform {
  required_version = ">= 1.3.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.23.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "account_id" {
  type        = string
  description = "Cloudflare Account ID"
}
variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API Token with Workers, KV, and AI permissions."
  sensitive   = true
}