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
});
