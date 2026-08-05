// ============================================================
// ArchitecturePage.jsx — Interactive Agent Topology & Visualizer
// ============================================================

import { useState, useEffect } from 'react';

const AGENT_NODES = [
  { id: 'orchestrator', name: 'OrchestratorAgent', role: 'Central Brain & Multi-Agent Planner', color: '#AAFF00', icon: '🧠', pos: { x: 50, y: 15 } },
  { id: 'architect', name: 'ArchitectAgent', role: 'Business & Service Tier Designer', color: '#7B8FFF', icon: '⚡', pos: { x: 20, y: 40 } },
  { id: 'finance', name: 'FinanceAgent', role: 'Locus Wallet & Margin Auditor', color: '#FFB020', icon: '💰', pos: { x: 45, y: 40 } },
  { id: 'sales', name: 'SalesAgent', role: 'Storefront & Demand Predictor', color: '#00E8CC', icon: '🛍', pos: { x: 70, y: 40 } },
  { id: 'fulfillment', name: 'FulfillmentAgent', role: 'AI Delivery & Artifact Generator', color: '#4080FF', icon: '🤖', pos: { x: 85, y: 70 } },
  { id: 'memory', name: 'MemoryAgent', role: 'Vector Knowledge & Customer Store', color: '#00E8CC', icon: '💾', pos: { x: 15, y: 70 } },
  { id: 'reflection', name: 'ReflectionAgent', role: 'Quality Audit & Learning Loop', color: '#FF4060', icon: '🔍', pos: { x: 40, y: 70 } },
  { id: 'ceo', name: 'CEOAgent', role: 'Autonomous Business Growth Engine', color: '#FFB020', icon: '👑', pos: { x: 62, y: 70 } },
];

export default function ArchitecturePage({ business }) {
  const [statusData, setStatusData] = useState(null);
  const [plugins, setPlugins] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(AGENT_NODES[0]);
  const [executionTrace, setExecutionTrace] = useState([]);

  useEffect(() => {
    fetchStatus();
    fetchPlugins();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/architecture/status');
      const data = await res.json();
      setStatusData(data);
      if (data.executionRuns?.length > 0) {
        setExecutionTrace(data.executionRuns[0].steps || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      setPlugins(data.plugins || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', letterSpacing: '0.12em', marginBottom: 6 }}>
            SYSTEM ARCHITECTURE & MULTI-AGENT TOPOLOGY
          </div>
          <h1 style={{ fontSize: 24, letterSpacing: '0.06em' }}>AUTONOMOUS AGENT TOPOLOGY</h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
            Visualizing inter-agent communication, collaborative negotiation loop, and reasoning chains.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)' }}>
            8 Collaborating AI Agents Active
          </span>
        </div>
      </div>

      {/* Interactive Topology Graph */}
      <div className="card" style={{ padding: 24, marginBottom: 28, position: 'relative', overflow: 'hidden', minHeight: 440 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', letterSpacing: '0.1em', marginBottom: 12 }}>
          INTER-AGENT COLLABORATION NETWORK (CLICK AGENT NODE FOR DETAILS)
        </div>

        {/* Node connections SVG overlay */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {/* Orchestrator connections */}
          <line x1="50%" y1="20%" x2="20%" y2="40%" stroke="rgba(170,255,0,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="50%" y1="20%" x2="45%" y2="40%" stroke="rgba(170,255,0,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="50%" y1="20%" x2="70%" y2="40%" stroke="rgba(170,255,0,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
          
          {/* Layer 2 to Layer 3 connections */}
          <line x1="20%" y1="40%" x2="15%" y2="70%" stroke="rgba(0,232,204,0.2)" strokeWidth="1" />
          <line x1="45%" y1="40%" x2="40%" y2="70%" stroke="rgba(255,176,32,0.2)" strokeWidth="1" />
          <line x1="70%" y1="40%" x2="62%" y2="70%" stroke="rgba(0,232,204,0.2)" strokeWidth="1" />
          <line x1="70%" y1="40%" x2="85%" y2="70%" stroke="rgba(64,128,255,0.2)" strokeWidth="1" />
          
          {/* Loopback connections (Reflection -> Memory -> Orchestrator) */}
          <line x1="40%" y1="70%" x2="15%" y2="70%" stroke="rgba(255,64,96,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="15%" y1="70%" x2="50%" y2="20%" stroke="rgba(0,232,204,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>

        {/* Render Agent Nodes */}
        <div style={{ position: 'relative', height: 380, width: '100%' }}>
          {AGENT_NODES.map(agent => {
            const isSelected = selectedAgent.id === agent.id;
            const liveState = statusData?.agentStates?.[agent.id] || { status: 'idle', lastAction: 'Standing by' };
            const isActive = liveState.status !== 'idle';

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  position: 'absolute',
                  left: `${agent.pos.x}%`,
                  top: `${agent.pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  background: isSelected ? 'var(--bg-3)' : 'var(--bg-2)',
                  border: `2px solid ${isSelected ? agent.color : `${agent.color}40`}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: isSelected ? `0 0 30px ${agent.color}30` : 'none',
                  zIndex: isSelected ? 10 : 2
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: `${agent.color}20`, border: `1px solid ${agent.color}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18
                  }}>
                    {agent.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: agent.color, fontFamily: 'var(--font-mono)' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                      {agent.role}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)',
                    color: isActive ? 'var(--lime)' : 'var(--text-dimmer)',
                    textTransform: 'uppercase'
                  }}>
                    STATUS: {liveState.status}
                  </span>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isActive ? 'var(--lime)' : 'var(--text-dimmer)',
                    animation: isActive ? 'pulse 1.5s infinite' : 'none'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Selected Agent Detail & Structured Execution Trace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Left: Execution Trace & Reasoning Chain */}
        <div>
          <SectionHeader label="LIVE REASONING CHAIN & STEP TRACE" />
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {executionTrace.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-dimmer)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                No active execution trace. Launch a new business to observe step-by-step reasoning.
              </div>
            ) : (
              executionTrace.map((step, idx) => <ReasoningStepCard key={idx} step={step} index={idx} />)
            )}
          </div>
        </div>

        {/* Right: Selected Agent Inspector & Registered Plugins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Agent Inspector */}
          <div className="card" style={{ borderColor: `${selectedAgent.color}60` }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: selectedAgent.color, marginBottom: 12, letterSpacing: '0.08em' }}>
              AGENT INSPECTOR
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: `${selectedAgent.color}20`, border: `1px solid ${selectedAgent.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
              }}>
                {selectedAgent.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 16, color: selectedAgent.color }}>{selectedAgent.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{selectedAgent.role}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, background: 'var(--bg-3)', padding: 14, borderRadius: 6 }}>
              <DetailRow label="System Role" value={selectedAgent.name} />
              <DetailRow label="Current State" value={statusData?.agentStates?.[selectedAgent.id]?.status || 'idle'} color="var(--lime)" />
              <DetailRow label="Last Action" value={statusData?.agentStates?.[selectedAgent.id]?.lastAction || 'Standing by'} />
            </div>
          </div>

          {/* Plugin Ecosystem Panel */}
          <div className="card">
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginBottom: 12, letterSpacing: '0.08em' }}>
              REGISTERED PLUGIN AGENTS & TOOLS ({plugins.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plugins.map(p => (
                <div key={p.id} style={{ padding: 10, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                    <span className="badge badge-active" style={{ fontSize: 9 }}>{p.category}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    {p.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReasoningStepCard({ step, index }) {
  const agentColor = {
    OrchestratorAgent: '#AAFF00',
    ArchitectAgent: '#7B8FFF',
    FinanceAgent: '#FFB020',
    SalesAgent: '#00E8CC',
    FulfillmentAgent: '#4080FF',
    MemoryAgent: '#00E8CC',
    ReflectionAgent: '#FF4060',
    CEOAgent: '#FFB020'
  }[step.agent] || 'var(--lime)';

  return (
    <div style={{
      background: 'var(--bg-2)', border: `1px solid ${agentColor}30`,
      borderRadius: 8, padding: 16
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: `${agentColor}20`,
            border: `1px solid ${agentColor}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 11, color: agentColor, fontWeight: 700, fontFamily: 'var(--font-mono)'
          }}>
            {index + 1}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: agentColor, fontFamily: 'var(--font-mono)' }}>
            {step.agent}
          </span>
        </div>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)' }}>
          {new Date(step.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, lineHeight: 1.5 }}>
        <div><strong style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>GOAL:</strong> {step.goal}</div>
        <div><strong style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>THOUGHT:</strong> {step.thought}</div>
        <div><strong style={{ color: agentColor, fontFamily: 'var(--font-mono)' }}>ACTION:</strong> {step.action}</div>
        <div style={{ background: 'var(--bg-3)', padding: 8, borderRadius: 4, color: 'var(--text-dim)' }}>
          <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>OBSERVATION:</strong> {step.observation}
        </div>
        <div><strong style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>NEXT STEP:</strong> {step.nextStep}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}:</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}
