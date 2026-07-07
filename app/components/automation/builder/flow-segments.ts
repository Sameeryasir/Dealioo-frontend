import { isActionNodeKind, isTriggerNodeKind } from "@/app/components/automation/automation-ui";
import { expandBundledActionsForDisplay, isBundledActionsNode } from "@/app/components/automation/builder/bundled-actions";
import type { WorkflowNode } from "@/app/components/automation/types";

export type FlowSegment =
  | { type: "node"; node: WorkflowNode; index: number }
  | { type: "actions"; nodes: WorkflowNode[]; startIndex: number };

export function splitTriggerAndFlow(nodes: WorkflowNode[]): {
  trigger: WorkflowNode | null;
  flowNodes: WorkflowNode[];
  flowStartIndex: number;
} {
  const first = nodes[0];
  if (first != null && isTriggerNodeKind(first.kind)) {
    return { trigger: first, flowNodes: nodes.slice(1), flowStartIndex: 1 };
  }
  return { trigger: null, flowNodes: nodes, flowStartIndex: 0 };
}

export function buildFlowSegments(flowNodes: WorkflowNode[], startIndex: number): FlowSegment[] {
  const segments: FlowSegment[] = [];
  let i = 0;

  while (i < flowNodes.length) {
    const node = flowNodes[i]!;
    const globalIndex = startIndex + i;

    if (isBundledActionsNode(node)) {
      segments.push({
        type: "actions",
        nodes: expandBundledActionsForDisplay(node),
        startIndex: globalIndex,
      });
      i += 1;
      continue;
    }

    if (isActionNodeKind(node.kind)) {
      const group: WorkflowNode[] = [node];
      let j = i + 1;
      while (j < flowNodes.length && isActionNodeKind(flowNodes[j]!.kind)) {
        group.push(flowNodes[j]!);
        j += 1;
      }
      if (group.length > 1) {
        segments.push({ type: "actions", nodes: group, startIndex: globalIndex });
      } else {
        segments.push({ type: "node", node, index: globalIndex });
      }
      i = j;
      continue;
    }

    segments.push({ type: "node", node, index: globalIndex });
    i += 1;
  }

  return segments;
}
