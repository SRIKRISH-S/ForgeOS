// ============================================================
// MemoryPage.jsx — ForgeOS Memory Explorer & Knowledge Base
// ============================================================

import { useState, useEffect } from 'react';

export default function MemoryPage({ business }) {
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('learnings'); // 'learnings' | 'customers' | 'decisions' | 'services'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMemory();
  }, []);

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      setMemory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!business) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>No active business. Launch a business to initialize MemoryAgent.</div>
      </div>
    );
  }

  const filteredLearnings = (memory?.learnings || []).filter(l =>
    l.insight.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = (memory?.customerProfiles || []).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDecisions = (memory?.decisions || []).filter(d =>
    d.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.output.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', letterSpacing: '0.12em', marginBottom: 6 }}>
            MEMORYAGENT LONG-TERM KNOWLEDGE BASE
          </div>
          <h1 style={{ fontSize: 24, letterSpacing: '0.06em' }}>AUTONOMOUS MEMORY & LEARNINGS</h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
            Historical knowledge, customer profiles, and decision outcomes retrieved before every agent action.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchMemory} style={{ fontSize: 11 }}>
          ↻ Refresh Memory
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <MemoryStatCard label="Learned Insights" value={memory?.stats?.totalLearnings || 0} sub="Extracted by ReflectionAgent" color="var(--lime)" />
        <MemoryStatCard label="Customer Profiles" value={memory?.stats?.totalCustomers || 0} sub="Tracked interactions" color="var(--cyan)" />
        <MemoryStatCard label="Agent Decisions" value={memory?.stats?.totalDecisions || 0} sub="Recorded outcomes" color="var(--amber)" />
        <MemoryStatCard label="Services Tracked" value={memory?.stats?.totalServices || 0} sub="Performance benchmarks" color="var(--blue)" />
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'learnings', label: '💡 Learnings', count: memory?.learnings?.length },
            { id: 'customers', label: '👤 Customers', count: memory?.customerProfiles?.length },
            { id: 'decisions', label: '📋 Decisions', count: memory?.decisions?.length },
            { id: 'services', label: '📈 Service Performance', count: memory?.servicePerformance?.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: 6, fontSize: 12,
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                border: `1px solid ${activeTab === tab.id ? 'var(--cyan)' : 'var(--border)'}`,
                background: activeTab === tab.id ? 'rgba(0,232,204,0.12)' : 'var(--bg-2)',
                color: activeTab === tab.id ? 'var(--cyan)' : 'var(--text-dim)',
                transition: 'all 0.2s'
              }}
            >
              {tab.label} ({tab.count || 0})
            </button>
          ))}
        </div>

        <input
          className="input"
          placeholder="Search memory..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: 240, fontSize: 12 }}
        />
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Querying MemoryAgent store...
        </div>
      ) : (
        <div>
          {/* TAB 1: LEARNINGS */}
          {activeTab === 'learnings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredLearnings.length === 0 ? (
                <EmptyMemoryState message="No learned insights recorded yet. Complete an order to trigger ReflectionAgent learning." />
              ) : (
                filteredLearnings.map(learning => (
                  <div key={learning.id} style={{
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1, paddingRight: 20 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span className="badge badge-info" style={{ fontSize: 10 }}>{learning.category}</span>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)' }}>
                          Source: {learning.source}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                        {learning.insight}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)' }}>
                        Score: {Math.round((learning.confidence || 0.8) * 100)}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-dimmer)', marginTop: 4 }}>
                        {new Date(learning.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filteredCustomers.length === 0 ? (
                <EmptyMemoryState message="No customer profiles stored yet. Customer profiles build automatically upon receiving orders." />
              ) : (
                filteredCustomers.map(customer => (
                  <div key={customer.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{customer.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{customer.email}</div>
                      </div>
                      <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: 'var(--lime)' }}>
                        ${customer.totalSpent || 0}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
                      Total Orders: <strong>{customer.orders?.length || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-3)', padding: 10, borderRadius: 6 }}>
                      {customer.orders?.map((o, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: 'var(--text-dim)' }}>{o.serviceName}</span>
                          <span style={{ color: 'var(--cyan)' }}>${o.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: DECISIONS */}
          {activeTab === 'decisions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredDecisions.length === 0 ? (
                <EmptyMemoryState message="No decision logs recorded yet." />
              ) : (
                filteredDecisions.map(d => (
                  <div key={d.id} style={{
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 14, fontSize: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{d.agent}</span>
                        <span className="tag">{d.type}</span>
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)' }}>
                        {new Date(d.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>Input: {d.input}</div>
                    <div style={{ color: 'var(--lime)', fontFamily: 'var(--font-mono)' }}>Outcome: {d.output}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: SERVICE PERFORMANCE */}
          {activeTab === 'services' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {(memory?.servicePerformance || []).length === 0 ? (
                <EmptyMemoryState message="No service metrics recorded yet." />
              ) : (
                memory.servicePerformance.map(s => (
                  <div key={s.serviceId} className="card">
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{s.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>SUCCESS RATE</div>
                        <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--lime)' }}>{s.successRate}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>AVG SCORE</div>
                        <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>{s.avgScore}/100</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Total Revenue: <span style={{ color: 'var(--lime)' }}>${s.revenue}</span> ({s.totalOrders} orders)
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemoryStatCard({ label, value, sub, color }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color, fontSize: 24 }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function EmptyMemoryState({ message }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px border-dashed var(--border)',
      borderRadius: 8, padding: 40, textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 13
    }}>
      {message}
    </div>
  );
}
