import React from 'react';
import type { NodeType } from '../types';
import { 
  FileText, 
  Cpu, 
  Search, 
  Terminal, 
  GitBranch, 
  CheckCircle,
  Layers,
  Flame,
  Wand2
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  onAddNode: (type: NodeType) => void;
  onLoadPreset: (preset: 'research' | 'sentiment' | 'linter') => void;
  onClearCanvas: () => void;
}

const nodeTypes = [
  {
    type: 'input' as NodeType,
    title: 'User Input',
    desc: 'Entry point for raw text values',
    icon: <FileText size={18} className="sidebar-icon" />,
    color: 'var(--color-green)'
  },
  {
    type: 'llm' as NodeType,
    title: 'LLM Agent',
    desc: 'Bespoke LLM pipeline with prompt templates',
    icon: <Cpu size={18} className="sidebar-icon" />,
    color: 'var(--color-cyan)'
  },
  {
    type: 'search' as NodeType,
    title: 'Web Search',
    desc: 'Simulated web search groundings',
    icon: <Search size={18} className="sidebar-icon" />,
    color: 'var(--color-gold)'
  },
  {
    type: 'code' as NodeType,
    title: 'JS Sandbox',
    desc: 'JavaScript processor node',
    icon: <Terminal size={18} className="sidebar-icon" />,
    color: 'var(--color-magenta)'
  },
  {
    type: 'condition' as NodeType,
    title: 'Condition Gate',
    desc: 'If/Else operator routing control',
    icon: <GitBranch size={18} className="sidebar-icon" />,
    color: 'var(--color-violet)'
  },
  {
    type: 'output' as NodeType,
    title: 'Final Output',
    desc: 'Collects and displays results',
    icon: <CheckCircle size={18} className="sidebar-icon" />,
    color: 'var(--color-blue)'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  onAddNode,
  onLoadPreset,
  onClearCanvas
}) => {
  return (
    <aside className="sidebar-container glass-panel">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <Flame className="brand-icon" size={24} />
        <div className="brand-text-container">
          <span className="brand-title">NovaFlow</span>
          <span className="brand-subtitle">Orchestrator v1.0</span>
        </div>
      </div>

      {/* Nodes section */}
      <div className="sidebar-section">
        <div className="section-header">
          <Layers size={14} />
          <span>WORKFLOW NODES</span>
        </div>
        <div className="node-cards-grid">
          {nodeTypes.map((n) => (
            <button
              key={n.type}
              className="sidebar-node-card glass-panel-hover"
              onClick={() => onAddNode(n.type)}
              style={{ '--card-accent': n.color } as React.CSSProperties}
            >
              <div className="sidebar-card-header">
                {n.icon}
                <span className="sidebar-card-title">{n.title}</span>
              </div>
              <p className="sidebar-card-desc">{n.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Presets section */}
      <div className="sidebar-section">
        <div className="section-header">
          <Wand2 size={14} />
          <span>PRESET TEMPLATES</span>
        </div>
        <div className="presets-list">
          <button 
            className="sidebar-preset-btn preset-research glass-panel-hover"
            onClick={() => onLoadPreset('research')}
          >
            <span className="preset-accent-bar research"></span>
            <div className="preset-info">
              <span className="preset-title">AI Research Assistant</span>
              <span className="preset-subtitle">Input ➜ Search ➜ LLM ➜ Output</span>
            </div>
          </button>
          
          <button 
            className="sidebar-preset-btn preset-sentiment glass-panel-hover"
            onClick={() => onLoadPreset('sentiment')}
          >
            <span className="preset-accent-bar sentiment"></span>
            <div className="preset-info">
              <span className="preset-title">Sentiment Router</span>
              <span className="preset-subtitle">Input ➜ Rewrite ➜ If/Else ➜ Splits</span>
            </div>
          </button>

          <button 
            className="sidebar-preset-btn preset-linter glass-panel-hover"
            onClick={() => onLoadPreset('linter')}
          >
            <span className="preset-accent-bar linter"></span>
            <div className="preset-info">
              <span className="preset-title">Agentic Code Optimizer</span>
              <span className="preset-subtitle">Input ➜ Linter ➜ Optimizer ➜ Result</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer controls */}
      <div className="sidebar-footer">
        <button className="clear-canvas-btn" onClick={onClearCanvas}>
          Clear Workspace
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
