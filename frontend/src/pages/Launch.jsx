import { useState, useEffect } from 'react';

const EXAMPLES = [
  "Premium SEO audit service for e-commerce stores",
  "AI-powered social media content agency for SaaS startups",
  "Logo design studio specializing in minimalist tech brands",
  "Business plan writing service for first-time entrepreneurs",
  "UX audit service for mobile apps and landing pages",
  "Email copywriting agency for D2C brands"
];

const COLLABORATIVE_AGENT_STEPS = [
  { agent: 'OrchestratorAgent', msg: 'Decomposing prompt & retrieving MemoryAgent learnings...' },
  { agent: 'ArchitectAgent', msg: 'Formulating initial brand identity and service tier hierarchy...' },
  { agent: 'FinanceAgent', msg: 'Auditing pricing elasticity, margins, and digital wallet revenue routing...' },
  { agent: 'SalesAgent', msg: 'Simulating customer demand & predicting storefront conversion...' },
  { agent: 'ArchitectAgent', msg: 'Applying inter-agent adjustments to service descriptions...' },
  { agent: 'ReflectionAgent', msg: 'Executing quality audit & vulnerability validation...' },
  { agent: 'CEOAgent', msg: 'Granting executive launch approval & deploying storefront...' }
];

export default function Launch({ onLaunch, loading }) {
  const [prompt, setPrompt] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);
  const [typedExample, setTypedExample] = useState('');
  const [typing, setTyping] = useState(true);
  const [agentStep, setAgentStep] = useState(0);

  // Cycle through example prompts with typing effect
  useEffect(() => {
    if (loading) return;
    const example = EXAMPLES[exampleIdx % EXAMPLES.length];
    let i = 0;
    setTypedExample('');
    setTyping(true);
    const typer = setInterval(() => {
      i++;
      setTypedExample(example.slice(0, i));
      if (i >= example.length) {
        clearInterval(typer);
        setTyping(false);
        setTimeout(() => setExampleIdx(n => n + 1), 2500);
      }
    }, 40);
    return () => clearInterval(typer);
  }, [exampleIdx, loading]);

  // Animate multi-agent collaborative steps during loading
  useEffect(() => {
    if (!loading) { setAgentStep(0); return; }
    const interval = setInterval(() => setAgentStep(n => n + 1), 1100);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onLaunch(prompt.trim());
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', gap: 0 }}>

      {/* Glowing orb background accent */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(170,255,0,0.04) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 720, animation: 'fadeInUp 0.6s ease' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 100,
            border: '1px solid var(--lime-glow)',
            background: 'var(--lime-dim)',
            marginBottom: 24
          }}>
            <div className="pulse-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Autonomous Business Operating System
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            lineHeight: 1.1,
            letterSpacing: '0.08em',
            marginBottom: 20,
            background: 'linear-gradient(135deg, #F0F0F8 0%, var(--lime) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ONE PROMPT.<br />AUTONOMOUS BUSINESS.
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text-dim)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Describe any digital service business. ForgeOS deploys 8 collaborating AI agents that plan, reason, execute, reflect, and grow it autonomously.
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <div style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 4,
            transition: 'border-color 0.2s',
            ...(prompt ? { borderColor: 'var(--lime-glow)' } : {})
          }}>
            <textarea
              className="input"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={typedExample + (typing ? '|' : '')}
              disabled={loading}
              rows={3}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                lineHeight: 1.6,
                resize: 'none',
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
              <span style={{ fontSize: 11, color: 'var(--text-dimmer)', fontFamily: 'var(--font-mono)' }}>
                {prompt.length > 0 ? `${prompt.length} chars · Press ↵ to launch` : 'Describe your business idea'}
              </span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!prompt.trim() || loading}
                style={{ fontSize: 12 }}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size={14} />
                    Orchestrating Agents...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Launch Autonomous Business
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Agent loading & negotiation trace animation */}
        {loading && (
          <div style={{ marginTop: 32, animation: 'fadeInUp 0.4s ease' }}>
            <div className="card">
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', marginBottom: 16, letterSpacing: '0.1em' }}>
                COLLABORATIVE AGENT NEGOTIATION IN PROGRESS
              </div>
              {COLLABORATIVE_AGENT_STEPS.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
                  borderBottom: i < COLLABORATIVE_AGENT_STEPS.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: agentStep >= i ? 1 : 0.25,
                  transition: 'opacity 0.4s'
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: agentStep >= i ? 'var(--lime-dim)' : 'var(--bg-3)',
                    border: `1px solid ${agentStep >= i ? 'var(--lime-glow)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2, transition: 'all 0.4s'
                  }}>
                    {agentStep >= i && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: agentStep >= i ? 'var(--lime)' : 'var(--text-dim)', marginBottom: 2 }}>
                      {item.agent}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{item.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        {!loading && (
          <div style={{ marginTop: 48 }}>
            <div style={{ textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', marginBottom: 24, letterSpacing: '0.1em' }}>
              COLLABORATIVE AGENT ARCHITECTURE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border)' }}>
              {[
                { icon: '🧠', label: 'Orchestrator', desc: 'Coordinates 8 agents, plans tasks & handles self-healing retries' },
                { icon: '💾', label: 'MemoryAgent', desc: 'Stores customer history & learnings retrieved before decisions' },
                { icon: '🔍', label: 'ReflectionAgent', desc: 'Audits execution outcomes & continuously improves quality' },
                { icon: '👑', label: 'CEOAgent', desc: 'Runs continuous background autonomy, pricing & growth' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'var(--bg-2)', padding: '20px 16px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
