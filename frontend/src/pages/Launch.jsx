import { useState, useEffect } from 'react';

const PRESETS = [
  { icon: '🤖', title: 'AI SaaS UX Audit', prompt: 'Premium UX and CRO audit service for SaaS landing pages and web apps' },
  { icon: '⚡', title: 'Shopify SEO Agency', prompt: 'Technical SEO audit and conversion optimization service for e-commerce Shopify stores' },
  { icon: '🎨', title: 'Startup Brand Studio', prompt: 'AI-driven brand identity, minimalist logo design, and brand guideline studio for tech startups' },
  { icon: '📈', title: 'B2B Content Engine', prompt: 'High-converting LinkedIn thought leadership and B2B blog copywriting agency' }
];

const COLLABORATIVE_AGENT_STEPS = [
  { agent: 'OrchestratorAgent', msg: 'Decomposing prompt & retrieving MemoryAgent learnings...' },
  { agent: 'ArchitectAgent', msg: 'Formulating initial brand identity and service tier hierarchy...' },
  { agent: 'FinanceAgent', msg: 'Auditing pricing elasticity, margins, and digital wallet revenue routing...' },
  { agent: 'SalesAgent', msg: 'Simulating customer demand & predicting storefront conversion...' },
  { agent: 'ArchitectAgent', msg: 'Applying inter-agent adjustments to service descriptions...' },
  { agent: 'ReflectionAgent', msg: 'Executing quality audit & vulnerability validation...' },
  { agent: 'CEOAgent', msg: 'Granting executive launch authorization & deploying storefront...' }
];

export default function Launch({ onLaunch, loading }) {
  const [prompt, setPrompt] = useState('');
  const [typedExample, setTypedExample] = useState('');
  const [typing, setTyping] = useState(true);
  const [agentStep, setAgentStep] = useState(0);

  useEffect(() => {
    if (loading) return;
    const example = PRESETS[0].prompt;
    let i = 0;
    setTypedExample('');
    setTyping(true);
    const typer = setInterval(() => {
      i++;
      setTypedExample(example.slice(0, i));
      if (i >= example.length) {
        clearInterval(typer);
        setTyping(false);
      }
    }, 35);
    return () => clearInterval(typer);
  }, [loading]);

  useEffect(() => {
    if (!loading) { setAgentStep(0); return; }
    const interval = setInterval(() => setAgentStep(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;
    onLaunch(prompt.trim());
  };

  const handlePresetClick = (presetPrompt) => {
    setPrompt(presetPrompt);
    onLaunch(presetPrompt);
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', paddingBottom: 60 }}>

      {/* Background ambient lighting */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(170,255,0,0.05) 0%, rgba(0,232,204,0.02) 50%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 780, animation: 'fadeInUp 0.6s ease', position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 100,
              border: '1px solid var(--lime-glow)',
              background: 'var(--lime-dim)',
            }}>
              <div className="pulse-dot" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                ForgeOS Autonomous Operating System
              </span>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 100,
              border: '1px solid rgba(255,176,32,0.4)',
              background: 'rgba(255,176,32,0.12)',
              fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '0.08em'
            }}>
              🏆 1-CLICK DEMO READY
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(34px, 5vw, 58px)',
            lineHeight: 1.1,
            letterSpacing: '0.08em',
            marginBottom: 16,
            background: 'linear-gradient(135deg, #FFFFFF 0%, var(--lime) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ONE PROMPT.<br />AUTONOMOUS ENTERPRISE.
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text-dim)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            Type any digital service idea. ForgeOS orchestrates 8 collaborating AI agents that build, sell, deliver, reflect, and grow it 24/7.
          </p>
        </div>

        {/* 1-Click Preset Demos for Judges */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', textAlign: 'center', marginBottom: 12, letterSpacing: '0.1em' }}>
            ⚡ 1-CLICK DEMO PRESETS FOR INSTANT LAUNCH
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset.prompt)}
                disabled={loading}
                style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '12px 10px', textAlign: 'left',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: 4
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--lime)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 18 }}>{preset.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{preset.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dimmer)', lineHeight: 1.3 }}>Click to launch ↗</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <div style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 6,
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
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
                {prompt.length > 0 ? `${prompt.length} chars · Press ↵ to launch` : 'Or type your custom business idea'}
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
                    Orchestrating 8 Agents...
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

        {/* Agent loading & collaborative negotiation trace */}
        {loading && (
          <div style={{ marginTop: 32, animation: 'fadeInUp 0.4s ease' }}>
            <div className="card" style={{ borderColor: 'var(--lime-glow)', boxShadow: '0 0 30px rgba(170,255,0,0.1)' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', marginBottom: 16, letterSpacing: '0.1em' }}>
                ⚡ MULTI-AGENT COLLABORATIVE NEGOTIATION IN PROGRESS
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

        {/* How it works grid */}
        {!loading && (
          <div style={{ marginTop: 44 }}>
            <div style={{ textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dimmer)', marginBottom: 20, letterSpacing: '0.1em' }}>
              8 COLLABORATING AI AGENTS AT WORK
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { icon: '🧠', label: 'Orchestrator', desc: 'Central brain & self-healing error retries' },
                { icon: '💾', label: 'MemoryAgent', desc: 'Long-term customer & knowledge store' },
                { icon: '🔍', label: 'ReflectionAgent', desc: 'Quality audit & continuous learning loop' },
                { icon: '👑', label: 'CEOAgent', desc: 'Background autonomy, pricing & growth' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'var(--bg-2)', padding: '18px 14px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--lime)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{item.desc}</div>
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
