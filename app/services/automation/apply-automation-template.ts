import type { AutomationTemplate } from "@/app/components/automation/automation-templates";
import { automationFetch } from "@/app/services/automation/automation-fetch";
import {
  blockKindToNodeType,
} from "@/app/services/automation/node-api";
import type { Automation } from "@/app/services/automation/types";

type BootstrapAutomationGraphBody = {
  nodes: Array<{
    type: ReturnType<typeof blockKindToNodeType>;
    order: number;
    config: Record<string, unknown>;
    positionX: number;
    positionY: number;
  }>;
  connections: Array<{
    sourceIndex: number;
    targetIndex: number;
  }>;
};

async function bootstrapAutomationGraph(
  automationId: number,
  body: BootstrapAutomationGraphBody,
): Promise<Automation> {
  return automationFetch<Automation>(
    `/${encodeURIComponent(String(automationId))}/bootstrap-graph`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function applyAutomationTemplate(
  automationId: number,
  template: AutomationTemplate,
): Promise<Automation> {
  const nodeIndexByKey = new Map<string, number>();

  template.nodes.forEach((nodeDef, index) => {
    nodeIndexByKey.set(nodeDef.key, index);
  });

  const connections = template.connections
    .map((connection) => {
      const sourceIndex = nodeIndexByKey.get(connection.sourceKey);
      const targetIndex = nodeIndexByKey.get(connection.targetKey);
      if (sourceIndex == null || targetIndex == null) {
        return null;
      }

      return { sourceIndex, targetIndex };
    })
    .filter(
      (connection): connection is { sourceIndex: number; targetIndex: number } =>
        connection != null,
    );

  return bootstrapAutomationGraph(automationId, {
    nodes: template.nodes.map((nodeDef, index) => ({
      type: blockKindToNodeType(nodeDef.kind),
      order: index,
      config: nodeDef.config,
      positionX: 100,
      positionY: 200 + index * 120,
    })),
    connections,
  });
}
