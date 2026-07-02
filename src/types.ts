export type NodeType = 'input' | 'llm' | 'search' | 'code' | 'condition' | 'output';

export interface NodePin {
  id: string;
  name: string;
  type: 'string' | 'any' | 'boolean';
}

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  title: string;
  data: {
    // Input node
    inputValue?: string;
    
    // LLM node
    model?: string;
    promptTemplate?: string;
    temperature?: number;
    
    // Search node
    searchQuery?: string;
    maxResults?: number;
    
    // Code node
    code?: string;
    
    // Condition node
    conditionOperator?: 'equals' | 'contains' | 'greater_than' | 'less_than';
    conditionValue?: string;
    
    // Output node
    outputValue?: any;
    
    // Execution metadata (dynamic)
    status?: 'idle' | 'pending' | 'completed' | 'failed';
    error?: string;
    outputData?: any;
    executionTime?: number;
    logs?: string[];
  };
  inputs: NodePin[];
  outputs: NodePin[];
}

export interface Connection {
  id: string;
  sourceId: string;
  sourcePin: string;
  targetId: string;
  targetPin: string;
}

export interface RunHistoryItem {
  id: string;
  timestamp: string;
  status: 'success' | 'failed';
  duration: number; // total duration in ms
  nodesCount: number;
  tokensCount: number;
  estimatedCost: number; // USD
}
