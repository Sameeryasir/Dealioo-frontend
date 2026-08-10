import {
  getBusinessSetup,
  hasMeaningfulAddress,
  hasNonEmptyText,
} from "@/app/lib/business-setup";
import type { AdminBusiness } from "@/app/services/business/get-my-business";

function baseBusiness(overrides: Partial<AdminBusiness> = {}): AdminBusiness {
  return {
    id: 12,
    name: "Acme Coffee",
    description: "  ",
    logoUrl: null,
    email: "  hello@acme.test  ",
    phoneNumber: "+15551212",
    city: "Austin",
    state: "TX",
    country: "US",
    postalCode: "78701",
    branchCount: 1,
    stripeConnected: false,
    stripeAccountId: "acct_should_not_count",
    metaConnected: false,
    metaUserId: "123456",
    metaConnectionStatus: "AUTHENTICATED",
    twilioConnected: false,
    twilioPhoneNumber: "+15550000",
    ...overrides,
  };
}

describe("business setup validation", () => {
  it("rejects empty and whitespace-only strings", () => {
    expect(hasNonEmptyText("")).toBe(false);
    expect(hasNonEmptyText("   ")).toBe(false);
    expect(hasNonEmptyText(null)).toBe(false);
    expect(hasNonEmptyText("Acme")).toBe(true);
  });

  it("requires a meaningful address, not city alone", () => {
    expect(hasMeaningfulAddress({ city: "Austin" })).toBe(false);
    expect(hasMeaningfulAddress({ city: "A", country: "US" })).toBe(false);
    expect(hasMeaningfulAddress({ city: "Austin", country: "US" })).toBe(true);
    expect(hasMeaningfulAddress({ city: "Austin", postalCode: "78701" })).toBe(
      true,
    );
  });
});

describe("getBusinessSetup", () => {
  it("keeps 8 equal steps and percent math", () => {
    const setup = getBusinessSetup(baseBusiness());
    expect(setup.totalCount).toBe(8);
    expect(setup.completedCount).toBe(4);
    expect(setup.remainingCount).toBe(4);
    expect(setup.progressPercent).toBe(50);
    expect(setup.isComplete).toBe(false);
  });

  it("treats business information as name-only", () => {
    const setup = getBusinessSetup(
      baseBusiness({ name: "Acme", description: "" }),
    );
    expect(
      setup.steps.find((step) => step.id === "business-information")?.done,
    ).toBe(true);
  });

  it("does not treat account ids as connected integrations", () => {
    const setup = getBusinessSetup(baseBusiness());
    expect(setup.steps.find((step) => step.id === "stripe")?.done).toBe(false);
    expect(setup.steps.find((step) => step.id === "meta-ads")?.done).toBe(false);
    expect(setup.steps.find((step) => step.id === "twilio-number")?.done).toBe(
      false,
    );
  });

  it("uses explicit connection flags when true", () => {
    const setup = getBusinessSetup(
      baseBusiness({
        stripeConnected: true,
        metaConnected: true,
        twilioConnected: true,
      }),
    );
    expect(setup.steps.find((step) => step.id === "stripe")?.done).toBe(true);
    expect(setup.steps.find((step) => step.id === "meta-ads")?.done).toBe(true);
    expect(setup.steps.find((step) => step.id === "twilio-number")?.done).toBe(
      true,
    );
    expect(setup.isComplete).toBe(false);
  });

  it("recommends Stripe before a missing logo", () => {
    const setup = getBusinessSetup(
      baseBusiness({
        logoUrl: null,
        stripeConnected: false,
        twilioConnected: true,
      }),
    );
    expect(setup.nextRecommendedStep?.id).toBe("stripe");
    expect(setup.nextRecommendedStep?.ctaLabel).toBe("Connect Stripe");
    expect(setup.nextRecommendedStep?.href).toContain(
      "/settings/integrations?focus=stripe",
    );
  });

  it("groups the 8 steps into Business Profile, Operations, Payments, Marketing", () => {
    const setup = getBusinessSetup(baseBusiness());
    expect(setup.groups.map((group) => group.label)).toEqual([
      "Business Profile",
      "Operations",
      "Payments",
      "Marketing",
    ]);
    expect(setup.groups.flatMap((group) => group.steps).map((step) => step.id)).toEqual(
      setup.steps.map((step) => step.id),
    );
  });

  it("deep-links Meta to integrations focus", () => {
    const setup = getBusinessSetup(
      baseBusiness({
        stripeConnected: true,
        twilioConnected: true,
        metaConnected: false,
        logoUrl: "https://cdn.example/logo.png",
      }),
    );
    expect(setup.nextRecommendedStep?.id).toBe("meta-ads");
    expect(setup.nextRecommendedStep?.href).toContain(
      "/settings/integrations?focus=meta",
    );
  });
});
