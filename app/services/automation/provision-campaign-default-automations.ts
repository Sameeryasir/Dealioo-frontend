import {
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
  type AutomationTemplate,
} from "@/app/components/automation/automation-templates";
import { applyAutomationTemplate } from "@/app/services/automation/apply-automation-template";
import { buildCreateAutomationBody } from "@/app/services/automation/automation-create-context";
import {
  activateAutomation,
  createAutomation,
  getAutomations,
} from "@/app/services/automation/automation-api";

const DEFAULT_CAMPAIGN_AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
];

export async function provisionCampaignDefaultAutomations(
  businessId: number,
  campaignId: number,
): Promise<void> {
  const existing = await getAutomations(businessId);
  const onCampaign = existing.filter(
    (automation) => automation.campaignId === campaignId,
  );

  await Promise.all(
    DEFAULT_CAMPAIGN_AUTOMATION_TEMPLATES.map(async (template) => {
      const already = onCampaign.find(
        (automation) => automation.purpose === template.purpose,
      );

      if (already) {
        if (!already.isActive) {
          await activateAutomation(already.id);
        }
        return;
      }

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
      await activateAutomation(created.id);
    }),
  );
}
