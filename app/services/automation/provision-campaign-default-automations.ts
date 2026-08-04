import {
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
  SIGNUP_AUTOMATION_TEMPLATE,
  type AutomationTemplate,
} from "@/app/components/automation/automation-templates";
import { applyAutomationTemplate } from "@/app/services/automation/apply-automation-template";
import { buildCreateAutomationBody } from "@/app/services/automation/automation-create-context";
import {
  createAutomation,
  getAutomations,
} from "@/app/services/automation/automation-api";

const PREPAID_DEFAULT_TEMPLATES: AutomationTemplate[] = [
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
];

const POSTPAID_DEFAULT_TEMPLATES: AutomationTemplate[] = [
  SIGNUP_AUTOMATION_TEMPLATE,
];

export async function provisionCampaignDefaultAutomations(
  businessId: number,
  campaignId: number,
  campaignType: "prepaid" | "postpaid" = "prepaid",
): Promise<void> {
  const templates =
    campaignType === "postpaid"
      ? POSTPAID_DEFAULT_TEMPLATES
      : PREPAID_DEFAULT_TEMPLATES;

  const existing = await getAutomations(businessId);
  const onCampaign = existing.filter(
    (automation) => automation.campaignId === campaignId,
  );

  await Promise.all(
    templates.map(async (template) => {
      const already = onCampaign.find(
        (automation) => automation.purpose === template.purpose,
      );

      if (already) {
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
    }),
  );
}
