import { useState, useEffect } from 'react';

const AGENT_COLORS = {
  OrchestratorAgent: '#AAFF00',
  ArchitectAgent: '#7B8FFF',
  SalesAgent: '#00E8CC',
  FulfillmentAgent: '#4080FF',
  FinanceAgent: '#FFB020',
  MemoryAgent: '#00E8CC',
  ReflectionAgent: '#FF4060',
  CEOAgent: '#FFB020'
};

const AGENT_ICONS = {
  OrchestratorAgent: '🧠',
  ArchitectAgent: '⚡',
  SalesAgent: '🛍',
  FulfillmentAgent: '🤖',
  FinanceAgent: '💰',
  MemoryAgent: '💾',
  ReflectionAgent: '🔍',
  CEOAgent: '👑'
};

export default function Dashboard({ business, orders, logs, wallet, onFulfill, onViewStorefront }) {
  const [agentStatuses, setAgentStatuses] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [fulfilling, setFulfilling] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [roadmapOrder, setRoadmapOrder] = useState(null);
  const [roadmapData, setRoadmapData] = useState({});
  const [roadmapLoading, setRoadmapLoading] = useState({});
  const [activeTab, setActiveTab] = useState('agents'); // 'agents' | 'reasoning'

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [actRes, metricsRes] = await Promise.all([
          fetch('/api/agents/activity').then(r => r.json()),
          fetch('/api/finance/metrics').then(r => r.json())
        ]);
        setAgentStatuses(actRes.agents || []);
        setMetrics(metricsRes);
      } catch {}
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleFulfill = async (orderId) => {
    setFulfilling(f => ({ ...f, [orderId]: true }));
    try {
      const result = await onFulfill(orderId);
      if (result.success) setSelectedOrder(result.order);
    } catch {}
    setFulfilling(f => ({ ...f, [orderId]: false }));
  };

  const handleViewRoadmap = async (order) => {
    setRoadmapOrder(order);
    if (roadmapData[order.id]) return;
    setRoadmapLoading(r => ({ ...r, [order.id]: true }));
    try {
      if (order.roadmap) {
        setRoadmapData(d => ({ ...d, [order.id]: order.roadmap }));
      } else {
        const res = await fetch(`/api/orders/${order.id}/roadmap`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order, business })
        });
        const data = await res.json();
        if (data.success) setRoadmapData(d => ({ ...d, [order.id]: data.roadmap }));
      }
    } catch {}
    setRoadmapLoading(r => ({ ...r, [order.id]: false }));
  };

  const totalRevenue = orders.filter(o => o.status === 'fulfilled' || o.status === 'paid')
    .reduce((s, o) => s + o.price, 0);
  const completedOrders = orders.filter(o => o.status === 'fulfilled').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  if (!business) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>No business active. Launch a business to open Agent Command Center.</div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', letterSpacing: '0.12em', marginBottom: 6 }}>
            AUTONOMOUS AGENT COMMAND CENTER (8 AGENTS ACTIVE)
          </div>
          <h1 style={{ fontSize: 24, letterSpacing: '0.06em' }}>{business.businessName}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
            {business.agentPersona || 'Autonomous Business Operating System'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>LOCUS WALLET</div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--amber)' }}>
              ${wallet?.balance?.toFixed(2) || totalRevenue.toFixed(2)}
            </div>
            {wallet?.isDemoMode && <div style={{ fontSize: 10, color: 'var(--text-dimmer)', fontFamily: 'var(--font-mono)' }}>DEMO MODE</div>}
          </div>
          <button className="btn btn-ghost" onClick={onViewStorefront}>
            View Storefront ↗
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Revenue" value={`$${totalRevenue}`} sub="All time" color="var(--lime)" />
        <StatCard label="Orders Fulfilled" value={completedOrders} sub={`${pendingOrders} pending queue`} color="var(--cyan)" />
        <StatCard label="Avg Order Value" value={`$${metrics?.avgOrderValue || '0'}`} sub="Per transaction" color="var(--amber)" />
        <StatCard label="Conversion Rate" value={metrics?.conversionRate || '14.5%'} sub="Visits to orders" color="var(--blue)" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left: 8 Agent Grid + Orders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Active Agents (8-Agent Roster) */}
          <div>
            <SectionHeader label="ACTIVE AGENT ROSTER (8 COLLABORATING AGENTS)" />
            <div className="grid-2" style={{ marginTop: 12 }}>
              {agentStatuses.length > 0
                ? agentStatuses.map(agent => (
                    <AgentCard key={agent.id || agent.name} agent={agent} />
                  ))
                : [
                    { name: 'OrchestratorAgent', status: 'active', activity: 'Coordinating agent execution pipeline...' },
                    { name: 'ArchitectAgent', status: 'active', activity: 'Designing service tiers & business architecture...' },
                    { name: 'SalesAgent', status: 'active', activity: 'Handling customer storefront inquiries...' },
                    { name: 'FulfillmentAgent', status: 'active', activity: 'Executing automated service deliverables...' },
                    { name: 'FinanceAgent', status: 'active', activity: 'Auditing margin profitability & Locus wallet...' },
                    { name: 'MemoryAgent', status: 'active', activity: 'Indexing long-term knowledge & customer profiles...' },
                    { name: 'ReflectionAgent', status: 'active', activity: 'Evaluating execution outcomes & learnings...' },
                    { name: 'CEOAgent', status: 'active', activity: 'Monitoring business health & growth strategy...' }
                  ].map(a => <AgentCard key={a.name} agent={a} />)
              }
            </div>
          </div>

          {/* Orders table */}
          <div>
            <SectionHeader label={`ORDERS QUEUE (${orders.length})`} />
            <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {orders.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 13 }}>
                  No orders yet — share your storefront link to start selling
                </div>
              ) : (
                orders.slice().reverse().map((order, i) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isLast={i === orders.length - 1}
                    onFulfill={() => handleFulfill(order.id)}
                    fulfilling={fulfilling[order.id]}
                    onView={() => setSelectedOrder(order)}
                    onViewRoadmap={() => handleViewRoadmap(order)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Activity feed & Business Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Business info */}
          <div className="card">
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 12, letterSpacing: '0.08em' }}>
              BUSINESS ARCHITECTURE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InfoRow label="Category" value={business.category} />
              <InfoRow label="Services" value={business.services?.length} />
              <InfoRow label="Orchestration" value="Collaborative 8-Agent" />
              <InfoRow label="Status" value={<span className="badge badge-active">AUTONOMOUS</span>} />
            </div>
          </div>

          {/* Revenue bar chart */}
          <div className="card">
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 16, letterSpacing: '0.08em' }}>
              REVENUE — 24H
            </div>
            <MiniRevenueChart data={metrics?.hourlyData || []} />
          </div>

          {/* Live activity feed */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div className="pulse-dot" style={{ width: 6, height: 6 }} />
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                INTER-AGENT COMMUNICATION FEED
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-dimmer)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  Waiting for agent communication...
                </div>
              ) : (
                logs.map(log => <LogEntry key={log.id} log={log} />)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable modal */}
      {selectedOrder?.deliverable && (
        <DeliverableModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
      {/* Roadmap modal */}
      {roadmapOrder && (
        <DashboardRoadmapModal
          order={roadmapOrder}
          roadmap={roadmapData[roadmapOrder.id]}
          loading={roadmapLoading[roadmapOrder.id]}
          onClose={() => setRoadmapOrder(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color, fontSize: 24 }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function AgentCard({ agent }) {
  const color = AGENT_COLORS[agent.name] || 'var(--lime)';
  const icon = AGENT_ICONS[agent.name] || '🤖';
  const isBusy = agent.status === 'busy' || agent.status === 'thinking' || agent.status === 'executing';

  return (
    <div style={{
      background: 'var(--bg-2)',
      border: `1px solid ${color}30`,
      borderRadius: 8, padding: 16,
      transition: 'border-color 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: `${color}20`, border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color, marginBottom: 1 }}>
              {agent.name}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: isBusy ? 'var(--amber)' : color, textTransform: 'uppercase' }}>
            {agent.status || 'active'}
          </span>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isBusy ? 'var(--amber)' : color,
            animation: 'pulse 2s infinite'
          }} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
        {agent.activity || 'Standing by...'}
      </div>
    </div>
  );
}

function OrderRow({ order, isLast, onFulfill, fulfilling, onView, onViewRoadmap }) {
  const statusColor = {
    'pending': 'var(--amber)',
    'fulfilling': 'var(--blue)',
    'fulfilled': 'var(--lime)',
    'paid': 'var(--cyan)'
  }[order.status] || 'var(--text-dim)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto',
      gap: 12,
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      background: 'var(--bg-2)',
      fontSize: 13
    }}>
      <div>
        <div style={{ fontWeight: 500, marginBottom: 2 }}>{order.customerName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {order.serviceName}
        </div>
      </div>
      <div style={{ color: 'var(--lime)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
        ${order.price}
      </div>
      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)',
        color: statusColor, textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}>
        {order.status}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {order.status === 'pending' && (
          <button
            onClick={onFulfill}
            disabled={fulfilling}
            style={{
              background: 'var(--lime-dim)', border: '1px solid var(--lime-glow)',
              color: 'var(--lime)', borderRadius: 4, padding: '4px 10px',
              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap'
            }}
          >
            {fulfilling ? '...' : 'Fulfill ↗'}
          </button>
        )}
        {order.fileUrl && (
          <a
            href={order.fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--bg-3)', border: '1px solid var(--lime-glow)',
              color: 'var(--lime)', borderRadius: 4, padding: '4px 10px',
              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
              textDecoration: 'none', display: 'flex', alignItems: 'center'
            }}
          >
            ↓ MD
          </a>
        )}
        {order.emailPreviewUrl && (
          <a
            href={order.emailPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--bg-3)', border: '1px solid var(--amber-glow)',
              color: 'var(--amber)', borderRadius: 4, padding: '4px 10px',
              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
              textDecoration: 'none', display: 'flex', alignItems: 'center'
            }}
          >
            ✉️
          </a>
        )}
        {order.deliverable && (
          <button
            onClick={onView}
            style={{
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              color: 'var(--text-dim)', borderRadius: 4, padding: '4px 10px',
              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)'
            }}
          >
            View
          </button>
        )}
        {(order.status === 'fulfilled' || order.status === 'paid') && (
          <button
            onClick={onViewRoadmap}
            style={{
              background: 'rgba(123,143,255,0.12)',
              border: '1px solid rgba(123,143,255,0.4)',
              color: '#7B8FFF', borderRadius: 4, padding: '4px 10px',
              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap'
            }}
          >
            📋 Roadmap
          </button>
        )}
      </div>
    </div>
  );
}

function LogEntry({ log }) {
  const color = {
    success: 'var(--lime)',
    error: 'var(--red)',
    processing: 'var(--blue)',
    info: 'var(--text-dim)'
  }[log.type] || 'var(--text-dim)';

  const agentColor = AGENT_COLORS[log.agent] || 'var(--text-dim)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
      padding: '8px 0',
      borderBottom: '1px solid var(--border)',
      animation: 'fadeInUp 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: agentColor }}>
          {log.agent}
        </span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)' }}>
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div style={{ fontSize: 11, color, lineHeight: 1.4 }}>{log.message}</div>
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

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function MiniRevenueChart({ data }) {
  if (!data.length) return <div style={{ height: 60, background: 'var(--bg-3)', borderRadius: 4 }} />;
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60 }}>
      {data.map((d, i) => (
        <div
          key={i}
          title={`${d.hour}:00 — $${d.revenue}`}
          style={{
            flex: 1,
            height: `${(d.revenue / max) * 100}%`,
            minHeight: d.revenue > 0 ? 3 : 1,
            background: d.revenue > 0
              ? `linear-gradient(180deg, var(--lime) 0%, var(--lime-dim) 100%)`
              : 'var(--bg-3)',
            borderRadius: 2,
            transition: 'height 0.5s ease'
          }}
        />
      ))}
    </div>
  );
}

function DeliverableModal({ order, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(7,7,14,0.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
      animation: 'fadeIn 0.2s ease'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: 32,
        maxWidth: 720, width: '100%',
        maxHeight: '80vh', overflowY: 'auto',
        animation: 'fadeInUp 0.3s ease'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', marginBottom: 4 }}>
              DELIVERABLE — ORDER #{order.id?.slice(0, 8)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{order.serviceName} → {order.customerName}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {order.fileUrl && (
              <a
                href={order.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'var(--lime-dim)', border: '1px solid var(--lime-glow)',
                  color: 'var(--lime)', borderRadius: 4, padding: '6px 12px',
                  cursor: 'pointer', fontSize: 12, textDecoration: 'none'
                }}
              >
                Download .MD
              </a>
            )}
            <button onClick={onClose} style={{
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              color: 'var(--text-dim)', borderRadius: 4, padding: '6px 12px',
              cursor: 'pointer', fontSize: 12
            }}>✕ Close</button>
          </div>
        </div>
        <pre style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--text-dim)', whiteSpace: 'pre-wrap',
          lineHeight: 1.7,
          background: 'var(--bg-3)', padding: 20, borderRadius: 6
        }}>
          {order.deliverable}
        </pre>
      </div>
    </div>
  );
}

function DashboardRoadmapModal({ order, roadmap, loading, onClose }) {
  const [activePhase, setActivePhase] = useState(0);
  const phase = roadmap?.phases?.[activePhase];
  const accent = '#7B8FFF';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(7,7,14,0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 24,
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-2)',
          border: `1px solid ${accent}40`,
          borderRadius: 14, padding: 32,
          maxWidth: 780, width: '100%',
          maxHeight: '88vh', overflowY: 'auto',
          animation: 'fadeInUp 0.3s ease',
          boxShadow: `0 0 60px ${accent}15`
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: accent, letterSpacing: '0.1em', marginBottom: 6 }}>
              BUSINESS DEVELOPMENT PLAN — ORDER #{order.id?.slice(0, 8)}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>
              {order.serviceName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Client: {order.customerName} &nbsp;·&nbsp; Paid: ${order.price}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              color: 'var(--text-dim)', borderRadius: 6, padding: '6px 14px',
              cursor: 'pointer', fontSize: 12
            }}
          >
            ✕ Close
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `2px solid ${accent}`, borderTopColor: 'transparent',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }} />
            ArchitectAgent generating roadmap...
          </div>
        ) : !roadmap ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)', fontSize: 13 }}>
            No roadmap available.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              padding: 20,
              background: `${accent}08`,
              border: `1px solid ${accent}25`,
              borderRadius: 10
            }}>
              <div style={{
                fontSize: 18, fontWeight: 700, marginBottom: 10,
                background: `linear-gradient(135deg, #F0F0F8 0%, ${accent} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', lineHeight: 1.3
              }}>
                {roadmap.headline}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
                {roadmap.summary}
              </div>
            </div>

            {roadmap.phases?.length > 0 && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {roadmap.phases.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhase(i)}
                      style={{
                        padding: '7px 16px', borderRadius: 6, fontSize: 12,
                        fontFamily: 'var(--font-mono)', cursor: 'pointer',
                        border: `1px solid ${activePhase === i ? (p.color || accent) : 'var(--border)'}`,
                        background: activePhase === i ? `${p.color || accent}18` : 'var(--bg-3)',
                        color: activePhase === i ? (p.color || accent) : 'var(--text-dim)'
                      }}
                    >
                      {p.icon} Phase {p.phase}: {p.title}
                    </button>
                  ))}
                </div>

                {phase && (
                  <div style={{
                    background: 'var(--bg-3)',
                    border: `1px solid ${phase.color || accent}35`,
                    borderRadius: 10, padding: 20
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: phase.color || accent }}>
                        {phase.icon} {phase.title}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                        ⏱ {phase.timeline}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {phase.steps?.map((step, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            background: `${phase.color || accent}20`,
                            border: `1px solid ${phase.color || accent}50`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: phase.color || accent, fontWeight: 700
                          }}>
                            {j + 1}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
