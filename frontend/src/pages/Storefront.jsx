import { useState, useEffect } from 'react';

export default function Storefront({ business, onOrder, orders, onViewDashboard }) {
  const [selectedService, setSelectedService] = useState(null);
  const [orderForm, setOrderForm] = useState({ customerName: '', customerEmail: '', requirements: '' });
  const [orderState, setOrderState] = useState('idle'); // idle | submitting | success | error
  const [orderError, setOrderError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'agent', text: `Hi! I'm your ${business?.businessName || ''} AI agent. How can I help you today?` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  if (!business) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>No business active. Go to Launch to create one.</div>
      </div>
    );
  }

  const primary = business.colorScheme?.primary || '#AAFF00';

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!selectedService || !orderForm.customerName || !orderForm.customerEmail) return;
    setOrderState('submitting');
    try {
      const result = await onOrder({
        serviceId: selectedService.id,
        ...orderForm
      });
      if (result.success) {
        setLastOrder(result.order);
        setOrderState('success');
        setShowResultModal(true); // Open clean full-width modal for deliverable & roadmap
        setOrderForm({ customerName: '', customerEmail: '', requirements: '' });
      } else {
        setOrderError(result.error || 'Something went wrong. Please try again.');
        setOrderState('error');
      }
    } catch (err) {
      setOrderError(err.message || 'Something went wrong. Please try again.');
      setOrderState('error');
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim() || chatLoading) return;
    const userMsg = chatMsg.trim();
    setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
    setChatMsg('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          business
        })
      });
      const data = await res.json();
      setChatHistory(h => [...h, { role: 'agent', text: data.response }]);
    } catch {
      setChatHistory(h => [...h, { role: 'agent', text: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="page">
      {/* Hero Header */}
      <div style={{
        textAlign: 'center', padding: '48px 20px 56px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 48,
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 200,
          background: `radial-gradient(ellipse, ${primary}18 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 100,
          background: `${primary}15`,
          border: `1px solid ${primary}40`,
          marginBottom: 20, position: 'relative'
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: primary, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: primary, letterSpacing: '0.12em' }}>
            AUTONOMOUS OPERATING BUSINESS SYSTEM
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 52px)',
          letterSpacing: '0.06em',
          marginBottom: 12,
          background: `linear-gradient(135deg, #F0F0F8 0%, ${primary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          position: 'relative'
        }}>
          {business.businessName}
        </h1>

        <p style={{ fontSize: 18, color: 'var(--text-dim)', marginBottom: 8 }}>
          {business.tagline}
        </p>

        <p style={{ fontSize: 14, color: 'var(--text-dimmer)', maxWidth: 600, margin: '0 auto 24px' }}>
          {business.description}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="tag">✦ {business.category}</span>
          <span className="tag">✦ Autonomous AI Powered</span>
          <span className="tag">✦ Instant Digital Pay</span>
        </div>

        <button
          onClick={onViewDashboard}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '6px 12px',
            color: 'var(--text-dim)', fontSize: 11,
            fontFamily: 'var(--font-mono)', cursor: 'pointer',
            letterSpacing: '0.05em'
          }}
        >
          ⚡ AGENT DASHBOARD
        </button>
      </div>

      {/* Main content: services + order form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
        {/* Left Column: Services list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, letterSpacing: '0.12em', color: 'var(--text-dim)' }}>SERVICES CATALOG</h2>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {business.services?.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                selected={selectedService?.id === svc.id}
                onSelect={() => setSelectedService(svc === selectedService ? null : svc)}
                accent={primary}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Sidebar Order Form & AI Sales Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Order Form Panel */}
          <div className="card" style={{ borderColor: selectedService ? `${primary}40` : 'var(--border)' }}>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 16, letterSpacing: '0.08em' }}>
              AUTONOMOUS ORDERING
            </div>

            {!selectedService ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>
                ← Select a service tier from the catalog to place an order
              </div>
            ) : orderState === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 14, color: 'var(--lime)', fontWeight: 700 }}>
                  ✓ Order Submitted & Paid (${lastOrder?.price})
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Your service deliverables and AI roadmap are ready!
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowResultModal(true)}
                  style={{ justifyContent: 'center', fontSize: 12 }}
                >
                  📋 View Deliverable & Roadmap ↗
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setOrderState('idle'); setSelectedService(null); setLastOrder(null); }}
                  style={{ justifyContent: 'center', fontSize: 11, marginTop: 4 }}
                >
                  ← Order Another Service
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: `${primary}10`,
                  border: `1px solid ${primary}30`,
                  borderRadius: 6, padding: '10px 12px', marginBottom: 4
                }}>
                  <div style={{ fontSize: 11, color: primary, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>Selected Tier:</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedService.name}</div>
                  <div style={{ fontSize: 16, color: primary, marginTop: 2, fontWeight: 700 }}>${selectedService.price} Digital Credits</div>
                </div>

                <input
                  className="input"
                  placeholder="Your Name"
                  value={orderForm.customerName}
                  onChange={e => setOrderForm(f => ({ ...f, customerName: e.target.value }))}
                  required
                  style={{ fontSize: 13 }}
                />
                <input
                  className="input"
                  placeholder="Your Email (for deliverable delivery)"
                  type="email"
                  value={orderForm.customerEmail}
                  onChange={e => setOrderForm(f => ({ ...f, customerEmail: e.target.value }))}
                  required
                  style={{ fontSize: 13 }}
                />
                <textarea
                  className="input"
                  placeholder="Describe specific requirements (optional)"
                  value={orderForm.requirements}
                  onChange={e => setOrderForm(f => ({ ...f, requirements: e.target.value }))}
                  rows={3}
                  style={{ fontSize: 13 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={orderState === 'submitting'}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {orderState === 'submitting' ? (
                    <>Processing Instant Payment...</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      Instant Digital Pay (${selectedService.price})
                    </>
                  )}
                </button>
                {orderState === 'error' && (
                  <div style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center' }}>
                    {orderError}
                  </div>
                )}
              </form>
            )}
          </div>

          {/* AI Sales Chat widget */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="pulse-dot" style={{ width: 6, height: 6 }} />
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                AI SALES AGENT CHAT
              </div>
            </div>

            <div style={{ height: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: msg.role === 'user' ? `${primary}15` : 'var(--bg-3)',
                  border: `1px solid ${msg.role === 'user' ? `${primary}30` : 'var(--border)'}`,
                  fontSize: 12, lineHeight: 1.5,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}>
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: 'var(--bg-3)', border: '1px solid var(--border)',
                  fontSize: 12, color: 'var(--text-dim)'
                }}>
                  Typing<span style={{ animation: 'blink 1s infinite' }}>...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleChat} style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Ask a question..."
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                style={{ fontSize: 12, flex: 1 }}
              />
              <button type="submit" className="btn btn-ghost" style={{ padding: '0 12px', border: '1px solid var(--border)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Full Center Modal for Order Success, Deliverable & Execution Roadmap */}
      {showResultModal && lastOrder && (
        <OrderResultModal
          order={lastOrder}
          business={business}
          accent={primary}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
}

function ServiceCard({ service, selected, onSelect, accent }) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: 'var(--bg-2)',
        border: `1px solid ${selected ? `${accent}60` : 'var(--border)'}`,
        borderRadius: 8, padding: 24,
        cursor: 'pointer', transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
        boxShadow: selected ? `0 0 24px ${accent}15` : 'none',
        transform: selected ? 'translateY(-1px)' : 'none'
      }}
    >
      {service.popular && (
        <div style={{
          position: 'absolute', top: 0, right: 24,
          background: accent, color: '#07070E',
          fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
          padding: '3px 10px', borderRadius: '0 0 4px 4px',
          letterSpacing: '0.1em'
        }}>POPULAR</div>
      )}

      {selected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${accent}05 0%, transparent 100%)`,
          pointerEvents: 'none'
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, letterSpacing: '0.04em', marginBottom: 4 }}>{service.name}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{service.description}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
          <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: accent }}>${service.price}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dimmer)', fontFamily: 'var(--font-mono)' }}>{service.deliveryTime}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {service.features?.map((f, i) => (
          <span key={i} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'var(--text-dim)'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

// Full Center Modal overlay for clean presentation of deliverables and execution roadmaps
function OrderResultModal({ order, business, accent, onClose }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    if (!order?.id) return;
    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${order.id}/roadmap`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order, business })
        });
        const data = await res.json();
        if (data.success) setRoadmap(data.roadmap);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [order?.id, business]);

  const phase = roadmap?.phases?.[activePhase];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(7,7,14,0.92)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
      animation: 'fadeIn 0.2s ease'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-2)',
        border: `1px solid ${accent}50`,
        borderRadius: 14, padding: 32,
        maxWidth: 820, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'fadeInUp 0.3s ease',
        boxShadow: `0 0 60px ${accent}20`
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: accent, letterSpacing: '0.12em', marginBottom: 4 }}>
              CONFIRMED ORDER & EXECUTION ROADMAP — #{order.id?.slice(0, 8)}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              {order.serviceName}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Customer: {order.customerName} ({order.customerEmail}) &nbsp;·&nbsp; Paid: ${order.price} Digital Credits
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            color: 'var(--text-dim)', borderRadius: 6, padding: '6px 14px',
            cursor: 'pointer', fontSize: 12
          }}>✕ Close</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `2px solid ${accent}`, borderTopColor: 'transparent',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }} />
            ArchitectAgent generating full execution roadmap...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Headline Banner */}
            <div style={{
              padding: 20, background: `${accent}08`,
              border: `1px solid ${accent}25`, borderRadius: 10
            }}>
              <div style={{
                fontSize: 18, fontWeight: 700, marginBottom: 8,
                background: `linear-gradient(135deg, #F0F0F8 0%, ${accent} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', lineHeight: 1.3
              }}>
                {roadmap?.headline || 'Your AI-Powered Business Service Activated'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                {roadmap?.summary}
              </div>
              {roadmap?.estimatedROI && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 12, padding: '5px 12px', borderRadius: 100,
                  background: `${accent}15`, border: `1px solid ${accent}35`,
                  fontSize: 12, fontFamily: 'var(--font-mono)', color: accent
                }}>
                  📈 Estimated ROI: <strong>{roadmap.estimatedROI}</strong>
                </div>
              )}
            </div>

            {/* Execution Phases */}
            {roadmap?.phases?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', letterSpacing: '0.1em', marginBottom: 12 }}>
                  DELIVERY PHASES
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {roadmap.phases.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhase(i)}
                      style={{
                        padding: '8px 16px', borderRadius: 6, fontSize: 12,
                        fontFamily: 'var(--font-mono)', cursor: 'pointer',
                        border: `1px solid ${activePhase === i ? (p.color || accent) : 'var(--border)'}`,
                        background: activePhase === i ? `${p.color || accent}18` : 'var(--bg-3)',
                        color: activePhase === i ? (p.color || accent) : 'var(--text-dim)',
                        transition: 'all 0.2s'
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: phase.color || accent }}>
                        {phase.icon} {phase.title}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', padding: '3px 10px', background: 'var(--bg-2)', borderRadius: 100 }}>
                        ⏱ {phase.timeline}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {phase.steps?.map((step, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            background: `${phase.color || accent}20`, border: `1px solid ${phase.color || accent}50`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: phase.color || accent, fontWeight: 700
                          }}>
                            {j + 1}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Outcomes */}
            {roadmap?.keyOutcomes?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', letterSpacing: '0.1em', marginBottom: 12 }}>
                  KEY DELIVERABLE OUTCOMES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {roadmap.keyOutcomes.map((outcome, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 14px', borderRadius: 8,
                      background: 'var(--bg-3)', border: '1px solid var(--border)'
                    }}>
                      <span style={{ fontSize: 20 }}>{outcome.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 2 }}>{outcome.metric}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{outcome.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
