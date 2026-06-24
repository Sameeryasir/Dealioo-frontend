/**
 * Change summary:
 * - Creates automation nodes and connections from an import template.
 * - Why: Pre-fills the builder when a user picks a template like Abandoned Cart.
 * - Related: automation-templates.ts, AutomationListPage
 * - MCP Context 7: keeps graph creation in one service, separate from UI.
 */

import type { AutomationTemplate } from "@/app/components/automation/automation-templates";
import { createAutomationConnection } from "@/app/services/automation/connection-api";
import {
  blockKindToNodeType,
  createAutomationNode,
} from "@/app/services/automation/node-api";

export async function applyAutomationTemplate(
  automationId: number,
  template: AutomationTemplate,
): Promise<void> {
  const nodeIdByKey = new Map<string, number>();

  for (let index = 0; index < template.nodes.length; index += 1) {
    const nodeDef = template.nodes[index]!;
    const created = await createAutomationNode({
      automationId,
      type: blockKindToNodeType(nodeDef.kind),
      order: index,
      config: nodeDef.config,
      positionX: 100,
      positionY: 200 + index * 120,
    });
    nodeIdByKey.set(nodeDef.key, created.id);
  }

  for (const connection of template.connections) {
    const sourceNodeId = nodeIdByKey.get(connection.sourceKey);
    const targetNodeId = nodeIdByKey.get(connection.targetKey);
    if (sourceNodeId == null || targetNodeId == null) continue;

    await createAutomationConnection({
      automationId,
      sourceNodeId,
      targetNodeId,
    });
  }
}
