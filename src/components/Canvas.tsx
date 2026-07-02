import React, { useState, useRef } from 'react';
import type { Node, Connection } from '../types';
import { Node as NodeComponent } from './Node';
import { SVGConnections } from './SVGConnections';
import './Canvas.css';

interface CanvasProps {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId: string | null;
  executingNodeId: string | null;
  onUpdateNodes: (nodes: Node[]) => void;
  onUpdateConnections: (connections: Connection[]) => void;
  onSelectNode: (nodeId: string | null) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  connections,
  selectedNodeId,
  executingNodeId,
  onUpdateNodes,
  onUpdateConnections,
  onSelectNode,
}) => {
  const [pan, setPan] = useState({ x: 100, y: 80 });
  const [zoom, setZoom] = useState(1.0);
  const [isPanning, setIsPanning] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  // Drag offsets
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const panStartOffset = useRef({ x: 0, y: 0 });
  
  // Connection line dragging state
  const [activeConnection, setActiveConnection] = useState<{
    sourceId: string;
    sourcePin: string;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Zooming Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;

    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 2.0); // max zoom 2x
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.4); // min zoom 0.4x
    }

    // Zoom towards cursor location
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust pan to zoom relative to cursor position
      setPan((prevPan) => ({
        x: mouseX - (mouseX - prevPan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prevPan.y) * (newZoom / zoom),
      }));
    }
    setZoom(newZoom);
  };

  // Convert client coordinate space to canvas coordinate space
  const clientToCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Mouse Down Event - Handles Canvas Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking on empty canvas background (or svg overlay)
    const target = e.target as HTMLElement;
    const isBackground = 
      target.classList.contains('canvas-grid-bg') || 
      target.tagName === 'svg' || 
      target.classList.contains('canvas-viewport');

    if (isBackground && (e.button === 0 || e.button === 1)) {
      setIsPanning(true);
      panStartOffset.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      onSelectNode(null); // deselect nodes when clicking empty canvas
    }
  };

  // Mouse Move Event - Node Dragging & Canvas Panning & Connection Drawing
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartOffset.current.x,
        y: e.clientY - panStartOffset.current.y,
      });
    } else if (draggingNodeId) {
      const coords = clientToCanvasCoords(e.clientX, e.clientY);
      // Grid snapping (snaps to multiples of 10)
      const snapGrid = (val: number) => Math.round(val / 10) * 10;
      
      onUpdateNodes(
        nodes.map((node) => {
          if (node.id === draggingNodeId) {
            return {
              ...node,
              x: snapGrid(coords.x - dragStartOffset.current.x),
              y: snapGrid(coords.y - dragStartOffset.current.y),
            };
          }
          return node;
        })
      );
    } else if (activeConnection) {
      const coords = clientToCanvasCoords(e.clientX, e.clientY);
      setActiveConnection({
        ...activeConnection,
        mouseX: coords.x,
        mouseY: coords.y,
      });
    }
  };

  // Mouse Up Event - Terminate actions
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setActiveConnection(null);
  };

  // Node Dragging Handlers
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const coords = clientToCanvasCoords(e.clientX, e.clientY);
    dragStartOffset.current = {
      x: coords.x - node.x,
      y: coords.y - node.y,
    };
    setDraggingNodeId(nodeId);
    onSelectNode(nodeId);
  };

  // Pin Connection Dragging Handlers
  const handlePinDragStart = (e: React.MouseEvent, nodeId: string, pinId: string) => {
    e.stopPropagation();
    const coords = clientToCanvasCoords(e.clientX, e.clientY);
    setActiveConnection({
      sourceId: nodeId,
      sourcePin: pinId,
      mouseX: coords.x,
      mouseY: coords.y,
    });
  };

  const handlePinDragEnd = (e: React.MouseEvent, nodeId: string, pinId: string) => {
    e.stopPropagation();
    if (activeConnection) {
      // Prevent connecting a node to itself
      if (activeConnection.sourceId === nodeId) {
        setActiveConnection(null);
        return;
      }

      // Check if connection already exists
      const exists = connections.some(
        (c) =>
          c.sourceId === activeConnection.sourceId &&
          c.sourcePin === activeConnection.sourcePin &&
          c.targetId === nodeId &&
          c.targetPin === pinId
      );

      if (!exists) {
        const newConnection: Connection = {
          id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sourceId: activeConnection.sourceId,
          sourcePin: activeConnection.sourcePin,
          targetId: nodeId,
          targetPin: pinId,
        };
        onUpdateConnections([...connections, newConnection]);
      }
    }
    setActiveConnection(null);
  };

  const handleRemoveConnection = (connId: string) => {
    onUpdateConnections(connections.filter((c) => c.id !== connId));
  };

  return (
    <div
      ref={canvasRef}
      className="canvas-viewport"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Dots Grid scrolling/scaling dynamically */}
      <div
        className="canvas-grid-bg"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
        }}
      ></div>

      {/* Interactive Transform Viewport */}
      <div
        className="canvas-content-wrapper"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Draw connections */}
        <SVGConnections
          connections={connections}
          nodes={nodes}
          onRemoveConnection={handleRemoveConnection}
          activeConnection={activeConnection}
          executingNodeId={executingNodeId}
        />

        {/* Draw node cards */}
        {nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isExecuting={executingNodeId === node.id}
            onSelect={(e) => {
              e.stopPropagation();
              onSelectNode(node.id);
            }}
            onDragStart={handleNodeDragStart}
            onPinDragStart={handlePinDragStart}
            onPinDragEnd={handlePinDragEnd}
          />
        ))}
      </div>

      {/* Canvas Help Overlay */}
      <div className="canvas-controls-legend glass-panel">
        <span>Scroll to Zoom</span>
        <span className="legend-separator">|</span>
        <span>Drag canvas to Pan</span>
        <span className="legend-separator">|</span>
        <span>Drag pins to Connect</span>
      </div>
    </div>
  );
};
export default Canvas;
