import { useState, useEffect } from 'react';

export default function Storefront({ business, onOrder, orders, onViewDashboard }) {
  const [selectedService, setSelectedService] = useState(null);
  const [orderForm, setOrderForm] = useState({ customerName: '', customerEmail: '', requirements: '' });
  const [orderState, setOrderState] = useState('idle'); // idle | submitting | success | error
  const [lastOrder, setLastOrder] = useState(null);
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
  const secondary = business.colorScheme?.secondary || '#FFB020';

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
        setOrderForm({ customerName: '', customerEmail: '', requirements: '' });
      } else {
        setOrderState('error');
      }
    } catch {
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
        body: JSON.stringify({ message: userMsg })
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
      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '48px 20px 56px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 48,
        position: 'relative'
      }}>
        {/* Business color accent */}
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
            AUTONOMOUS · LOCUS CHECKOUT ENABLED
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
          <span className="tag">✦ AI-Operated</span>
          <span className="tag">✦ Payments via Locus</span>
        </div>

        {/* Admin link */}
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
          ⚡ DASHBOARD
        </button>
      </div>

      {/* Main content: services + order form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
        {/* Services */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, letterSpacing: '0.12em', color: 'var(--text-dim)' }}>SERVICES</h2>
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

        {/* Sidebar: Order form + chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Order Panel */}
          <div className="card" style={{ borderColor: selectedService ? `${primary}40` : 'var(--border)' }}>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 16, letterSpacing: '0.08em' }}>
              PLACE ORDER
            </div>

            {!selectedService ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-dimmer)', fontSize: 13 }}>
                ← Select a service to order
              </div>
            ) : orderState === 'success' ? (
              <OrderSuccess order={lastOrder} accent={primary} onReset={() => { setOrderState('idle'); setSelectedService(null); setLastOrder(null); }} />
            ) : (
              <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: `${primary}10`,
                  border: `1px solid ${primary}30`,
                  borderRadius: 4, padding: '10px 12px', marginBottom: 4
                }}>
                  <div style={{ fontSize: 12, color: primary, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>Selected:</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedService.name}</div>
                  <div style={{ fontSize: 16, color: primary, marginTop: 2 }}>${selectedService.price}</div>
                </div>

                <input
                  className="input"
                  placeholder="Your name"
                  value={orderForm.customerName}
                  onChange={e => setOrderForm(f => ({ ...f, customerName: e.target.value }))}
                  required
                  style={{ fontSize: 13 }}
                />
                <input
                  className="input"
                  placeholder="Email for delivery"
                  type="email"
                  value={orderForm.customerEmail}
                  onChange={e => setOrderForm(f => ({ ...f, customerEmail: e.target.value }))}
                  required
                  style={{ fontSize: 13 }}
                />
                <textarea
                  className="input"
                  placeholder="Describe your requirements (optional)"
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
                    <>Connecting to Locus...</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Pay ${selectedService.price} via Locus
                    </>
                  )}
                </button>
                {orderState === 'error' && (
                  <div style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center' }}>
                    Something went wrong. Please try again.
                  </div>
                )}
              </form>
            )}
          </div>

          {/* AI Chat widget */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="pulse-dot" style={{ width: 6, height: 6 }} />
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                AI SALES AGENT
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

          {/* Recent orders mini */}
          {orders?.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 12, letterSpacing: '0.08em' }}>
                RECENT ORDERS ({orders.length})
              </div>
              {orders.slice(0, 3).map(o => (
                <div key={o.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12
                }}>
                  <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {o.customerName.split(' ')[0]}
                  </span>
                  <span style={{ color: primary }}>${o.price}</span>
                  <span className={`badge ${o.status === 'fulfilled' ? 'badge-active' : 'badge-pending'}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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

function OrderSuccess({ order, accent, onReset }) {
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(true);
  const [roadmapError, setRoadmapError] = useState(null);
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    if (!order?.id) return;
    const fetchRoadmap = async () => {
      setRoadmapLoading(true);
      try {
        const res = await fetch(`/api/orders/${order.id}/roadmap`, { method: 'POST' });
        const data = await res.json();
        if (data.success) setRoadmap(data.roadmap);
        else setRoadmapError('Could not generate roadmap.');
      } catch {
        setRoadmapError('Network error generating roadmap.');
      } finally {
        setRoadmapLoading(false);
      }
    };
    fetchRoadmap();
  }, [order?.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Success header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: `${accent}12`,
        border: `1px solid ${accent}30`,
        borderRadius: 8, marginBottom: 16
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `${accent}25`, border: `2px solid ${accent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 2 }}>
            Payment Confirmed ✦ ${order?.price}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            #{order?.id?.slice(0, 16)}...
          </div>
        </div>
      </div>

      {/* Roadmap section */}
      {roadmapLoading ? (
        <div style={{
          padding: '28px 0', textAlign: 'center',
          color: 'var(--text-dim)', fontSize: 12,
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `2px solid ${accent}`,
            borderTopColor: 'transparent',
            margin: '0 auto 12px',
            animation: 'spin 0.8s linear infinite'
          }} />
          ArchitectAgent generating your<br/>business development plan...
        </div>
      ) : roadmapError ? (
        <div style={{ padding: 12, color: 'var(--red)', fontSize: 12, textAlign: 'center' }}>
          {roadmapError}
        </div>
      ) : roadmap ? (
        <RoadmapPanel roadmap={roadmap} accent={accent} activePhase={activePhase} setActivePhase={setActivePhase} />
      ) : null}

      <button
        className="btn btn-ghost"
        onClick={onReset}
        style={{ width: '100%', justifyContent: 'center', marginTop: 16, fontSize: 12 }}
      >
        ← Place Another Order
      </button>
    </div>
  );
}

function RoadmapPanel({ roadmap, accent, activePhase, setActivePhase }) {
  const phase = roadmap.phases?.[activePhase];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Headline */}
      <div style={{
        fontSize: 13, fontWeight: 700, lineHeight: 1.4,
        background: `linear-gradient(135deg, #F0F0F8 0%, ${accent} 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {roadmap.headline}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        {roadmap.summary}
      </div>

      {/* ROI badge */}
      {roadmap.estimatedROI && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 100,
          background: `${accent}15`, border: `1px solid ${accent}35`,
          fontSize: 11, fontFamily: 'var(--font-mono)', color: accent,
          alignSelf: 'flex-start'
        }}>
          📈 ROI: {roadmap.estimatedROI}
        </div>
      )}

      {/* Phase tabs */}
      {roadmap.phases?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', letterSpacing: '0.08em' }}>
            EXECUTION PHASES
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {roadmap.phases.map((p, i) => (
              <button
                key={i}
                onClick={() => setActivePhase(i)}
                style={{
                  padding: '4px 10px', borderRadius: 4, fontSize: 10,
                  fontFamily: 'var(--font-mono)', cursor: 'pointer',
                  border: `1px solid ${activePhase === i ? (p.color || accent) : 'var(--border)'}`,
                  background: activePhase === i ? `${p.color || accent}18` : 'var(--bg-3)',
                  color: activePhase === i ? (p.color || accent) : 'var(--text-dim)',
                  transition: 'all 0.2s'
                }}
              >
                {p.icon} Phase {p.phase}
              </button>
            ))}
          </div>

          {phase && (
            <div style={{
              background: 'var(--bg-3)',
              border: `1px solid ${phase.color || accent}30`,
              borderRadius: 8, padding: 14,
              animation: 'fadeInUp 0.25s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: phase.color || accent }}>
                  {phase.icon} {phase.title}
                </div>
                <div style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: 'var(--text-dimmer)',
                  padding: '2px 8px', borderRadius: 100,
                  background: 'var(--bg-2)', border: '1px solid var(--border)'
                }}>
                  {phase.timeline}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {phase.steps?.map((step, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      background: `${phase.color || accent}20`,
                      border: `1px solid ${phase.color || accent}50`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: phase.color || accent, fontWeight: 700, marginTop: 1
                    }}>
                      {j + 1}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Outcomes */}
      {roadmap.keyOutcomes?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', letterSpacing: '0.08em' }}>
            KEY OUTCOMES
          </div>
          {roadmap.keyOutcomes.map((outcome, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 10px', borderRadius: 6,
              background: 'var(--bg-3)', border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{outcome.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: accent, marginBottom: 2 }}>
                  {outcome.metric}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  {outcome.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tools */}
      {roadmap.tools?.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', letterSpacing: '0.08em', marginBottom: 6 }}>
            TOOLS & TECHNOLOGY
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {roadmap.tools.map((tool, i) => (
              <span key={i} style={{
                padding: '3px 8px', borderRadius: 4,
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)'
              }}>
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {roadmap.nextSteps?.length > 0 && (
        <div style={{
          background: `${accent}08`, border: `1px solid ${accent}25`,
          borderRadius: 8, padding: 12
        }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: accent, letterSpacing: '0.08em', marginBottom: 8 }}>
            YOUR NEXT STEPS
          </div>
          {roadmap.nextSteps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              marginBottom: i < roadmap.nextSteps.length - 1 ? 6 : 0
            }}>
              <span style={{ color: accent, fontSize: 11, marginTop: 1, flexShrink: 0 }}>→</span>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{step}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
