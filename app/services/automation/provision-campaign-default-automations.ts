import {
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
  type AutomationTemplate,
} from "@/app/components/automation/automation-templates";
import { applyAutomationTemplate } from "@/app/services/automation/apply-automation-template";
import { buildCreateAutomationBody } from "@/app/services/automation/automation-create-context";
import { createAutomation } from "@/app/services/automation/automation-api";

const DEFAULT_CAMPAIGN_AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
];

export async function provisionCampaignDefaultAutomations(
  businessId: number,
  campaignId: number,
): Promise<void> {
  for (const template of DEFAULT_CAMPAIGN_AUTOMATION_TEMPLATES) {
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
  }
}
