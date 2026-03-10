## CATEGORY 43: Infrastructure as Code Security

### Detection
- Terraform files: `*.tf`, `*.tfvars`
- Kubernetes manifests: YAML files with `apiVersion`, `kind`, `metadata`
- CloudFormation templates: `template.json`, `template.yaml` with `AWSTemplateFormatVersion`
- Pulumi, Ansible, or other IaC tool configurations

### What to Search For

**Terraform:**
- Public S3 buckets (`acl = "public-read"`, `acl = "public-read-write"`)
- Overly permissive security groups (ingress `0.0.0.0/0` on non-80/443 ports)
- Missing encryption at rest (`encrypted = false` or encryption not specified)
- Hardcoded credentials in `.tf` or `.tfvars` files
- Missing logging/monitoring on resources (no CloudTrail, no VPC flow logs)
- Wildcard IAM policies (`"Action": "*"`, `"Resource": "*"`)
- Unencrypted RDS instances, ElastiCache clusters, EBS volumes
- Default VPC usage instead of custom VPCs
- Missing state file encryption or remote state without locking

**Kubernetes:**
- Containers running as root (`runAsNonRoot: false` or `runAsUser: 0`)
- Missing resource limits (no `resources.limits` for CPU/memory)
- Privileged containers (`privileged: true` in `securityContext`)
- HostPath mounts to sensitive directories (`/etc`, `/var/run/docker.sock`)
- Missing network policies (no `NetworkPolicy` resources)
- Default service account usage (no custom service account specified)
- Secrets in plain YAML (not sealed-secrets or external-secrets)
- `hostNetwork: true` or `hostPID: true`

**CloudFormation:**
- Public S3 bucket policies
- Security groups with `0.0.0.0/0` ingress on sensitive ports
- Unencrypted resources (missing `KmsKeyId`, `StorageEncrypted`)
- Missing `DeletionPolicy` on stateful resources (RDS, DynamoDB, S3)

### Actually Vulnerable
- `acl = "public-read"` on an S3 bucket containing application data
- Security group allowing `0.0.0.0/0` ingress on port 22, 3306, 5432, or 6379
- `aws_iam_policy` with `"Action": "*"` and `"Resource": "*"` — full admin access
- `encrypted = false` on RDS, EBS, or ElastiCache resources
- Hardcoded AWS keys or database passwords in `.tf` files
- Kubernetes pod running as `root` with `privileged: true` and no resource limits
- HostPath mount to `/var/run/docker.sock` — container can control Docker daemon
- Secrets defined as plain `kind: Secret` with base64-encoded values in committed YAML

### NOT Vulnerable
- S3 bucket with `acl = "private"` and bucket policy restricting access
- Security group with ingress on 80/443 from `0.0.0.0/0` (public web server)
- IAM policies scoped to specific services and resources
- Encrypted resources with KMS key references
- Terraform variables referencing `var.db_password` with values from Vault or SSM
- Kubernetes pods with `runAsNonRoot: true`, resource limits, and read-only root filesystem
- Sealed Secrets or External Secrets Operator for secret management
- `.tfvars` files listed in `.gitignore`

### Context Check
1. Are credentials stored in variables with values sourced from a secret manager?
2. Is the S3 bucket intentionally public (static website hosting) or a misconfiguration?
3. Does the security group apply to a public-facing load balancer or an internal service?
4. Are Kubernetes pods running with the minimum required privileges?
5. Is state file encryption and locking configured for Terraform?
6. Are secrets managed through sealed-secrets, external-secrets, or a vault integration?

### Files to Check
- `*.tf`, `*.tfvars`, `terraform.tfstate` (should not be committed)
- `*.yaml`, `*.yml` (Kubernetes manifests)
- `template.json`, `template.yaml` (CloudFormation)
- `kustomization.yaml`, `helmfile.yaml`, `values.yaml`
- `.github/workflows/*.yml` (IaC deployment steps)
