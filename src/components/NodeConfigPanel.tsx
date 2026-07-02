import React, { useEffect, useState } from 'react';
import type { Node, NodePin } from '../types';
import { Copy, Check, Info, Settings2, Code } from 'lucide-react';
import './NodeConfigPanel.css';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onUpdateNodeData: (nodeId: string, data: Partial<Node['data']>, inputs?: NodePin[]) => void;
  onDeleteNode: (nodeId: string) => void;
}

const parsePromptVariables = (template: string): string[] => {
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    const varName = match[1];
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }
  return variables;
};

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onUpdateNodeData,
  onDeleteNode
}) => {
  const [copied, setCopied] = useState(false);
  const [promptVal, setPromptVal] = useState('');

  useEffect(() => {
    if (selectedNode?.type === 'llm') {
      setPromptVal(selectedNode.data.promptTemplate || '');
    }
  }, [selectedNode?.id]);

  if (!selectedNode) {
    return (
      <aside className="config-panel-container glass-panel empty-state">
        <Settings2 size={36} className="config-empty-icon" />
        <span className="config-empty-title">Properties Panel</span>
        <p className="config-empty-desc">Select any node on the workspace canvas to configure its settings and parameters.</p>
      </aside>
    );
  }

  const handleDataChange = (field: keyof Node['data'], value: any) => {
    onUpdateNodeData(selectedNode.id, { [field]: value });
  };

  const handlePromptTemplateChange = (val: string) => {
    setPromptVal(val);
    
    // Parse variables and manifest pins
    const variables = parsePromptVariables(val);
    const newInputs: NodePin[] = variables.map(v => ({
      id: `pin-${v}`,
      name: v,
      type: 'string'
    }));

    onUpdateNodeData(selectedNode.id, { promptTemplate: val }, newInputs);
  };

  const handleCopyOutput = () => {
    const textToCopy = selectedNode.data.outputData?.final_value || selectedNode.data.outputData?.response || selectedNode.data.outputValue || '';
    if (!textToCopy) return;

    navigator.clipboard.writeText(String(textToCopy));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderConfigFields = () => {
    switch (selectedNode.type) {
      case 'input':
        return (
          <div className="config-group">
            <label className="config-label">Workflow Input Text</label>
            <textarea
              className="config-textarea"
              placeholder="Enter text or dataset that will trigger the starting nodes..."
              value={selectedNode.data.inputValue || ''}
              onChange={(e) => handleDataChange('inputValue', e.target.value)}
              rows={6}
            />
          </div>
        );

      case 'llm':
        return (
          <div className="config-group">
            <label className="config-label">Agent Model</label>
            <select
              className="config-select"
              value={selectedNode.data.model || 'gemini-1.5-flash'}
              onChange={(e) => handleDataChange('model', e.target.value)}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gpt-4o">GPT-4o (Simulated)</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Simulated)</option>
            </select>

            <div className="config-slider-group">
              <div className="slider-label-row">
                <label className="config-label">Temperature</label>
                <span className="slider-value">{selectedNode.data.temperature ?? 0.7}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                className="config-slider"
                value={selectedNode.data.temperature ?? 0.7}
                onChange={(e) => handleDataChange('temperature', parseFloat(e.target.value))}
              />
            </div>

            <label className="config-label">Prompt Template</label>
            <textarea
              className="config-textarea code-editor-font"
              placeholder="e.g. Translate the following text to Spanish: {{text}}"
              value={promptVal}
              onChange={(e) => handlePromptTemplateChange(e.target.value)}
              rows={8}
            />
            
            <div className="config-tip">
              <Info size={14} className="tip-icon" />
              <span>Use <code>{"{{var}}"}</code> tags to automatically generate input pins. Connect upstream outputs to inject values!</span>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="config-group">
            <label className="config-label">Search Query (Fallback)</label>
            <input
              type="text"
              className="config-input"
              placeholder="e.g. React hooks optimization"
              value={selectedNode.data.searchQuery || ''}
              onChange={(e) => handleDataChange('searchQuery', e.target.value)}
            />
            <div className="config-tip">
              <Info size={14} className="tip-icon" />
              <span>If the <code>query</code> input pin is connected, it takes precedence over this static fallback.</span>
            </div>

            <label className="config-label">Max Results</label>
            <input
              type="number"
              min="1"
              max="10"
              className="config-input"
              value={selectedNode.data.maxResults || 3}
              onChange={(e) => handleDataChange('maxResults', parseInt(e.target.value) || 3)}
            />
          </div>
        );

      case 'code':
        return (
          <div className="config-group">
            <div className="config-header-row">
              <label className="config-label">JS Script Sandbox</label>
              <Code size={14} className="config-icon-label" />
            </div>
            <textarea
              className="config-textarea code-editor-font"
              placeholder="// inputs.input_text holds incoming connection data&#10;return inputs.input_text.toUpperCase();"
              value={selectedNode.data.code || ''}
              onChange={(e) => handleDataChange('code', e.target.value)}
              rows={12}
            />
            <div className="config-tip">
              <Info size={14} className="tip-icon" />
              <span>Available input bindings can be referenced under the <code>inputs</code> object. Always <code>return</code> a result.</span>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="config-group">
            <label className="config-label">Logical Operator</label>
            <select
              className="config-select"
              value={selectedNode.data.conditionOperator || 'equals'}
              onChange={(e) => handleDataChange('conditionOperator', e.target.value)}
            >
              <option value="equals">Equals (Case Insensitive)</option>
              <option value="contains">Contains Substring</option>
              <option value="greater_than">Greater Than (&gt;)</option>
              <option value="less_than">Less Than (&lt;)</option>
            </select>

            <label className="config-label">Comparison Value</label>
            <input
              type="text"
              className="config-input"
              placeholder="e.g. POSITIVE"
              value={selectedNode.data.conditionValue || ''}
              onChange={(e) => handleDataChange('conditionValue', e.target.value)}
            />
            <div className="config-tip">
              <Info size={14} className="tip-icon" />
              <span>Routs data along the <code>true</code> pin if criteria are met; otherwise routes along <code>false</code>.</span>
            </div>
          </div>
        );

      case 'output': {
        const outVal = selectedNode.data.outputData?.final_value || selectedNode.data.outputData?.response || selectedNode.data.outputValue || '';
        return (
          <div className="config-group">
            <div className="config-header-row">
              <label className="config-label">Result Data</label>
              {outVal && (
                <button className="copy-btn" onClick={handleCopyOutput}>
                  {copied ? <Check size={14} color="var(--color-green)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
            <textarea
              className="config-textarea readonly-textarea"
              readOnly
              placeholder="Data will display here once the workflow runs and reaches this node."
              value={outVal ? String(outVal) : ''}
              rows={12}
            />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <aside className="config-panel-container glass-panel">
      {/* Panel Header */}
      <div className="config-panel-header">
        <span className="config-panel-title">Node Configuration</span>
        <span className="config-node-type accent-text">{selectedNode.title}</span>
      </div>

      {/* Inputs Form */}
      <div className="config-panel-body">
        {renderConfigFields()}
      </div>

      {/* Delete action */}
      <div className="config-panel-footer">
        <button
          className="delete-node-btn"
          onClick={() => onDeleteNode(selectedNode.id)}
        >
          Remove Node
        </button>
      </div>
    </aside>
  );
};
export default NodeConfigPanel;
