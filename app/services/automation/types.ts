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
  {
    value: "funnel_signup_payment_reminder",
    label: "Funnel signup payment reminder",
  },
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
  businessId?: number;
  /** @deprecated Use businessId */
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
  businessId: number;
  /** @deprecated Use businessId */
  restaurantId?: number;
  campaignId: number;
}

export interface UpdateAutomationBody {
  name?: string;
  description?: string;
  isActive?: boolean;
  published?: boolean;
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
  | "queued"
  | "running"
  | "waiting"
  | "paused"
  | "completed"
  | "failed";

export interface AutomationExecutionStatusDto {
  executionId: number;
  automationId: number;
  status: AutomationExecutionStatus;
  isTerminal: boolean;
  totalRecipients: number;
  emailsSent: number;
  progressPercent: number;
  queueJobId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartAutomationExecutionResponse {
  status: AutomationExecutionStatusDto;
}

export type AutomationExecutionRecipient = {
  customerId: number;
  email: string;
};

export type ExecutionListItem = {
  runId: number;
  id: number;
  status: AutomationExecutionStatus;
  startedAt: string;
  customerCount: number;
  customerId?: number | null;
  customerEmail?: string | null;
  customerName?: string | null;
  totalRecipients?: number;
  emailsSentCount?: number;
  scheduledAt?: string | null;
  stepType?: string | null;
};

export interface AutomationExecution {
  id: number;
  automationId: number;
  customerId: number;
  currentNodeId: number;
  status: AutomationExecutionStatus;
  scheduledAt: string | null;
  totalRecipients?: number;
  emailsSentCount?: number;
  queueJobId?: string | null;
  lastError?: string | null;
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
  executedRecipients?: AutomationExecutionRecipient[];
}

export interface AutomationLogNode {
  id: number;
  automationId: number;
  type: string;
  config: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutomationLog {
  id: number;
  executionId: number;
  nodeId: number;
  customerId: number;
  message: string;
  error: string | null;
  createdAt: string;
  node?: AutomationLogNode;
}

export type ExecutionLogsResponse = AutomationLog[];

export interface StartAutomationExecutionBody {
  automationId: number;
  currentNodeId?: number;
}

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ExecutionListSummary = {
  completed: number;
  inProgress: number;
  customersReached: number;
};

export type PaginatedExecutionsApiResponse = {
  data: ExecutionListItem[] | AutomationExecution[];
  meta: PaginationMeta & {
    summary?: ExecutionListSummary;
  };
};

export interface PaginatedExecutionsResponse {
  data: AutomationExecution[];
  meta: PaginationMeta & {
    summary?: ExecutionListSummary;
  };
}

export const EXECUTIONS_PAGE_SIZE = 10;
