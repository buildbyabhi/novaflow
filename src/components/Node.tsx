import React, { useRef } from 'react';
import type { Node as NodeType } from '../types';
import { 
  Settings, 
  HelpCircle, 
  Search, 
  Terminal, 
  Split, 
  FileText, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import './Node.css';

interface NodeProps {
  node: NodeType;
  isSelected: boolean;
  isExecuting: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent, nodeId: string) => void;
  onPinDragStart: (e: React.MouseEvent, nodeId: string, pinId: string) => void;
  onPinDragEnd: (e: React.MouseEvent, nodeId: string, pinId: string) => void;
}

const getNodeIcon = (type: NodeType['type']) => {
  switch (type) {
    case 'input':
      return <FileText size={16} className="node-icon" />;
    case 'llm':
      return <Settings size={16} className="node-icon" />;
    case 'search':
      return <Search size={16} className="node-icon" />;
    case 'code':
      return <Terminal size={16} className="node-icon" />;
    case 'condition':
      return <Split size={16} className="node-icon" />;
    case 'output':
      return <CheckCircle2 size={16} className="node-icon" />;
    default:
      return <HelpCircle size={16} className="node-icon" />;
  }
};

export const Node: React.FC<NodeProps> = ({
  node,
  isSelected,
  isExecuting,
  onSelect,
  onDragStart,
  onPinDragStart,
  onPinDragEnd,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  // Styling class according to node type
  const nodeTypeClass = `accent-${node.type}`;

  const renderStatus = () => {
    switch (node.data.status) {
      case 'pending':
        return (
          <div className="status-indicator pending">
            <span className="spinner"></span>
            <span>Running...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="status-indicator completed">
            <CheckCircle2 size={12} color="var(--color-green)" />
            <span>Success ({node.data.executionTime || 0}ms)</span>
          </div>
        );
      case 'failed':
        return (
          <div className="status-indicator failed">
            <AlertCircle size={12} color="var(--color-red)" />
            <span>Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getPreviewText = () => {
    switch (node.type) {
      case 'input':
        return node.data.inputValue 
          ? `"${node.data.inputValue.substring(0, 36)}${node.data.inputValue.length > 36 ? '...' : ''}"` 
          : 'Empty Input';
      case 'llm':
        return node.data.model || 'gemini-1.5-flash';
      case 'search':
        return node.data.searchQuery 
          ? `Query: "${node.data.searchQuery.substring(0, 24)}"` 
          : 'Query Pin';
      case 'code':
        return 'JS Script sandbox';
      case 'condition':
        return `IF value ${node.data.conditionOperator} "${node.data.conditionValue}"`;
      case 'output': {
        const val = node.data.outputData?.final_value || '';
        return val 
          ? `Length: ${String(val).length} chars` 
          : 'No data received';
      }
      default:
        return '';
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`node-card glass-panel ${isSelected ? 'selected' : ''} ${isExecuting ? 'executing' : ''} ${nodeTypeClass}`}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
      }}
      onClick={onSelect}
    >
      {/* Node Header */}
      <div 
        className="node-header" 
        onMouseDown={(e) => onDragStart(e, node.id)}
      >
        <div className="header-title-container">
          {getNodeIcon(node.type)}
          <span className="header-title">{node.title}</span>
        </div>
        <div className="header-accent-dot"></div>
      </div>

      {/* Node Content / Preview */}
      <div className="node-body">
        <div className="node-preview">{getPreviewText()}</div>
        {renderStatus()}
      </div>

      {/* Pins Layout */}
      <div className="node-pins-container">
        {/* Input Pins (Left Column) */}
        <div className="pins-column input-pins">
          {node.inputs.map((pin) => (
            <div key={pin.id} className="pin-item input-pin-item">
              <div
                className="pin-circle pin-input"
                onMouseUp={(e) => onPinDragEnd(e, node.id, pin.id)}
                title={`Input: ${pin.name}`}
              ></div>
              <span className="pin-label">{pin.name}</span>
            </div>
          ))}
        </div>

        {/* Output Pins (Right Column) */}
        <div className="pins-column output-pins">
          {node.outputs.map((pin) => (
            <div key={pin.id} className="pin-item output-pin-item">
              <span className="pin-label">{pin.name}</span>
              <div
                className="pin-circle pin-output"
                onMouseDown={(e) => onPinDragStart(e, node.id, pin.id)}
                title={`Output: ${pin.name}`}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {node.data.error && (
        <div className="node-error-message">
          {node.data.error}
        </div>
      )}
    </div>
  );
};
