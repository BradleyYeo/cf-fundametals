export const resumeData = {
  en: {
    name: "Bradley Yeo Kian",
    email: "yeo.bradley@gmail.com",
    tagline: "AI Infrastructure & DevSecOps Engineer",
    about:
      "Infrastructure engineer specialising in large-scale GPU clusters, air-gapped Kubernetes deployments, and cloud security automation. Passionate about building resilient, production-grade systems.",
    skills: {
      title: "Skills",
      languages: {
        title: "Languages",
        items: [
          "Python",
          "SQL",
          "Javascript",
          "Bash",
          "Go",
          "Powershell",
          "KQL",
          "Git",
          "Helm",
          "Ansible",
          "Java",
        ],
      },
      technology: {
        title: "Technology",
        items: [
          "AWS",
          "Azure",
          "Terraform",
          "Kubernetes",
          "Docker",
          "HPC",
          "MAAS",
          "Prometheus",
          "Grafana",
          "Cloudflare",
          "Gitlab",
          "Kafka",
          "iDRAC",
          "Cloud-Init",
        ],
      },
    },
    experience: {
      title: "Experience",
      jobs: [
        {
          company: "NCS",
          location: "Singapore",
          role: "AI Infra Engineer",
          period: "Oct 2025 — Present",
          bullets: [
            "Led a team of 5 engineers to deploy an air-gapped Kubernetes cluster across 576 NVIDIA H200 GPUs for ML model training, automating the full stack with Ansible — Ubuntu provisioning via Terraform MAAS, network configuration, and NVIDIA driver installation, to Prometheus monitoring agents.",
          ],
        },
        {
          company: "Accenture",
          location: "Singapore",
          role: "DevSecOps Engineer",
          period: "Jan 2024 — Oct 2025",
          bullets: [
            "Authored GitLab CI/CD pipelines for Terraform deployments and security vulnerability detection to meet compliance requirements",
            "Authored Terraform on Azure to migrate infrastructure from GCC1 to GCC2 and from azurerm 3.0 to 4.0",
            "Authored Terraform on AWS for EKS, ALB, API Gateway, IAM, RDS, SQS, EC2, S3 and Lambda to meet strict IM8 security requirements",
          ],
        },
      ],
    },
    certifications: {
      title: "Certifications",
      items: [
        "AWS Solutions Architect Associate",
        "AWS Security Specialty",
        "Terraform Associate (003)",
        "Azure Fundamentals (AZ-900)",
        "Google Cloud Skill Boost",
      ],
    },
    education: {
      title: "Education",
      school: "Singapore Management University",
      degree:
        "BSc in Information Systems (Smart-City Management)",
      period: "August 2020 — December 2023",
    },
  },
  zh: {
    name: "杨键",
    email: "yeo.bradley@gmail.com",
    tagline: "人工智能基础设施与开发安全运维工程师",
    about:
      "专注于大规模GPU集群、气隙隔离Kubernetes部署和云安全自动化的基础设施工程师。热衷于构建弹性、生产级系统。",
    skills: {
      title: "技能",
      languages: {
        title: "编程语言",
        items: [
          "Python",
          "SQL",
          "Javascript",
          "Bash",
          "Go",
          "Powershell",
          "KQL",
          "Git",
          "Helm",
          "Ansible",
          "Java",
        ],
      },
      technology: {
        title: "技术栈",
        items: [
          "AWS",
          "Azure",
          "Terraform",
          "Kubernetes",
          "Docker",
          "HPC",
          "MAAS",
          "Prometheus",
          "Grafana",
          "Cloudflare",
          "Gitlab",
          "Kafka",
          "iDRAC",
          "Cloud-Init",
        ],
      },
    },
    experience: {
      title: "工作经验",
      jobs: [
        {
          company: "NCS",
          location: "新加坡",
          role: "人工智能基础设施工程师",
          period: "2025年10月 — 至今",
          bullets: [
            "带领5人工程师团队，部署跨576块NVIDIA H200 GPU的气隙隔离Kubernetes集群用于机器学习模型训练。使用Ansible自动化全栈——包括通过Terraform MAAS进行Ubuntu配置、网络配置、NVIDIA驱动安装以及Prometheus监控代理部署。",
          ],
        },
        {
          company: "Accenture",
          location: "新加坡",
          role: "开发安全运维工程师",
          period: "2024年1月 — 2025年10月",
          bullets: [
            "编写GitLab CI/CD流水线，实现Terraform部署和安全漏洞检测，以满足合规要求",
            "编写Azure上的Terraform，将基础设施从GCC1迁移至GCC2，并从azurerm 3.0升级至4.0",
            "编写AWS上的Terraform，用于EKS、ALB、API Gateway、IAM、RDS、SQS、EC2、S3和Lambda，以满足严格的IM8安全要求",
          ],
        },
      ],
    },
    certifications: {
      title: "认证",
      items: [
        "AWS 解决方案架构师助理级",
        "AWS 安全专项",
        "Terraform 助理级 (003)",
        "Azure 基础 (AZ-900)",
        "Google Cloud 技能提升",
      ],
    },
    education: {
      title: "教育",
      school: "新加坡管理大学",
      degree: "信息系统理学学士（智慧城市管理）",
      period: "2020年8月 — 2023年12月",
    },
  },
} as const;

export type Language = "en" | "zh";
export type ResumeContent = (typeof resumeData)[Language];
