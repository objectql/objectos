/**
 * WorkflowVisualizer — BPMN-lite flow diagram for workflow definitions.
 *
 * Renders a visual representation of a workflow's states and transitions
 * using pure SVG. Highlights the current state when provided.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkflowDefinition, WorkflowState } from '@/types/workflow';

interface WorkflowVisualizerProps {
  workflow: WorkflowDefinition;
  /** Current state to highlight */
  currentState?: string;
}

const STATE_WIDTH = 120;
const STATE_HEIGHT = 40;
const H_GAP = 60;
const V_PADDING = 60;
const H_PADDING = 40;

const colorFills: Record<NonNullable<WorkflowState['color']>, string> = {
  default: '#f4f4f5',
  blue: '#dbeafe',
  green: '#dcfce7',
  yellow: '#fef9c3',
  red: '#fecaca',
  purple: '#f3e8ff',
};

const colorStrokes: Record<NonNullable<WorkflowState['color']>, string> = {
  default: '#a1a1aa',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  purple: '#a855f7',
};

export function WorkflowVisualizer({ workflow, currentState }: WorkflowVisualizerProps) {
  const layout = useMemo(() => {
    const stateCount = workflow.states.length;
    const totalWidth = stateCount * STATE_WIDTH + (stateCount - 1) * H_GAP + H_PADDING * 2;
    const totalHeight = STATE_HEIGHT + V_PADDING * 2 + 40; // extra for labels

    const positions = new Map<string, { x: number; y: number }>();
    workflow.states.forEach((state, i) => {
      positions.set(state.name, {
        x: H_PADDING + i * (STATE_WIDTH + H_GAP),
        y: V_PADDING,
      });
    });

    return { totalWidth, totalHeight, positions };
  }, [workflow.states]);

  const { totalWidth, totalHeight, positions } = layout;

  return (
    <Card data-testid="workflow-visualizer">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{workflow.label}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <svg
          width={totalWidth}
          height={totalHeight}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          role="img"
          aria-label={`Workflow diagram for ${workflow.label}`}
        >
          {/* Transitions (arrows) */}
          {workflow.transitions.map((t) => {
            const fromPos = positions.get(t.from);
            const toPos = positions.get(t.to);
            if (!fromPos || !toPos) return null;

            const x1 = fromPos.x + STATE_WIDTH;
            const y1 = fromPos.y + STATE_HEIGHT / 2;
            const x2 = toPos.x;
            const y2 = toPos.y + STATE_HEIGHT / 2;

            // If going backwards, curve above
            const isBackward = x2 < x1;
            const midX = (x1 + x2) / 2;
            const midY = isBackward ? y1 - 50 : (y1 + y2) / 2;

            return (
              <g key={t.name}>
                <path
                  d={
                    isBackward
                      ? `M ${x1} ${y1} Q ${x1 + 20} ${midY}, ${midX} ${midY} Q ${x2 - 20} ${midY}, ${x2} ${y2}`
                      : `M ${x1} ${y1} L ${x2} ${y2}`
                  }
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                />
                {/* Transition label */}
                <text
                  x={midX}
                  y={isBackward ? midY - 6 : midY - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={9}
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>

          {/* States (boxes) */}
          {workflow.states.map((state) => {
            const pos = positions.get(state.name);
            if (!pos) return null;
            const isActive = state.name === currentState;
            const fill = colorFills[state.color ?? 'default'];
            const stroke = colorStrokes[state.color ?? 'default'];

            return (
              <g key={state.name}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={STATE_WIDTH}
                  height={STATE_HEIGHT}
                  rx={state.initial || state.final ? 20 : 6}
                  fill={fill}
                  stroke={isActive ? stroke : '#d4d4d8'}
                  strokeWidth={isActive ? 2.5 : 1}
                />
                <text
                  x={pos.x + STATE_WIDTH / 2}
                  y={pos.y + STATE_HEIGHT / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={isActive ? 600 : 400}
                  className="fill-foreground"
                >
                  {state.label}
                </text>
                {/* Initial/Final indicators */}
                {state.initial && (
                  <text
                    x={pos.x + STATE_WIDTH / 2}
                    y={pos.y - 6}
                    textAnchor="middle"
                    fontSize={8}
                    className="fill-muted-foreground"
                  >
                    ● Start
                  </text>
                )}
                {state.final && (
                  <text
                    x={pos.x + STATE_WIDTH / 2}
                    y={pos.y + STATE_HEIGHT + 14}
                    textAnchor="middle"
                    fontSize={8}
                    className="fill-muted-foreground"
                  >
                    ◉ End
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
