import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import NodeConfigPanel from './components/NodeConfigPanel';
import Console from './components/Console';
import HistoryDashboard from './components/HistoryDashboard';
import type { Node, Connection, RunHistoryItem, NodeType, NodePin } from './types';
import { executeWorkflow } from './utils/flowRunner';
import type { ConsoleLog } from './utils/flowRunner';
import { 
  Play, 
  Terminal as ConsoleIcon, 
  BarChart3, 
  Sparkles,
  Lock
} from 'lucide-react';
import './App.css';

// Default initial state matching Research Preset
const initialResearchNodes: Node[] = [
  {
    id: 'node-input-1',
    type: 'input',
    x: 80,
    y: 160,
    title: 'Research Topic Input',
    data: {
      inputValue: 'Multi-agent AI workflows in production',
      status: 'idle',
    },
    inputs: [],
    outputs: [{ id: 'output', name: 'output', type: 'string' }]
  },
  {
    id: 'node-search-1',
    type: 'search',
    x: 400,
    y: 80,
    title: 'Web Index Retriever',
    data: {
      searchQuery: '',
      maxResults: 3,
      status: 'idle',
    },
    inputs: [{ id: 'query', name: 'query', type: 'string' }],
    outputs: [{ id: 'results', name: 'results', type: 'string' }]
  },
  {
    id: 'node-llm-1',
    type: 'llm',
    x: 720,
    y: 190,
    title: 'Gemini Research Agent',
    data: {
      model: 'gemini-1.5-flash',
      promptTemplate: 'Write a detailed summary about {{topic}}.\n\nSupport your analysis using these web results:\n{{web_results}}\n\nKeep it structured.',
      temperature: 0.7,
      status: 'idle',
    },
    inputs: [
      { id: 'pin-topic', name: 'topic', type: 'string' },
      { id: 'pin-web_results', name: 'web_results', type: 'string' }
    ],
    outputs: [{ id: 'response', name: 'response', type: 'string' }]
  },
  {
    id: 'node-output-1',
    type: 'output',
    x: 1040,
    y: 230,
    title: 'Research Compilation',
    data: {
      status: 'idle',
    },
    inputs: [{ id: 'input_data', name: 'input_data', type: 'any' }],
    outputs: []
  }
];

const initialResearchConnections: Connection[] = [
  {
    id: 'conn-1',
    sourceId: 'node-input-1',
    sourcePin: 'output',
    targetId: 'node-search-1',
    targetPin: 'query'
  },
  {
    id: 'conn-2',
    sourceId: 'node-input-1',
    sourcePin: 'output',
    targetId: 'node-llm-1',
    targetPin: 'pin-topic'
  },
  {
    id: 'conn-3',
    sourceId: 'node-search-1',
    sourcePin: 'results',
    targetId: 'node-llm-1',
    targetPin: 'pin-web_results'
  },
  {
    id: 'conn-4',
    sourceId: 'node-llm-1',
    sourcePin: 'response',
    targetId: 'node-output-1',
    targetPin: 'input_data'
  }
];

export const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialResearchNodes);
  const [connections, setConnections] = useState<Connection[]>(initialResearchConnections);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // App layouts
  const [bottomTab, setBottomTab] = useState<'console' | 'dashboard'>('console');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  
  // Run states
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);

  // Load API Key and History from LocalStorage
  useEffect(() => {
    const key = localStorage.getItem('novaflow_gemini_key') || '';
    setGeminiApiKey(key);

    const savedHistory = localStorage.getItem('novaflow_run_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse run history', e);
      }
    }
  }, []);

  const handleApiKeyChange = (val: string) => {
    setGeminiApiKey(val);
    localStorage.setItem('novaflow_gemini_key', val);
  };

  const handleAddNode = (type: NodeType) => {
    const id = `node-${type}-${Date.now()}`;
    const x = 300 + Math.random() * 80;
    const y = 150 + Math.random() * 80;
    
    let title = '';
    let inputs: NodePin[] = [];
    let outputs: NodePin[] = [];
    let defaultData: Node['data'] = { status: 'idle' };

    switch (type) {
      case 'input':
        title = 'User Input Block';
        outputs = [{ id: 'output', name: 'output', type: 'string' }];
        defaultData.inputValue = 'Sample input text';
        break;
      case 'llm':
        title = 'LLM Reasoning Node';
        inputs = [{ id: 'pin-prompt_input', name: 'prompt_input', type: 'string' }];
        outputs = [{ id: 'response', name: 'response', type: 'string' }];
        defaultData.model = 'gemini-1.5-flash';
        defaultData.promptTemplate = 'Process this input: {{prompt_input}}';
        defaultData.temperature = 0.7;
        break;
      case 'search':
        title = 'Search Agent';
        inputs = [{ id: 'query', name: 'query', type: 'string' }];
        outputs = [{ id: 'results', name: 'results', type: 'string' }];
        defaultData.searchQuery = '';
        defaultData.maxResults = 3;
        break;
      case 'code':
        title = 'JS Sandbox script';
        inputs = [{ id: 'input_text', name: 'input_text', type: 'string' }];
        outputs = [{ id: 'output', name: 'output', type: 'any' }];
        defaultData.code = 'return inputs.input_text.toUpperCase();';
        break;
      case 'condition':
        title = 'Routing Router';
        inputs = [{ id: 'input_data', name: 'input_data', type: 'any' }];
        outputs = [
          { id: 'true', name: 'true', type: 'any' },
          { id: 'false', name: 'false', type: 'any' }
        ];
        defaultData.conditionOperator = 'equals';
        defaultData.conditionValue = 'POSITIVE';
        break;
      case 'output':
        title = 'Response Collector';
        inputs = [{ id: 'input_data', name: 'input_data', type: 'any' }];
        break;
    }

    const newNode: Node = {
      id,
      type,
      x,
      y,
      title,
      data: defaultData,
      inputs,
      outputs
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(id);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    // Clean connections tied to deleted node
    setConnections(connections.filter(c => c.sourceId !== nodeId && c.targetId !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleUpdateNodeData = (nodeId: string, dataUpdates: Partial<Node['data']>, newInputs?: NodePin[]) => {
    setNodes(nodes.map(node => {
      if (node.id === nodeId) {
        const updatedNode = {
          ...node,
          data: { ...node.data, ...dataUpdates },
          inputs: newInputs !== undefined ? newInputs : node.inputs
        };

        // If inputs changed, discard orphan connections pointing to removed input pins
        if (newInputs !== undefined) {
          const validPinIds = new Set(newInputs.map(p => p.id));
          setConnections(prevConn => prevConn.filter(c => 
            c.targetId !== nodeId || validPinIds.has(c.targetPin)
          ));
        }

        return updatedNode;
      }
      return node;
    }));
  };

  const handleClearWorkspace = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
  };

  const handleLoadPreset = (preset: 'research' | 'sentiment' | 'linter') => {
    handleClearWorkspace();

    if (preset === 'research') {
      setNodes(initialResearchNodes);
      setConnections(initialResearchConnections);
    } else if (preset === 'sentiment') {
      const sentimentNodes: Node[] = [
        {
          id: 'node-in',
          type: 'input',
          x: 80,
          y: 220,
          title: 'Review Input Data',
          data: {
            inputValue: 'The workflow execution was extremely smooth and successful. Clean compiles verified.',
            status: 'idle'
          },
          inputs: [],
          outputs: [{ id: 'output', name: 'output', type: 'string' }]
        },
        {
          id: 'node-llm',
          type: 'llm',
          x: 400,
          y: 120,
          title: 'Sentiment Classifier Agent',
          data: {
            model: 'gemini-1.5-flash',
            promptTemplate: 'Analyze the sentiment of this text: {{review}}\n\nRespond ONLY with either POSITIVE or NEGATIVE.',
            temperature: 0.2,
            status: 'idle'
          },
          inputs: [{ id: 'pin-review', name: 'review', type: 'string' }],
          outputs: [{ id: 'response', name: 'response', type: 'string' }]
        },
        {
          id: 'node-gate',
          type: 'condition',
          x: 720,
          y: 220,
          title: 'Gate Selector',
          data: {
            conditionOperator: 'contains',
            conditionValue: 'POSITIVE',
            status: 'idle'
          },
          inputs: [{ id: 'input_data', name: 'input_data', type: 'any' }],
          outputs: [
            { id: 'true', name: 'true', type: 'any' },
            { id: 'false', name: 'false', type: 'any' }
          ]
        },
        {
          id: 'node-positive-out',
          type: 'output',
          x: 1040,
          y: 90,
          title: 'Positive Channel Sink',
          data: { status: 'idle' },
          inputs: [{ id: 'input_data', name: 'input_data', type: 'any' }],
          outputs: []
        },
        {
          id: 'node-negative-out',
          type: 'output',
          x: 1040,
          y: 350,
          title: 'Negative Channel Sink',
          data: { status: 'idle' },
          inputs: [{ id: 'input_data', name: 'input_data', type: 'any' }],
          outputs: []
        }
      ];

      const sentimentConnections: Connection[] = [
        { id: 'c1', sourceId: 'node-in', sourcePin: 'output', targetId: 'node-llm', targetPin: 'pin-review' },
        { id: 'c2', sourceId: 'node-llm', sourcePin: 'response', targetId: 'node-gate', targetPin: 'input_data' },
        { id: 'c3', sourceId: 'node-gate', sourcePin: 'true', targetId: 'node-positive-out', targetPin: 'input_data' },
        { id: 'c4', sourceId: 'node-gate', sourcePin: 'false', targetId: 'node-negative-out', targetPin: 'input_data' }
      ];

      setNodes(sentimentNodes);
      setConnections(sentimentConnections);
    } else if (preset === 'linter') {
      const linterNodes: Node[] = [
        {
          id: 'node-code-in',
          type: 'input',
          x: 80,
          y: 160,
          title: 'Raw JS Script',
          data: {
            inputValue: 'function calcCost(tokens){\n  var c=tokens * 0.00002;\n  return c\n}',
            status: 'idle'
          },
          inputs: [],
          outputs: [{ id: 'output', name: 'output', type: 'string' }]
        },
        {
          id: 'node-llm-lint',
          type: 'llm',
          x: 400,
          y: 120,
          title: 'Review Agent',
          data: {
            model: 'gemini-1.5-flash',
            promptTemplate: 'Analyze this code for styling standards: {{code}}\n\nSuggest ES6 modernizations and clean formatting.',
            temperature: 0.5,
            status: 'idle'
          },
          inputs: [{ id: 'pin-code', name: 'code', type: 'string' }],
          outputs: [{ id: 'response', name: 'response', type: 'string' }]
        },
        {
          id: 'node-llm-optimize',
          type: 'llm',
          x: 720,
          y: 180,
          title: 'Refactor Agent',
          data: {
            model: 'gemini-1.5-flash',
            promptTemplate: 'Take these reviews:\n{{lint_reviews}}\n\nOptimize the code and return only the optimized refactored function.',
            temperature: 0.4,
            status: 'idle'
          },
          inputs: [{ id: 'pin-lint_reviews', name: 'lint_reviews', type: 'string' }],
          outputs: [{ id: 'response', name: 'response', type: 'string' }]
        },
        {
          id: 'node-linter-out',
          type: 'output',
          x: 1040,
          y: 220,
          title: 'Refactoring output',
          data: { status: 'idle' },
          inputs: [{ id: 'input_data', name: 'input_data', type: 'any' }],
          outputs: []
        }
      ];

      const linterConnections: Connection[] = [
        { id: 'cl1', sourceId: 'node-code-in', sourcePin: 'output', targetId: 'node-llm-lint', targetPin: 'pin-code' },
        { id: 'cl2', sourceId: 'node-llm-lint', sourcePin: 'response', targetId: 'node-llm-optimize', targetPin: 'pin-lint_reviews' },
        { id: 'cl3', sourceId: 'node-llm-optimize', sourcePin: 'response', targetId: 'node-linter-out', targetPin: 'input_data' }
      ];

      setNodes(linterNodes);
      setConnections(linterConnections);
    }
  };

  const handleRunWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setLogs([]);
    setBottomTab('console');

    // Reset all nodes state to idle/pending clean
    setNodes(prev => prev.map(n => ({
      ...n,
      data: { ...n.data, status: 'idle', error: undefined, outputData: undefined }
    })));

    try {
      const result = await executeWorkflow(
        nodes,
        connections,
        geminiApiKey || null,
        // Node state updates callback
        (nodeId, updates) => {
          setExecutingNodeId(updates.status === 'pending' ? nodeId : null);
          setNodes(currentNodes => currentNodes.map(n => {
            if (n.id === nodeId) {
              return { ...n, data: { ...n.data, ...updates } };
            }
            return n;
          }));
        },
        // Log streams callback
        (log) => {
          setLogs(prevLogs => [...prevLogs, log]);
        }
      );

      // Log execution results into history
      const costPerToken = 0.000015; // mock rate
      const estCost = result.tokens * costPerToken;
      
      const newHistoryItem: RunHistoryItem = {
        id: `run-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        status: result.success ? 'success' : 'failed',
        duration: result.duration,
        nodesCount: result.nodesCount,
        tokensCount: result.tokens,
        estimatedCost: estCost
      };

      const updatedHistory = [...history, newHistoryItem];
      setHistory(updatedHistory);
      localStorage.setItem('novaflow_run_history', JSON.stringify(updatedHistory));

    } catch (e: any) {
      console.error('Workflow running error: ', e);
    } finally {
      setIsExecuting(false);
      setExecutingNodeId(null);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="app-grid-container">
      {/* Side inventory bar */}
      <Sidebar 
        onAddNode={handleAddNode}
        onLoadPreset={handleLoadPreset}
        onClearCanvas={handleClearWorkspace}
      />

      {/* Main viewport workflow area */}
      <main className="main-viewport-container">
        {/* Top Control Bar */}
        <header className="top-control-bar glass-panel">
          <div className="brand-logo-row">
            <Sparkles className="logo-spark" size={16} />
            <span className="control-bar-title">Node Canvas Workspace</span>
          </div>

          <div className="control-bar-actions">
            {/* API Key configuration */}
            <div className="api-key-input-wrapper">
              <Lock size={13} className="key-icon" />
              <input
                type="password"
                className="api-key-textbox"
                placeholder="Paste Gemini API Key (Optional)..."
                value={geminiApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
              />
              <span className="api-tip-badge" title="If empty, NovaFlow will use ultra-realistic prompt simulation.">
                MOCK
              </span>
            </div>

            <span className="control-bar-divider">|</span>

            {/* Workflow trigger */}
            <button 
              className={`run-workflow-btn ${isExecuting ? 'running' : ''}`}
              onClick={handleRunWorkflow}
              disabled={isExecuting}
            >
              <Play size={13} fill="currentColor" />
              <span>{isExecuting ? 'Executing...' : 'Run Pipeline'}</span>
            </button>
          </div>
        </header>

        {/* The Node Canvas */}
        <div className="canvas-container-box">
          <Canvas
            nodes={nodes}
            connections={connections}
            selectedNodeId={selectedNodeId}
            executingNodeId={executingNodeId}
            onUpdateNodes={setNodes}
            onUpdateConnections={setConnections}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {/* Bottom tab Console / Analytics pane */}
        <section className="bottom-pane-container">
          <div className="bottom-pane-tabs">
            <button 
              className={`pane-tab-btn ${bottomTab === 'console' ? 'active' : ''}`}
              onClick={() => setBottomTab('console')}
            >
              <ConsoleIcon size={13} />
              <span>Console Log</span>
            </button>
            <button 
              className={`pane-tab-btn ${bottomTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setBottomTab('dashboard')}
            >
              <BarChart3 size={13} />
              <span>Pipeline Analytics</span>
            </button>
          </div>
          
          <div className="bottom-pane-viewport">
            {bottomTab === 'console' ? (
              <Console 
                logs={logs}
                onClearLogs={() => setLogs([])}
              />
            ) : (
              <HistoryDashboard 
                history={history}
              />
            )}
          </div>
        </section>
      </main>

      {/* Side node properties configurations panel */}
      <NodeConfigPanel 
        selectedNode={selectedNode}
        onUpdateNodeData={handleUpdateNodeData}
        onDeleteNode={handleDeleteNode}
      />
    </div>
  );
};
export default App;
