import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * GET /api/markdown
 *
 * Returns the llms.txt content with Content-Type: text/markdown.
 * Used by the middleware to serve markdown when Accept: text/markdown is requested.
 */
export async function GET(request: NextRequest) {
  // Read llms.txt from the public directory at build time it's bundled as a static asset
  // For Workers, fetch it from the ASSETS binding or inline it
  const markdown = await getMarkdownContent(request);

  const tokenEstimate = Math.ceil(markdown.length / 4);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(tokenEstimate),
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function getMarkdownContent(request: NextRequest): Promise<string> {
  // In the Workers environment, fetch from the origin (public/llms.txt is a static asset)
  const url = new URL("/llms.txt", request.url);
  const response = await fetch(url.toString());
  if (response.ok) {
    return response.text();
  }

  // Fallback: inline content if fetch fails
  return getFallbackMarkdown();
}

function getFallbackMarkdown(): string {
  return `# Bradley Yeo Kian

> AI Infrastructure & DevSecOps Engineer

Infrastructure engineer specialising in large-scale GPU clusters, air-gapped Kubernetes deployments, and cloud security automation. Passionate about building resilient, production-grade systems.

- Email: yeo.bradley@gmail.com
- Website: https://bradleyyeo.com

## Skills

### Languages
Python, SQL, Javascript, Bash, Go, Powershell, KQL, Git, Helm, Ansible, Java

### Technology
AWS, Azure, Terraform, Kubernetes, Docker, HPC, MAAS, Prometheus, Grafana, Cloudflare, Gitlab, Kafka, iDRAC, Cloud-Init

## Experience

### AI Infra Engineer — NCS, Singapore (Oct 2025 — Present)
- Led a team of 5 engineers to deploy an air-gapped Kubernetes cluster across 576 NVIDIA H200 GPUs for ML model training, automating the full stack with Ansible.

### DevSecOps Engineer — Accenture, Singapore (Jan 2024 — Oct 2025)
- Authored GitLab CI/CD pipelines for Terraform deployments and security vulnerability detection
- Authored Terraform on Azure to migrate infrastructure from GCC1 to GCC2
- Authored Terraform on AWS for EKS, ALB, API Gateway, IAM, RDS, SQS, EC2, S3 and Lambda

## Certifications
- AWS Solutions Architect Associate
- AWS Security Specialty
- Terraform Associate (003)
- Azure Fundamentals (AZ-900)
- Google Cloud Skill Boost

## Education

### Singapore Management University
BSc in Information Systems (Smart-City Management) — August 2020 — December 2023
`;
}
