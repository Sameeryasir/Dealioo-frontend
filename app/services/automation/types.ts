export type AutomationPurpose =
  | "manual"
  | "funnel_signup_payment_reminder"
  | "funnel_signup"
  | "funnel_payment"
  | "funnel_abandoned_checkout_reminder";

export const AUTOMATION_PURPOSE_OPTIONS: {
  value: AutomationPurpose;
  label: string;
}[] = [
  { value: "manual", label: "Manual" },
  {
    value: "funnel_signup_payment_reminder",
    label: "Funnel signup payment reminder",
  },
  { value: "funnel_signup", label: "Funnel signup" },
  { value: "funnel_payment", label: "Funnel payment" },
  {
    value: "funnel_abandoned_checkout_reminder",
    label: "Funnel abandoned checkout reminder",
  },
];

export interface Automation {
  id: number;
  name: string;
  description?: string | null;
  trigger: string;
  purpose?: AutomationPurpose | string;
  isActive: boolean;
  published: boolean;
  restaurantId?: number;
  campaignId?: number;
  funnelId?: number;
  nodes?: AutomationNode[];
  connections?: AutomationConnection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAutomationBody {
  name: string;
  description?: string;
  trigger: string;
  purpose: AutomationPurpose;
  restaurantId: number;
  campaignId: number;
}

export interface AutomationNode {
  id: number;
  automationId: number;
  type: string;
  order: number;
  config: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAutomationNodeBody {
  automationId: number;
  type: string;
  order: number;
  config?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
}

export interface UpdateAutomationNodeBody {
  type?: string;
  order?: number;
  config?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
}

export interface AutomationConnection {
  id: number;
  automationId: number;
  sourceNodeId: number;
  targetNodeId: number;
}

export interface CreateAutomationConnectionBody {
  automationId: number;
  sourceNodeId: number;
  targetNodeId: number;
}

export interface FunnelAutomationGraph {
  funnelId: number;
  automationIds: number[];
  nodes: AutomationNode[];
  connections: AutomationConnection[];
}

export type AutomationExecutionStatus =
  | "running"
  | "waiting"
  | "completed"
  | "failed";

export type AutomationExecutionRecipient = {
  customerId: number;
  email: string;
};

export interface AutomationExecution {
  id: number;
  automationId: number;
  customerId: number;
  currentNodeId: number;
  status: AutomationExecutionStatus;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  automation?: {
    id: number;
    name: string;
    trigger: string;
    isActive: boolean;
    published: boolean;
  };
  currentNode?: {
    id: number;
    type: string;
    config: Record<string, unknown>;
    order: number;
  };
  customer?: {
    id: number;
    email?: string;
    name?: string;
  };
  /** Customers who received emails during this batch run (from API logs). */
  executedRecipients?: AutomationExecutionRecipient[];
}

export interface AutomationLog {
  id: number;
  executionId: number;
  nodeId: number;
  customerId: number;
  message: string;
  error: string | null;
  createdAt: string;
  node?: {
    id: number;
    type: string;
    config: Record<string, unknown>;
  };
}

export interface StartAutomationExecutionBody {
  automationId: number;
  currentNodeId?: number;
}
