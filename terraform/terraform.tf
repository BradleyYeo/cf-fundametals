terraform {
  required_version = ">= 1.3.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.23.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }

  backend "s3" {
    bucket    = "portfolio-terraform-state"
    key       = "terraform/terraform.tfstate"
    endpoints = { s3 = "https://346e5692ae2024c494ef5f58c36fae37.r2.cloudflarestorage.com" }
    region    = "auto"

    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

resource "cloudflare_r2_bucket" "portfolio_tfs" {
  account_id    = var.account_id
  name          = "portfolio-terraform-state"
  location      = "apac"
  storage_class = "Standard"
}
