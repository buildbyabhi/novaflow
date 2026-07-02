import React, { useEffect, useRef, useState } from 'react';
import type { ConsoleLog } from '../utils/flowRunner';
import { Trash2, ShieldAlert, Sparkles, Terminal } from 'lucide-react';
import './Console.css';

interface ConsoleProps {
  logs: ConsoleLog[];
  onClearLogs: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'info' | 'success' | 'error'>('all');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll logs to bottom
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    return l.type === filter;
  });

  const getLogTypeIcon = (type: ConsoleLog['type']) => {
    switch (type) {
      case 'success':
        return <Sparkles size={11} className="log-type-icon success" />;
      case 'error':
        return <ShieldAlert size={11} className="log-type-icon error" />;
      default:
        return <Terminal size={11} className="log-type-icon info" />;
    }
  };

  return (
    <div className="console-container glass-panel">
      {/* Console Header toolbar */}
      <div className="console-header-toolbar">
        <div className="console-title-container">
          <Terminal size={14} className="console-title-icon" />
          <span className="console-title">Live Pipeline Log Console</span>
        </div>
        
        <div className="console-actions">
          {/* Filters */}
          <div className="console-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'info' ? 'active' : ''}`}
              onClick={() => setFilter('info')}
            >
              Info
            </button>
            <button 
              className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
              onClick={() => setFilter('success')}
            >
              Success
            </button>
            <button 
              className={`filter-btn ${filter === 'error' ? 'active' : ''}`}
              onClick={() => setFilter('error')}
            >
              Errors
            </button>
          </div>

          <span className="toolbar-divider">|</span>

          {/* Action trigger */}
          <button className="console-clear-btn" onClick={onClearLogs} title="Clear terminal logs">
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal logs list */}
      <div className="console-terminal-body code-editor-font">
        {filteredLogs.length === 0 ? (
          <div className="console-terminal-empty">
            <span className="prompt-indicator">$</span>
            <span className="terminal-empty-text">Orchestrator idle. Run workflow to capture pipeline execution vectors...</span>
            <span className="terminal-cursor"></span>
          </div>
        ) : (
          <div className="logs-list">
            {filteredLogs.map((log, index) => (
              <div key={index} className={`log-row type-${log.type}`}>
                <span className="log-time">[{log.timestamp}]</span>
                <span className="log-node">[{log.nodeTitle}]</span>
                {getLogTypeIcon(log.type)}
                <span className="log-message">{log.message}</span>
              </div>
            ))}
            <div className="log-row">
              <span className="prompt-indicator">$</span>
              <span className="terminal-cursor"></span>
            </div>
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};
export default Console;
