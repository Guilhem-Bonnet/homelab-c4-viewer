import { describe, expect, it } from "vitest";
import { iconForElement, serviceSlug, simpleIconPath } from "./app-icons";

describe("app icon registry", () => {
  it("normalizes service slugs and resolves simple-icons aliases", () => {
    expect(serviceSlug("media/radarr")).toBe("radarr");
    expect(serviceSlug("media/radarr-config (PVC)")).toBe("radarr-config");

    const radarr = iconForElement({ name: "media/radarr", tags: ["Container", "media"] });
    expect(radarr).toMatchObject({ slug: "radarr", title: "radarr", source: "simple-icons" });
    expect(simpleIconPath(radarr?.slug ?? "")).toBeTruthy();

    expect(iconForElement({ name: "media/prowlarr", tags: [] })?.slug).toBe("sonarr");
  });

  it("resolves AWS services to service-specific custom icons", () => {
    const route53 = iconForElement({
      name: "Route53 srvdreamer.fr",
      tags: ["Container", "network", "dns", "aws", "Amazon Web Services - Route 53"],
    });
    expect(route53).toMatchObject({ slug: "aws-route53", title: "Amazon Route 53", source: "custom" });
    expect(simpleIconPath(route53?.slug ?? "")).toBeTruthy();

    expect(iconForElement({ name: "S3 backups actifs", tags: ["storage", "aws"] })?.slug).toBe("aws-s3");
    expect(iconForElement({ name: "DynamoDB terraform-state-locks", tags: ["aws", "lock"] })?.slug).toBe("aws-dynamodb");
    expect(iconForElement({ name: "KMS homelab-sops", tags: ["security", "aws"] })?.slug).toBe("aws-kms");
    expect(iconForElement({ name: "IAM proxmox", tags: ["security", "aws"] })?.slug).toBe("aws-iam");
    expect(iconForElement({ name: "Budgets + Cost Anomaly", tags: ["monitoring", "cost", "aws"] })?.slug).toBe("aws-budgets");
  });
});
