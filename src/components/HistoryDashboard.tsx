import React from 'react';
import type { RunHistoryItem } from '../types';
import { Play, Clock, ShieldCheck, Landmark } from 'lucide-react';
import './HistoryDashboard.css';

interface DashboardProps {
  history: RunHistoryItem[];
}

export const HistoryDashboard: React.FC<DashboardProps> = ({ history }) => {
  const totalRuns = history.length;
  const successfulRuns = history.filter(h => h.status === 'success').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
  
  const avgDuration = totalRuns > 0 
    ? Math.round(history.reduce((acc, h) => acc + h.duration, 0) / totalRuns)
    : 0;

  const totalCost = history.reduce((acc, h) => acc + h.estimatedCost, 0).toFixed(5);
  const totalTokens = history.reduce((acc, h) => acc + h.tokensCount, 0);

  // SVG Line Chart Calculation
  const renderLineChart = () => {
    if (totalRuns < 2) {
      return (
        <div className="chart-placeholder">
          <span>Need at least 2 runs to display timeline analytics.</span>
        </div>
      );
    }

    const width = 500;
    const height = 120;
    const padding = 20;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Find min/max values
    const maxDur = Math.max(...history.map(h => h.duration), 1000);
    const minDur = Math.min(...history.map(h => h.duration), 0);

    const points = history.map((run, i) => {
      const x = padding + (i / (totalRuns - 1)) * chartWidth;
      const range = maxDur - minDur || 1;
      const y = height - padding - ((run.duration - minDur) / range) * chartHeight;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Closed path for gradient area
    const areaPath = `
      ${linePath} 
      L ${points[points.length - 1].x} ${height - padding} 
      L ${points[0].x} ${height - padding} 
      Z
    `;

    return (
      <svg className="analytics-line-chart" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" />
        <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="rgba(255,255,255,0.03)" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" />

        {/* Render filled gradient area */}
        <path d={areaPath} fill="url(#chart-area-grad)" />

        {/* Render stroke line */}
        <path d={linePath} fill="none" stroke="var(--color-cyan)" strokeWidth={2} style={{ filter: 'url(#glow-cyan)' }} />

        {/* Render interactive dots */}
        {points.map((p, idx) => (
          <g key={idx} className="chart-dot-group">
            <circle cx={p.x} cy={p.y} r={4} fill="var(--bg-secondary)" stroke="var(--color-cyan)" strokeWidth={2} />
            <title>{`Run #${idx+1}: ${history[idx].duration}ms`}</title>
          </g>
        ))}
      </svg>
    );
  };

  // SVG Donut Chart Calculation
  const renderDonutChart = () => {
    if (totalRuns === 0) {
      return (
        <div className="chart-placeholder">
          <span>No LLM requests captured yet.</span>
        </div>
      );
    }

    // Dummy counts of models: we will count token distributions
    const modelsCount: Record<string, number> = {
      'Gemini 1.5': Math.max(Math.ceil(totalTokens * 0.7), 1),
      'Claude 3.5': Math.max(Math.ceil(totalTokens * 0.2), 0),
      'GPT-4o': Math.max(Math.ceil(totalTokens * 0.1), 0),
    };

    const totalVal = Object.values(modelsCount).reduce((a, b) => a + b, 0);

    const radius = 32;
    const circ = 2 * Math.PI * radius; // ~201
    let accumPercent = 0;

    const colors = ['var(--color-cyan)', 'var(--color-magenta)', 'var(--color-violet)'];

    return (
      <div className="donut-chart-container">
        <svg className="analytics-donut-chart" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
          {Object.entries(modelsCount).map(([model, count], idx) => {
            if (count === 0) return null;
            const percent = count / totalVal;
            const strokeDash = percent * circ;
            const strokeOffset = circ - (accumPercent * circ);
            accumPercent += percent;

            return (
              <circle
                key={model}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={colors[idx % colors.length]}
                strokeWidth="10"
                strokeDasharray={`${strokeDash} ${circ}`}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>

        {/* Legend list */}
        <div className="donut-legend">
          {Object.entries(modelsCount).map(([model, count], idx) => {
            if (count === 0) return null;
            return (
              <div key={model} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                <span className="legend-text">{model} ({Math.round((count / totalVal) * 100)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container glass-panel">
      {/* Cards Widgets grid */}
      <div className="stats-cards-grid">
        <div className="stat-widget glass-panel">
          <div className="widget-icon-row">
            <Play size={16} color="var(--color-cyan)" />
            <span className="widget-title">Total Runs</span>
          </div>
          <span className="widget-value">{totalRuns}</span>
        </div>

        <div className="stat-widget glass-panel">
          <div className="widget-icon-row">
            <Clock size={16} color="var(--color-gold)" />
            <span className="widget-title">Avg Latency</span>
          </div>
          <span className="widget-value">{avgDuration}ms</span>
        </div>

        <div className="stat-widget glass-panel">
          <div className="widget-icon-row">
            <ShieldCheck size={16} color="var(--color-green)" />
            <span className="widget-title">Success Rate</span>
          </div>
          <span className="widget-value">{successRate}%</span>
        </div>

        <div className="stat-widget glass-panel">
          <div className="widget-icon-row">
            <Landmark size={16} color="var(--color-magenta)" />
            <span className="widget-title">Total Cost</span>
          </div>
          <span className="widget-value">${totalCost}</span>
        </div>
      </div>

      {/* Visual charts row */}
      <div className="charts-row">
        <div className="chart-box glass-panel">
          <span className="chart-box-title">Latency Timeline (ms)</span>
          {renderLineChart()}
        </div>

        <div className="chart-box glass-panel">
          <span className="chart-box-title">Model Token Allocation</span>
          {renderDonutChart()}
        </div>
      </div>
    </div>
  );
};
export default HistoryDashboard;
