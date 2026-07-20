import {
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
  type AutomationTemplate,
} from "@/app/components/automation/automation-templates";
import { applyAutomationTemplate } from "@/app/services/automation/apply-automation-template";
import { buildCreateAutomationBody } from "@/app/services/automation/automation-create-context";
import { createAutomation, getAutomations } from "@/app/services/automation/automation-api";

const DEFAULT_CAMPAIGN_AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
];

export async function provisionCampaignDefaultAutomations(
  businessId: number,
  campaignId: number,
): Promise<void> {
  const existing = await getAutomations(businessId);
  const purposesAlreadyOnCampaign = new Set(
    existing
      .filter((automation) => automation.campaignId === campaignId)
      .map((automation) => automation.purpose)
      .filter((purpose): purpose is string => Boolean(purpose)),
  );

  for (const template of DEFAULT_CAMPAIGN_AUTOMATION_TEMPLATES) {
    if (purposesAlreadyOnCampaign.has(template.purpose)) continue;

    const created = await createAutomation(
      buildCreateAutomationBody({
        name: template.name,
        description: template.description,
        trigger: template.trigger,
        purpose: template.purpose,
        ids: { businessId, campaignId },
      }),
    );
    await applyAutomationTemplate(created.id, template);
    purposesAlreadyOnCampaign.add(template.purpose);
  }
}
