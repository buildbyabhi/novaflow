import React from 'react';
import type { Node, Connection } from '../types';

interface SVGConnectionsProps {
  connections: Connection[];
  nodes: Node[];
  onRemoveConnection: (id: string) => void;
  activeConnection: {
    sourceId: string;
    sourcePin: string;
    mouseX: number;
    mouseY: number;
  } | null;
  executingNodeId: string | null;
}

export const getPinCoordinates = (node: Node, pinId: string, pinType: 'input' | 'output') => {
  const nodeWidth = 240; // width of node cards in CSS
  const pinSpacing = 32; // height + spacing of pin items
  const headerHeight = 52; // node title area
  const paddingOffset = 18; // offset from top of pin list

  if (pinType === 'input') {
    const idx = node.inputs.findIndex((p) => p.id === pinId);
    return {
      x: node.x,
      y: node.y + headerHeight + paddingOffset + (idx >= 0 ? idx : 0) * pinSpacing,
    };
  } else {
    const idx = node.outputs.findIndex((p) => p.id === pinId);
    return {
      x: node.x + nodeWidth,
      y: node.y + headerHeight + paddingOffset + (idx >= 0 ? idx : 0) * pinSpacing,
    };
  }
};

export const SVGConnections: React.FC<SVGConnectionsProps> = ({
  connections,
  nodes,
  onRemoveConnection,
  activeConnection,
  executingNodeId,
}) => {
  const drawBezier = (x1: number, y1: number, x2: number, y2: number) => {
    // Control points offset
    const dx = Math.abs(x2 - x1) * 0.4;
    const cx1 = x1 + dx;
    const cy1 = y1;
    const cx2 = x2 - dx;
    const cy2 = y2;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Define glowing neon filters */}
      <defs>
        <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-violet" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Render active connection trails */}
      {connections.map((conn) => {
        const sourceNode = nodes.find((n) => n.id === conn.sourceId);
        const targetNode = nodes.find((n) => n.id === conn.targetId);

        if (!sourceNode || !targetNode) return null;

        const start = getPinCoordinates(sourceNode, conn.sourcePin, 'output');
        const end = getPinCoordinates(targetNode, conn.targetPin, 'input');

        // Check if connection is active in the executing path
        const isFlowing = executingNodeId === sourceNode.id || executingNodeId === targetNode.id;

        return (
          <g key={conn.id} style={{ pointerEvents: 'all', cursor: 'pointer' }}>
            {/* Wider transparent background path for easy clicking / deletion */}
            <path
              d={drawBezier(start.x, start.y, end.x, end.y)}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveConnection(conn.id);
              }}
            />
            {/* The visual connection curve */}
            <path
              d={drawBezier(start.x, start.y, end.x, end.y)}
              fill="none"
              stroke={isFlowing ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.22)'}
              strokeWidth={2}
              style={{
                transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                filter: isFlowing ? 'url(#glow-cyan)' : 'none',
              }}
            />
            {/* Animated dotted flow overlay when workflow runs */}
            {isFlowing && (
              <path
                d={drawBezier(start.x, start.y, end.x, end.y)}
                fill="none"
                stroke="var(--color-cyan)"
                strokeWidth={2}
                strokeDasharray="6, 6"
                style={{
                  animation: 'flow-dash 0.8s linear infinite',
                }}
              />
            )}
          </g>
        );
      })}

      {/* Render dragging connector line */}
      {activeConnection && (() => {
        const sourceNode = nodes.find((n) => n.id === activeConnection.sourceId);
        if (!sourceNode) return null;

        const start = getPinCoordinates(sourceNode, activeConnection.sourcePin, 'output');
        return (
          <path
            d={drawBezier(start.x, start.y, activeConnection.mouseX, activeConnection.mouseY)}
            fill="none"
            stroke="var(--color-cyan)"
            strokeWidth={2}
            strokeDasharray="4, 4"
            style={{
              filter: 'url(#glow-cyan)',
              opacity: 0.8,
            }}
          />
        );
      })()}
    </svg>
  );
};
