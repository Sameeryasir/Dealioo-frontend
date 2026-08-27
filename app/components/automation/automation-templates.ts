import type { WorkflowNodeKind } from "@/app/components/automation/types";
import type { AutomationPurpose } from "@/app/services/automation/types";
import {
  FLOW_BRANCH_PASS,
  FLOW_BRANCH_PAYMENT,
  FLOW_BRANCH_VISITED_YES,
  FLOW_BRANCH_WALLET_REMINDER,
  FLOW_BRANCH_FOLLOW_UP,
  FLOW_BRANCH_OFFER_EXPIRY,
  FLOW_BRANCH_OFFER_EXPIRY_3D,
  FLOW_BRANCH_OFFER_EXPIRY_TOMORROW,
  FLOW_BRANCH_WEEKEND_PASS,
  FLOW_BRANCH_WHY_DIDNT_COME,
  FLOW_BRANCH_PAYMENT_REMINDER,
  FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
} from "@/app/components/automation/builder/flow-layout";
import { PREPAID_FIRST_EMAIL_DEFAULTS } from "@/app/components/automation/builder/bundled-actions";

export type AutomationTemplateNodeDef = {
  key: string;
  kind: WorkflowNodeKind;
  label: string;
  summary: string;
  config: Record<string, unknown>;
};

export type AutomationTemplateConnectionDef = {
  sourceKey: string;
  targetKey: string;
};

export type AutomationTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  trigger: string;
  purpose: AutomationPurpose;
  nodes: AutomationTemplateNodeDef[];
  connections: AutomationTemplateConnectionDef[];
};

const PAYMENT_REMINDER_EMAIL_CONFIG = {
  subject: "Complete your payment — your offer is waiting",
  template: "Payment reminder",
  message:
    "Hi — thank you for signing up! Your offer is almost ready. Please complete your payment to unlock it. If you already paid, you can ignore this email.",
  headline: "Complete your payment",
  ctaLabel: "Complete payment",
} as const;

const PAYMENT_REMINDER_EMAIL_FOLLOW_UP_CONFIG = {
  subject: "Friendly reminder — complete your payment",
  template: "Payment reminder",
  message:
    "Hi — just checking in! Your offer is still waiting. Please complete your payment when you have a moment so we can get everything ready for you.",
  headline: "Your offer is waiting",
  ctaLabel: "Complete payment",
} as const;

const PAYMENT_REMINDER_EMAIL_FINAL_CONFIG = {
  subject: "Don't miss out — complete your payment today",
  template: "Payment reminder",
  message:
    "Hi — we don't want you to miss this offer. Please complete your payment soon to secure it. If you already paid, you can ignore this email.",
  headline: "Complete your payment today",
  ctaLabel: "Complete payment",
} as const;

const PAYMENT_REMINDER_SMS_CONFIG = {
  message:
    "Hi [First Name] — thank you for signing up!\n\nYour offer is almost ready. Use the button below to complete your payment.\n\nPrefer to pay when you visit? Save your pass to Google Wallet or come by the business — we'll scan your pass at checkout.\n\nWe look forward to seeing you!",
  linkLabel: "View Your Pass",
} as const;

const SIGNUP_FOLLOW_UP_MESSAGE = {
  message:
    "Hi [First Name]! Thank you for signing up for our offer yesterday 😄\n\nWe'd love to see you soon. Text us back if you have questions or feedback — this is your direct line to our team :)",
} as const;

const SIGNUP_SECONDARY_FOLLOW_UP_MESSAGE = {
  message: "Text us back if you need anything — we're happy to help :)",
} as const;

const WALLET_PASS_REMINDER_SMS = {
  message:
    "Hi [First Name], we noticed that you haven't added your offer to your digital wallet.\n\nJust in case you were planning to stop by to redeem it, you'll need to add it to your wallet first.",
  linkLabel: "Pass Link",
} as const;

export const ABANDONED_CART_TEMPLATE: AutomationTemplate = {
  id: "abandoned_cart",
  name: "Abandoned Cart",
  category: "Revenue Recovery",
  description:
    "Recover guests who signed up but did not finish. Sends initial SMS and rewards, then splits into pass and payment reminder paths.",
  trigger: "Abandoned Checkout",
  purpose: "funnel_abandoned_checkout_reminder",
  nodes: [
    {
      key: "trigger",
      kind: "signup_trigger",
      label: "Signed up for campaign",
      summary:
        "Guests enter this flow when they provide their information in a campaign funnel.",
      config: {
        trigger: "abandoned_checkout",
        title: "Signed up for campaign",
        description:
          "Guests enter this flow when they provide their information in a campaign funnel.",
      },
    },
    {
      key: "wait",
      kind: "wait",
      label: "Wait until",
      summary: "15 minutes elapsed",
      config: { delay: 15, unit: "minutes" },
    },
    {
      key: "filter",
      kind: "condition",
      label: "Filters",
      summary: "NOT Prepaid for campaign offer",
      config: {
        conditionType: "Has not completed payment",
        value: "NOT Prepaid",
      },
    },
    {
      key: "sms_pass_link",
      kind: "send_sms",
      label: "Send Text",
      summary:
        "Pass link — complete signup by adding your pass to your wallet.",
      config: {
        message:
          "In order to complete your signup, you will need to click this link to add your pass to your wallet:",
        linkLabel: "Pass Link",
      },
    },
    {
      key: "sms_confirm",
      kind: "send_sms",
      label: "Send Text",
      summary:
        "Personal follow-up confirming the offer and opt-out instructions.",
      config: {
        message:
          "Hi [First Name]! This is your team confirming your offer. We noticed you didn't complete your purchase so we've texted you the offer in case you're still planning on coming by. Text STOP at anytime to opt out and delete your offer.",
      },
    },
    {
      key: "give_reward",
      kind: "create_coupon",
      label: "Give Rewards",
      summary: "Grant the campaign reward — expires in 2 weeks (Sunday 11:59 PM).",
      config: {
        rewardName: "Campaign offer",
        expiration: "2 weeks",
        expirationNote:
          "Expires in 2 weeks (rounded up to Sunday at 11:59 PM)",
      },
    },
    {
      key: "set_expiry",
      kind: "tag_customer",
      label: "Set Reward Expiration",
      summary:
        "Set reward expiration to 2 weeks (rounded up to Sunday at 11:59 PM).",
      config: {
        tag: "reward_expiration",
        rewardName: "Campaign offer",
        expiration: "2 weeks",
        expirationNote:
          "Set expiration to in 2 weeks (rounded up to Sunday at 11:59 PM)",
      },
    },
    {
      key: "wait_pass",
      kind: "wait",
      label: "Wait until",
      summary: "15 minutes elapsed",
      config: { delay: 15, unit: "minutes", flowBranch: FLOW_BRANCH_PASS },
    },
    {
      key: "filter_pass",
      kind: "condition",
      label: "Filters",
      summary: "NOT Pass was added",
      config: {
        flowBranch: FLOW_BRANCH_PASS,
        conditionType: "Pass not added",
        value: "NOT Pass was added",
      },
    },
    {
      key: "action_pass",
      kind: "send_sms",
      label: "Send Text",
      summary: "Pass reminder with wallet link.",
      config: {
        flowBranch: FLOW_BRANCH_PASS,
        message: WALLET_PASS_REMINDER_SMS.message,
        linkLabel: WALLET_PASS_REMINDER_SMS.linkLabel,
      },
    },
    {
      key: "wait_payment",
      kind: "wait",
      label: "Wait until",
      summary: "11:08 am",
      config: {
        flowBranch: FLOW_BRANCH_PAYMENT,
        waitMode: "until_time",
        untilTime: "11:08 am",
        time: "11:08",
      },
    },
    {
      key: "filter_payment",
      kind: "condition",
      label: "Filters",
      summary: "Over 7 hours + NOT paid + NOT Arancini redeemed",
      config: {
        flowBranch: FLOW_BRANCH_PAYMENT,
        conditions: [
          { value: "Over 7 hours since signed up for the first time" },
          { negated: true, value: "Status not paid" },
          { negated: true, value: "Arancini was redeemed" },
        ],
      },
    },
    {
      key: "action_payment",
      kind: "send_sms",
      label: "Send Text",
      summary: "Register thanks, pay online, or add pass to Wallet then visit business.",
      config: {
        flowBranch: FLOW_BRANCH_PAYMENT,
        ...PAYMENT_REMINDER_SMS_CONFIG,
      },
    },
  ],
  connections: [
    { sourceKey: "trigger", targetKey: "wait" },
    { sourceKey: "wait", targetKey: "filter" },
    { sourceKey: "filter", targetKey: "sms_pass_link" },
    { sourceKey: "sms_pass_link", targetKey: "sms_confirm" },
    { sourceKey: "sms_confirm", targetKey: "give_reward" },
    { sourceKey: "give_reward", targetKey: "set_expiry" },
    { sourceKey: "set_expiry", targetKey: "wait_pass" },
    { sourceKey: "wait_pass", targetKey: "filter_pass" },
    { sourceKey: "filter_pass", targetKey: "action_pass" },
    { sourceKey: "action_pass", targetKey: "wait_payment" },
    { sourceKey: "wait_payment", targetKey: "filter_payment" },
    { sourceKey: "filter_payment", targetKey: "action_payment" },
  ],
};

const QR_PASS_EMAIL_CONFIG = {
  subject: "Your QR pass is ready — add to Wallet",
  template: "QR pass guide",
  message:
    "Your offer pass is ready! Tap the button below to view your QR code.\n\nHow to use your pass:\n1. Open your pass and tap Add to Apple Wallet or Google Wallet\n2. Visit the business and show your pass at the scanner when you pay\n\nPrefer to pay online? You can still complete checkout anytime.",
  headline: "Your QR pass is ready",
  ctaLabel: "View my pass",
} as const;

export const PAYMENT_REMINDER_TEMPLATE: AutomationTemplate = {
  id: "payment_reminder",
  name: "Payment Reminder",
  category: "Revenue Recovery",
  description:
    "Follow up with guests who signed up but have not paid. Sends escalating payment reminders on each cron run.",
  trigger: "Cron Job",
  purpose: "funnel_signup_payment_reminder",
  nodes: [
    {
      key: "trigger",
      kind: "cron_trigger",
      label: "Cron Job",
      summary: "Every 15 minutes",
      config: {
        trigger: "cron",
        frequency: "interval",
        interval: 15,
        unit: "minutes",
      },
    },
    {
      key: "filter",
      kind: "condition",
      label: "Filters",
      summary: "Route by payment status",
      config: {
        conditionType: "Has not completed payment",
        conditions: [{ value: "Status not paid" }],
        isPaymentReminderStatusSplit: true,
        branchLabelTrue: "Guest paid — stop reminders (left branch)",
        branchLabelFalse: "Still unpaid — send reminders (right branch)",
      },
    },
    {
      key: "parallel_split_payment_reminder",
      kind: "wait",
      label: "Parallel Split",
      summary: "Split into initial reminder and escalation reminders.",
      config: {
        isParallelSplit: true,
        delay: 0,
        unit: "minutes",
        branches: [
          {
            id: FLOW_BRANCH_PAYMENT_REMINDER,
            title: "Payment Reminder",
          },
          {
            id: FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
            title: "Escalation Reminders",
          },
        ],
      },
    },
    {
      key: "wait_reminder_1",
      kind: "wait",
      label: "Wait until",
      summary: "2 minutes elapsed",
      config: {
        delay: 2,
        unit: "minutes",
        workflowKind: "payment_reminder_wait",
        flowBranch: FLOW_BRANCH_PAYMENT_REMINDER,
      },
    },
    {
      key: "email_payment",
      kind: "send_email",
      label: "Send Email",
      summary: "First payment reminder with link to complete checkout.",
      config: {
        ...PAYMENT_REMINDER_EMAIL_CONFIG,
        workflowKind: "payment_reminder_email",
        flowBranch: FLOW_BRANCH_PAYMENT_REMINDER,
        flowSectionTitle: "Payment Reminder",
      },
    },
    {
      key: "wait_reminder_2",
      kind: "wait",
      label: "Wait until",
      summary: "2 minutes elapsed",
      config: {
        delay: 2,
        unit: "minutes",
        flowBranch: FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
      },
    },
    {
      key: "email_payment_2",
      kind: "send_email",
      label: "Send Email",
      summary: "Follow-up payment reminder.",
      config: {
        ...PAYMENT_REMINDER_EMAIL_FOLLOW_UP_CONFIG,
        flowBranch: FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
        flowSectionTitle: "Payment Reminder — Follow-up",
      },
    },
    {
      key: "filter_google_wallet",
      kind: "condition",
      label: "Filters",
      summary: "Google Wallet pass NOT added",
      config: {
        flowBranch: FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
        conditionType: "Pass not added",
        conditions: [{ value: "NOT Pass was added" }],
      },
    },
    {
      key: "email_qr_pass",
      kind: "send_email",
      label: "Send Email",
      summary: "QR pass guide — view pass and add to Google Wallet.",
      config: {
        ...QR_PASS_EMAIL_CONFIG,
        flowBranch: FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
        flowSectionTitle: "QR Pass & Google Wallet",
      },
    },
    {
      key: "wait_reminder_3",
      kind: "wait",
      label: "Wait until",
      summary: "2 minutes elapsed",
      config: {
        delay: 2,
        unit: "minutes",
        flowBranch: FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
      },
    },
    {
      key: "email_payment_3",
      kind: "send_email",
      label: "Send Email",
      summary: "Final payment reminder with stronger urgency.",
      config: {
        ...PAYMENT_REMINDER_EMAIL_FINAL_CONFIG,
        flowBranch: FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
        flowSectionTitle: "Payment Reminder — Final notice",
      },
    },
  ],
  connections: [
    { sourceKey: "trigger", targetKey: "filter" },
    { sourceKey: "filter", targetKey: "parallel_split_payment_reminder" },
    {
      sourceKey: "parallel_split_payment_reminder",
      targetKey: "wait_reminder_1",
    },
    {
      sourceKey: "parallel_split_payment_reminder",
      targetKey: "wait_reminder_2",
    },
    { sourceKey: "wait_reminder_1", targetKey: "email_payment" },
    { sourceKey: "wait_reminder_2", targetKey: "email_payment_2" },
    { sourceKey: "email_payment_2", targetKey: "filter_google_wallet" },
    { sourceKey: "filter_google_wallet", targetKey: "email_qr_pass" },
    { sourceKey: "email_qr_pass", targetKey: "wait_reminder_3" },
    { sourceKey: "wait_reminder_3", targetKey: "email_payment_3" },
  ],
};

export const POST_PAYMENT_JOURNEY_TEMPLATE: AutomationTemplate = {
  id: "post_payment_journey",
  name: "Prepaid Offer",
  category: "Guest Journey",
  description:
    "Runs after a guest pays. Sends thank-you and confirmation emails, a pass reminder, then follow-ups after they visit the business (when their pass is scanned).",
  trigger: "Payment",
  purpose: "funnel_payment",
  nodes: [
    {
      key: "trigger",
      kind: "payment_trigger",
      label: "Payment Completed",
      summary: "Starts when a guest completes payment.",
      config: {
        trigger: "payment",
        title: "Payment Completed",
        description:
          "Guests enter this flow when they finish paying for the campaign offer.",
      },
    },
    {
      key: "payment_confirmation_email",
      kind: "send_email",
      label: "Send Email",
      summary: "First prepaid offer email with pass link — sent once after payment.",
      config: {
        workflowKind: "prepaid_payment_actions",
        subject: PREPAID_FIRST_EMAIL_DEFAULTS.subject,
        template: PREPAID_FIRST_EMAIL_DEFAULTS.template,
        message: PREPAID_FIRST_EMAIL_DEFAULTS.message,
        headline: PREPAID_FIRST_EMAIL_DEFAULTS.headline,
        ctaLabel: PREPAID_FIRST_EMAIL_DEFAULTS.ctaLabel,
      },
    },
    {
      key: "wait_before_reminder",
      kind: "wait",
      label: "Wait until",
      summary: "1 day elapsed",
      config: { delay: 1, unit: "days", workflowKind: "prepaid_visit_reminder_wait" },
    },
    {
      key: "email_visit_reminder",
      kind: "send_email",
      label: "Send Email",
      summary: "Pass reminder — visit anytime and show your pass.",
      config: {
        workflowKind: "prepaid_visit_reminder",
        subject: "Your offer is ready — visit us anytime",
        template: "Payment confirmation",
        message:
          "Hi [First Name] — your offer is ready whenever you visit! Show your pass at the business when you arrive.",
        headline: "Your offer is ready",
        ctaLabel: "View Your Pass",
      },
    },
    {
      key: "filter_visited",
      kind: "condition",
      label: "Filters",
      summary: "Customer visited (pass scanned at business)",
      config: {
        conditionType: "Customer visited",
        value: "Customer visited",
        onFalseLoopWorkflowKind: "prepaid_visit_reminder_wait",
        branchLabelTrue: "Customer visited",
        branchLabelFalse: "Not visited — send visit reminder again",
      },
    },
    {
      key: "email_post_visit_thanks",
      kind: "send_email",
      label: "Send Email",
      summary: "Thank you message after the visit.",
      config: {
        flowBranch: FLOW_BRANCH_VISITED_YES,
        subject: "Thanks for visiting us!",
        template: "Payment confirmation",
        message:
          "Thanks for visiting us today, [First Name]! We hope you enjoyed your experience.",
        headline: "Thank you for visiting",
      },
    },
    {
      key: "wait_2_days",
      kind: "wait",
      label: "Wait until",
      summary: "2 days elapsed",
      config: { flowBranch: FLOW_BRANCH_VISITED_YES, delay: 2, unit: "days" },
    },
    {
      key: "email_review",
      kind: "send_email",
      label: "Send Email",
      summary: "Review request with link.",
      config: {
        flowBranch: FLOW_BRANCH_VISITED_YES,
        subject: "We'd love your feedback",
        template: "Payment confirmation",
        message:
          "Hi [First Name] — we'd love your feedback! Leave us a quick review.",
        headline: "Share your experience",
        ctaLabel: "Leave a Review",
      },
    },
    {
      key: "wait_7_days",
      kind: "wait",
      label: "Wait until",
      summary: "7 days elapsed",
      config: { flowBranch: FLOW_BRANCH_VISITED_YES, delay: 7, unit: "days" },
    },
    {
      key: "return_offer",
      kind: "send_email",
      label: "Send Email",
      summary: "Return visit offer email.",
      config: {
        flowBranch: FLOW_BRANCH_VISITED_YES,
        subject: "Your return visit offer is ready",
        message:
          "Hi [First Name] — we'd love to see you again! Your return visit offer is ready.\n\nValid for 30 days after send.",
        headline: "Return visit offer",
      },
    },
  ],
  connections: [
    { sourceKey: "trigger", targetKey: "payment_confirmation_email" },
    { sourceKey: "payment_confirmation_email", targetKey: "wait_before_reminder" },
    { sourceKey: "wait_before_reminder", targetKey: "email_visit_reminder" },
    { sourceKey: "email_visit_reminder", targetKey: "filter_visited" },
    { sourceKey: "filter_visited", targetKey: "email_post_visit_thanks" },
    { sourceKey: "email_post_visit_thanks", targetKey: "wait_2_days" },
    { sourceKey: "wait_2_days", targetKey: "email_review" },
    { sourceKey: "email_review", targetKey: "wait_7_days" },
    { sourceKey: "wait_7_days", targetKey: "return_offer" },
  ],
};


export const SIGNUP_AUTOMATION_TEMPLATE: AutomationTemplate = {
  id: "signup_automation",
  name: "Signup automation",
  category: "Guest Journey",
  description:
    "When a guest signs up: send pass link + welcome SMS, create a reward, then split into Wallet Reminder and Follow-up Message paths.",
  trigger: "Signup",
  purpose: "funnel_signup",
  nodes: [
    {
      key: "trigger",
      kind: "signup_trigger",
      label: "Signed up for campaign",
      summary: "Customer signs up for a campaign.",
      config: {
        trigger: "signup",
        title: "Signed up for campaign",
        description:
          "Guests enter this flow when they sign up for a campaign funnel.",
      },
    },
    {
      key: "sms_pass_link",
      kind: "send_sms",
      label: "Send Text",
      summary: "Complete signup — Pass Link.",
      config: {
        message:
          "Complete your signup — add your pass to your wallet.",
        linkLabel: "Pass Link",
      },
    },
    {
      key: "sms_welcome",
      kind: "send_sms",
      label: "Send Text",
      summary: "Welcome SMS after signup.",
      config: {
        message:
          "Hi [First Name]! Welcome — your offer is ready. We can't wait to see you. Text STOP anytime to opt out.",
      },
    },
    {
      key: "give_reward",
      kind: "create_coupon",
      label: "Give Rewards",
      summary: "Create campaign reward.",
      config: {
        rewardName: "Campaign offer",
        expiration: "14 days",
        expirationNote: "Expires 14 days after signup",
      },
    },
    {
      key: "parallel_split",
      kind: "wait",
      label: "Parallel Split",
      summary: "Split into Wallet Reminder and Follow-up Message.",
      config: {
        isParallelSplit: true,
        delay: 0,
        unit: "minutes",
        branches: [
          { id: FLOW_BRANCH_WALLET_REMINDER, title: "Wallet Reminder" },
          { id: FLOW_BRANCH_FOLLOW_UP, title: "Follow-up Message" },
        ],
      },
    },
    {
      key: "wait_wallet",
      kind: "wait",
      label: "Wait until",
      summary: "15 minutes elapsed",
      config: {
        delay: 15,
        unit: "minutes",
        flowBranch: FLOW_BRANCH_WALLET_REMINDER,
      },
    },
    {
      key: "filter_wallet",
      kind: "condition",
      label: "Filters",
      summary: "Pass was NOT added",
      config: {
        flowBranch: FLOW_BRANCH_WALLET_REMINDER,
        conditionType: "Pass not added",
        conditions: [{ value: "NOT Pass was added" }],
      },
    },
    {
      key: "sms_wallet_reminder",
      kind: "send_sms",
      label: "Send Text",
      summary: "Reminder to add the pass to wallet.",
      config: {
        flowBranch: FLOW_BRANCH_WALLET_REMINDER,
        message: WALLET_PASS_REMINDER_SMS.message,
        linkLabel: WALLET_PASS_REMINDER_SMS.linkLabel,
      },
    },
    {
      key: "wait_follow_up",
      kind: "wait",
      label: "Wait until",
      summary: "Next day at 10:34 AM",
      config: {
        flowBranch: FLOW_BRANCH_FOLLOW_UP,
        waitMode: "until_time",
        untilTime: "10:34 am",
        time: "10:34",
        untilLabel: "Next day at 10:34 AM",
      },
    },
    {
      key: "filter_follow_up",
      kind: "condition",
      label: "Filters",
      summary: "Signed up > 7 hours AND reward NOT redeemed",
      config: {
        flowBranch: FLOW_BRANCH_FOLLOW_UP,
        conditions: [
          { value: "Over 7 hours since signed up for the first time" },
          { negated: true, value: "Reward was redeemed" },
        ],
      },
    },
    {
      key: "sms_follow_up",
      kind: "send_sms",
      label: "Send Text",
      summary: "Follow-up thank-you after signup.",
      config: {
        flowBranch: FLOW_BRANCH_FOLLOW_UP,
        message: SIGNUP_FOLLOW_UP_MESSAGE.message,
      },
    },

    {
      key: "parallel_split_follow_up",
      kind: "wait",
      label: "Parallel Split",
      summary: "Nested split: offer expiry + weekend pass reminders.",
      config: {
        isParallelSplit: true,
        delay: 0,
        unit: "minutes",
        flowBranch: FLOW_BRANCH_FOLLOW_UP,
        branches: [
          {
            id: FLOW_BRANCH_OFFER_EXPIRY,
            title: "Reminder: Offer Expires End of Week",
          },
          {
            id: FLOW_BRANCH_WEEKEND_PASS,
            title: "Reminder: Add Pass (Weekend)",
          },
        ],
      },
    },

    {
      key: "wait_offer_expiry",
      kind: "wait",
      label: "Wait until",
      summary: "8:18 AM",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        waitMode: "until_time",
        untilTime: "8:18 am",
        time: "8:18",
        untilLabel: "8:18 AM",
      },
    },
    {
      key: "filter_offer_expiry",
      kind: "condition",
      label: "Filters",
      summary: "Offer expires in less than 6 days",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        conditions: [
          { value: "Offer expires in less than 6 days", amount: 6, unit: "days" },
        ],
      },
    },
    {
      key: "sms_offer_expiry",
      kind: "send_sms",
      label: "Send Text",
      summary: "Expiry reminder SMS.",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        message:
          "Hey! This is a friendly reminder that your offer expires this Sunday.\n\nText us back if you need a link to your offer.",
      },
    },
    {
      key: "sms_offer_expiry_hours",
      kind: "send_sms",
      label: "Send Text",
      summary: "Short follow-up after expiry reminder.",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        message: SIGNUP_SECONDARY_FOLLOW_UP_MESSAGE.message,
      },
    },

    {
      key: "wait_offer_expiry_3d",
      kind: "wait",
      label: "Wait until",
      summary: "11:12 AM",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY_3D,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        flowSectionTitle: "Reminder: Offer Expires in 3 Days",
        waitMode: "until_time",
        untilTime: "11:12 am",
        time: "11:12",
        untilLabel: "11:12 AM",
      },
    },
    {
      key: "filter_offer_expiry_3d",
      kind: "condition",
      label: "Filters",
      summary: "Offer expires in less than 3 days",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY_3D,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        conditions: [
          { value: "Offer expires in less than 3 days", amount: 3, unit: "days" },
        ],
      },
    },
    {
      key: "sms_offer_expiry_3d",
      kind: "send_sms",
      label: "Send Text",
      summary: "Expiry reminder — less than 3 days left.",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY_3D,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        message:
          "Hey! Quick reminder — your offer expires in less than 3 days. Don't miss out!\n\nText us back if you need a link to your offer.",
      },
    },

    {
      key: "wait_offer_expiry_tomorrow",
      kind: "wait",
      label: "Wait until",
      summary: "Saturday at 10:36 AM",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY_TOMORROW,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        flowSectionTitle: "Reminder: Offer Expires Tomorrow",
        waitMode: "until_day_of_week",
        dayOfWeek: "saturday",
        untilTime: "10:36 am",
        time: "10:36",
        untilLabel: "Saturday at 10:36 AM",
      },
    },
    {
      key: "filter_offer_expiry_tomorrow",
      kind: "condition",
      label: "Filters",
      summary: "Less than a day until your offer will expire",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY_TOMORROW,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        conditions: [
          { value: "Offer expires in less than 1 days", amount: 1, unit: "days" },
        ],
      },
    },
    {
      key: "sms_offer_expiry_tomorrow",
      kind: "send_sms",
      label: "Send Text",
      summary: "Expiry reminder — offer expires tomorrow night.",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY_TOMORROW,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        message:
          "Hey! This is a no pressure reminder that your offer expires tomorrow night.",
      },
    },

    {
      key: "wait_offer_expiry_today",
      kind: "wait",
      label: "Wait until",
      summary: "11:07 AM",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        flowSectionTitle: "Reminder: Offer Expires Today",
        waitMode: "until_time",
        untilTime: "11:07 am",
        time: "11:07",
        untilLabel: "11:07 am",
      },
    },
    {
      key: "filter_offer_expiry_today",
      kind: "condition",
      label: "Filters",
      summary: "Offer expires in less than 1 day",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        conditions: [
          { value: "Offer expires in less than 1 days", amount: 1, unit: "days" },
        ],
      },
    },
    {
      key: "sms_offer_expiry_today",
      kind: "send_sms",
      label: "Send Text",
      summary: "Last reminder — offer expires tonight.",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        message:
          "Hey [First Name], this is your last reminder that your offer expires tonight.\n\nSee you soon 😊",
      },
    },

    {
      key: "wait_offer_expired",
      kind: "wait",
      label: "Wait until",
      summary: "Monday at 11:01 am",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        flowSectionTitle: "Offer expired",
        waitMode: "until_day_of_week",
        dayOfWeek: "monday",
        untilTime: "11:01 am",
        time: "11:01",
        untilLabel: "Monday at 11:01 am",
      },
    },
    {
      key: "filter_offer_expired",
      kind: "condition",
      label: "Filters",
      summary: "Offer has expired",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        conditions: [{ value: "Offer expired" }],
      },
    },
    {
      key: "sms_offer_expired",
      kind: "send_sms",
      label: "Send Text",
      summary: "Offer expired notice.",
      config: {
        flowBranch: FLOW_BRANCH_OFFER_EXPIRY,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        message:
          "Oh no! Your offer has expired. We hope to see you next time!",
      },
    },

    {
      key: "wait_why_didnt_come",
      kind: "wait",
      label: "Wait until",
      summary: "9:21 am",
      config: {
        flowBranch: FLOW_BRANCH_WHY_DIDNT_COME,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        waitMode: "until_time",
        untilTime: "9:21 am",
        time: "9:21",
        untilLabel: "9:21 am",
      },
    },
    {
      key: "filter_why_didnt_come",
      kind: "condition",
      label: "Filters",
      summary: "Over 3 days since offer expired",
      config: {
        flowBranch: FLOW_BRANCH_WHY_DIDNT_COME,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        conditions: [{ value: "Over 3 days since offer expired" }],
      },
    },
    {
      key: "sms_why_didnt_come",
      kind: "send_sms",
      label: "Send Text",
      summary: "Feedback ask — why didn't you redeem?",
      config: {
        flowBranch: FLOW_BRANCH_WHY_DIDNT_COME,
        flowBranchParent: FLOW_BRANCH_OFFER_EXPIRY,
        message:
          "Hi [First Name], I was wondering what stopped you from coming by to redeem your offer?\n\nNot trying to bother at all. Just trying to learn so we can make our guest experience better :)",
      },
    },

    {
      key: "wait_weekend_pass",
      kind: "wait",
      label: "Wait until",
      summary: "Friday 8:58 AM",
      config: {
        flowBranch: FLOW_BRANCH_WEEKEND_PASS,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        waitMode: "until_day_of_week",
        dayOfWeek: "friday",
        untilTime: "8:58 am",
        time: "8:58",
        untilLabel: "Friday 8:58 AM",
      },
    },
    {
      key: "filter_weekend_pass",
      kind: "condition",
      label: "Filters",
      summary:
        "Pass NOT added AND less than a week since signup AND reward NOT redeemed",
      config: {
        flowBranch: FLOW_BRANCH_WEEKEND_PASS,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        conditions: [
          { negated: true, value: "Pass was added" },
          {
            value: "Less than 7 days since signed up for the first time",
            amount: 7,
            unit: "days",
            comparator: "lt",
          },
          { negated: true, value: "Reward was redeemed" },
        ],
      },
    },
    {
      key: "sms_weekend_pass",
      kind: "send_sms",
      label: "Send Text",
      summary: "Weekend reminder with Pass Link.",
      config: {
        flowBranch: FLOW_BRANCH_WEEKEND_PASS,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        message: WALLET_PASS_REMINDER_SMS.message,
        linkLabel: WALLET_PASS_REMINDER_SMS.linkLabel,
      },
    },
    {
      key: "sms_weekend_pass_hours",
      kind: "send_sms",
      label: "Send Text",
      summary: "Short follow-up after weekend pass reminder.",
      config: {
        flowBranch: FLOW_BRANCH_WEEKEND_PASS,
        flowBranchParent: FLOW_BRANCH_FOLLOW_UP,
        message: SIGNUP_SECONDARY_FOLLOW_UP_MESSAGE.message,
      },
    },
  ],
  connections: [
    { sourceKey: "trigger", targetKey: "sms_pass_link" },
    { sourceKey: "sms_pass_link", targetKey: "sms_welcome" },
    { sourceKey: "sms_welcome", targetKey: "give_reward" },
    { sourceKey: "give_reward", targetKey: "parallel_split" },
    { sourceKey: "parallel_split", targetKey: "wait_wallet" },
    { sourceKey: "parallel_split", targetKey: "wait_follow_up" },
    { sourceKey: "wait_wallet", targetKey: "filter_wallet" },
    { sourceKey: "filter_wallet", targetKey: "sms_wallet_reminder" },
    { sourceKey: "wait_follow_up", targetKey: "filter_follow_up" },
    { sourceKey: "filter_follow_up", targetKey: "sms_follow_up" },
    { sourceKey: "sms_follow_up", targetKey: "parallel_split_follow_up" },
    { sourceKey: "parallel_split_follow_up", targetKey: "wait_offer_expiry" },
    { sourceKey: "parallel_split_follow_up", targetKey: "wait_weekend_pass" },
    { sourceKey: "wait_offer_expiry", targetKey: "filter_offer_expiry" },
    { sourceKey: "filter_offer_expiry", targetKey: "sms_offer_expiry" },
    { sourceKey: "sms_offer_expiry", targetKey: "sms_offer_expiry_hours" },
    { sourceKey: "sms_offer_expiry_hours", targetKey: "wait_offer_expiry_3d" },
    { sourceKey: "wait_offer_expiry_3d", targetKey: "filter_offer_expiry_3d" },
    { sourceKey: "filter_offer_expiry_3d", targetKey: "sms_offer_expiry_3d" },
    { sourceKey: "sms_offer_expiry_3d", targetKey: "wait_offer_expiry_tomorrow" },
    {
      sourceKey: "wait_offer_expiry_tomorrow",
      targetKey: "filter_offer_expiry_tomorrow",
    },
    {
      sourceKey: "filter_offer_expiry_tomorrow",
      targetKey: "sms_offer_expiry_tomorrow",
    },
    {
      sourceKey: "sms_offer_expiry_tomorrow",
      targetKey: "wait_offer_expiry_today",
    },
    {
      sourceKey: "wait_offer_expiry_today",
      targetKey: "filter_offer_expiry_today",
    },
    {
      sourceKey: "filter_offer_expiry_today",
      targetKey: "sms_offer_expiry_today",
    },
    { sourceKey: "sms_offer_expiry_today", targetKey: "wait_offer_expired" },
    { sourceKey: "wait_offer_expired", targetKey: "filter_offer_expired" },
    { sourceKey: "filter_offer_expired", targetKey: "sms_offer_expired" },
    { sourceKey: "sms_offer_expired", targetKey: "wait_why_didnt_come" },
    { sourceKey: "wait_why_didnt_come", targetKey: "filter_why_didnt_come" },
    { sourceKey: "filter_why_didnt_come", targetKey: "sms_why_didnt_come" },
    { sourceKey: "wait_weekend_pass", targetKey: "filter_weekend_pass" },
    { sourceKey: "filter_weekend_pass", targetKey: "sms_weekend_pass" },
    { sourceKey: "sms_weekend_pass", targetKey: "sms_weekend_pass_hours" },
  ],
};

const HIDDEN_TEMPLATE_PURPOSES = new Set<AutomationPurpose>([
  "manual",
  "funnel_abandoned_checkout_reminder",
]);

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  ABANDONED_CART_TEMPLATE,
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
  SIGNUP_AUTOMATION_TEMPLATE,
].filter((template) => !HIDDEN_TEMPLATE_PURPOSES.has(template.purpose));

export function getAutomationTemplateById(
  templateId: string,
): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((template) => template.id === templateId);
}
