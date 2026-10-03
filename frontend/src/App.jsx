import { useState, useEffect, useCallback } from 'react';
import Launch from './pages/Launch.jsx';
import Storefront from './pages/Storefront.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MemoryPage from './pages/MemoryPage.jsx';
import CEODashboard from './pages/CEODashboard.jsx';
import ArchitecturePage from './pages/ArchitecturePage.jsx';
import { API } from './api.js';

export default function App() {
  const [view, setView] = useState('launch'); // 'launch' | 'storefront' | 'dashboard' | 'memory' | 'ceo' | 'architecture'
  const [business, setBusiness] = useState(null);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch business on load
  useEffect(() => {
    const savedBus = localStorage.getItem('forgeos_business');
    const savedOrders = localStorage.getItem('forgeos_orders');
    const savedLogs = localStorage.getItem('forgeos_logs');
    
    if (savedBus) {
      const parsedBus = JSON.parse(savedBus);
      setBusiness(parsedBus);
      setView('storefront');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    }

    fetch(`${API}/business`)
      .then(r => r.json())
      .then(async (b) => { 
        if (b.id) { 
          setBusiness(b); 
          setView('storefront'); 
          localStorage.setItem('forgeos_business', JSON.stringify(b));
        } else {
          const saved = localStorage.getItem('forgeos_business');
          if (saved) {
            const parsed = JSON.parse(saved);
            setBusiness(parsed);
            setView('storefront');
            
            const localOrders = localStorage.getItem('forgeos_orders') || '[]';
            const localLogs = localStorage.getItem('forgeos_logs') || '[]';
            
            await fetch(`${API}/business/restore`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentBusiness: parsed,
                orders: JSON.parse(localOrders),
                agentLogs: JSON.parse(localLogs)
              })
            });
          }
        }
      })
      .catch(async () => {});
  }, []);

  // Poll logs, orders, and wallet when business is active
  useEffect(() => {
    if (!business) return;
    const poll = setInterval(async () => {
      try {
        const [logsRes, ordersRes, walletRes] = await Promise.all([
          fetch(`${API}/logs`).then(r => r.json().catch(() => ({ error: 'No business active' }))),
          fetch(`${API}/orders`).then(r => r.json().catch(() => ({ error: 'No business active' }))),
          fetch(`${API}/finance/wallet`).then(r => r.json().catch(() => ({ error: 'No business active' }))),
        ]);
        
        if (logsRes.error === 'No business active' || ordersRes.error === 'No business active') {
          const saved = localStorage.getItem('forgeos_business');
          if (saved) {
            const parsed = JSON.parse(saved);
            const savedOrders = localStorage.getItem('forgeos_orders') || '[]';
            const savedLogs = localStorage.getItem('forgeos_logs') || '[]';
            
            await fetch(`${API}/business/restore`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentBusiness: parsed,
                orders: JSON.parse(savedOrders),
                agentLogs: JSON.parse(savedLogs)
              })
            });
          }
          return;
        }
        
        if (Array.isArray(logsRes) && (logsRes.length >= logs.length || logs.length === 0)) {
          setLogs(logsRes);
          localStorage.setItem('forgeos_logs', JSON.stringify(logsRes));
        }
        
        if (Array.isArray(ordersRes) && (ordersRes.length >= orders.length || orders.length === 0)) {
          setOrders(ordersRes);
          localStorage.setItem('forgeos_orders', JSON.stringify(ordersRes));
        }
        
        if (walletRes && !walletRes.error) {
          setWallet(walletRes);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [business, orders.length, logs.length]);

  const [launchError, setLaunchError] = useState('');

  const launchBusiness = useCallback(async (prompt) => {
    setLoading(true);
    setLaunchError('');
    try {
      const res = await fetch(`${API}/business/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success && data.business) {
        setBusiness(data.business);
        setOrders([]);
        setLogs([]);
        setView('storefront');
        localStorage.setItem('forgeos_business', JSON.stringify(data.business));
        localStorage.setItem('forgeos_orders', '[]');
        localStorage.setItem('forgeos_logs', '[]');
      } else {
        setLaunchError(data.error || 'Failed to launch business. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setLaunchError('Network error — backend may be starting up. Please wait 10s and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const placeOrder = useCallback(async (orderData) => {
    const saved = localStorage.getItem('forgeos_business');
    const businessObj = saved ? JSON.parse(saved) : null;
    
    let res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        business: businessObj
      })
    });
    let data = await res.json();
    
    if (data.error === 'No business active' && saved) {
      const b = JSON.parse(saved);
      const savedOrders = localStorage.getItem('forgeos_orders') || '[]';
      const savedLogs = localStorage.getItem('forgeos_logs') || '[]';
      
      await fetch(`${API}/business/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBusiness: b,
          orders: JSON.parse(savedOrders),
          agentLogs: JSON.parse(savedLogs)
        })
      });
      
      res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          business: b
        })
      });
      data = await res.json();
    }
    
    if (data.success && data.order) {
      setOrders(prev => {
        const updated = [...prev, data.order];
        localStorage.setItem('forgeos_orders', JSON.stringify(updated));
        return updated;
      });
    }
    return data;
  }, []);

  const fulfillOrder = useCallback(async (orderId) => {
    const saved = localStorage.getItem('forgeos_business');
    const businessObj = saved ? JSON.parse(saved) : null;
    const orderObj = orders.find(o => o.id === orderId);
    
    const res = await fetch(`${API}/orders/${orderId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business: businessObj,
        order: orderObj
      })
    });
    const data = await res.json();
    
    if (data.success && data.order) {
      setOrders(prev => {
        const updated = prev.map(o => o.id === orderId ? data.order : o);
        localStorage.setItem('forgeos_orders', JSON.stringify(updated));
        return updated;
      });
    }
    return data;
  }, [orders]);

  // PWA & Mobile App State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <div className="app-container">
      <Nav 
        view={view} 
        setView={setView} 
        business={business} 
        onOpenInstall={handleInstallClick}
        isStandalone={isStandalone}
      />
      
      <main className="main-content">
        {view === 'launch' && (
          <Launch onLaunch={launchBusiness} loading={loading} error={launchError} />
        )}
        {view === 'storefront' && (
          <Storefront
            business={business}
            onOrder={placeOrder}
            orders={orders}
            onViewDashboard={() => setView('dashboard')}
          />
        )}
        {view === 'dashboard' && (
          <Dashboard
            business={business}
            orders={orders}
            logs={logs}
            wallet={wallet}
            onFulfill={fulfillOrder}
            onViewStorefront={() => setView('storefront')}
          />
        )}
        {view === 'memory' && (
          <MemoryPage business={business} />
        )}
        {view === 'ceo' && (
          <CEODashboard business={business} />
        )}
        {view === 'architecture' && (
          <ArchitecturePage business={business} />
        )}
      </main>

      {/* Mobile Bottom Dock (App Bar) */}
      <MobileBottomNav view={view} setView={setView} business={business} />

      {/* PWA Phone Install Guide Modal */}
      {showInstallModal && (
        <InstallModal 
          onClose={() => setShowInstallModal(false)}
          deferredPrompt={deferredPrompt}
          onNativeInstall={handleInstallClick}
        />
      )}
    </div>
  );
}

function Nav({ view, setView, business, onOpenInstall, isStandalone }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (v) => {
    setView(v);
    setMenuOpen(false);
  };

  return (
    <nav className="nav">
      <div 
        className="nav-logo" 
        onClick={() => setView(business ? 'storefront' : 'launch')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <img 
          src="/icon-192.png" 
          alt="ForgeOS App Logo" 
          className="nav-logo-badge"
          onError={(e) => { e.target.src = '/favicon.svg'; }}
        />
        <span>FORGE<span style={{ color: 'var(--lime)' }}>OS</span></span>
      </div>
      
      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {menuOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
          )}
        </svg>
      </button>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <button
          className={`nav-link ${view === 'launch' ? 'active' : ''}`}
          onClick={() => navigate('launch')}
        >
          Launch
        </button>
        
        {business && (
          <>
            <button
              className={`nav-link ${view === 'storefront' ? 'active' : ''}`}
              onClick={() => navigate('storefront')}
            >
              Storefront
            </button>
            <button
              className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => navigate('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-link ${view === 'memory' ? 'active' : ''}`}
              onClick={() => navigate('memory')}
            >
              Memory
            </button>
            <button
              className={`nav-link ${view === 'ceo' ? 'active' : ''}`}
              onClick={() => navigate('ceo')}
            >
              CEO
            </button>
            <button
              className={`nav-link ${view === 'architecture' ? 'active' : ''}`}
              onClick={() => navigate('architecture')}
            >
              Architecture
            </button>
          </>
        )}
      </div>
      
      <div className="nav-spacer" />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isStandalone && (
          <button 
            className="btn-install-app" 
            onClick={onOpenInstall}
            title="Install ForgeOS on phone / desktop"
          >
            <span className="install-pulse-icon">📱</span>
            <span className="install-label">App</span>
          </button>
        )}

        {business && (
          <div className="nav-status">
            <div className="pulse-dot" />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--lime)' }}>
              {business.businessName}
            </span>
            <span className="badge badge-active">AUTONOMOUS</span>
          </div>
        )}
      </div>
    </nav>
  );
}

function MobileBottomNav({ view, setView, business }) {
  const tabs = [
    { id: 'launch', label: 'Launch', icon: '🚀' },
    ...(business ? [
      { id: 'storefront', label: 'Store', icon: '🛍' },
      { id: 'dashboard', label: 'Ops', icon: '⚡' },
      { id: 'memory', label: 'Memory', icon: '💾' },
      { id: 'ceo', label: 'CEO', icon: '👑' },
      { id: 'architecture', label: 'Arch', icon: '🌐' }
    ] : [])
  ];

  return (
    <nav className="mobile-bottom-dock">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`mobile-dock-btn ${view === tab.id ? 'active' : ''}`}
          onClick={() => setView(tab.id)}
        >
          <span className="dock-icon">{tab.icon}</span>
          <span className="dock-label">{tab.label}</span>
          {view === tab.id && <span className="dock-indicator" />}
        </button>
      ))}
    </nav>
  );
}

function InstallModal({ onClose, deferredPrompt, onNativeInstall }) {
  const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="card install-modal-card" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 420,
          width: '92%',
          background: 'linear-gradient(180deg, #131325 0%, #07070E 100%)',
          border: '1px solid var(--lime-glow)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(170,255,0,0.15)',
          borderRadius: 16,
          padding: 24,
          textAlign: 'center',
          animation: 'fadeInUp 0.3s ease'
        }}
      >
        {/* App Icon preview */}
        <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 16px' }}>
          <div style={{
            position: 'absolute', inset: -4,
            borderRadius: 22,
            background: 'linear-gradient(135deg, var(--lime), var(--cyan))',
            filter: 'blur(8px)',
            opacity: 0.7
          }} />
          <img 
            src="/icon-192.png" 
            alt="ForgeOS App" 
            style={{
              position: 'relative',
              width: 90, height: 90,
              borderRadius: 20,
              border: '2px solid rgba(255,255,255,0.2)',
              objectFit: 'cover'
            }}
            onError={(e) => { e.target.src = '/favicon.svg'; }}
          />
        </div>

        <h3 style={{ fontSize: 20, marginBottom: 8, color: '#FFF' }}>
          Install ForgeOS App
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.5 }}>
          Run ForgeOS as a standalone mobile app with full-screen autonomy and the official app icon on your phone!
        </p>

        {isIOS ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'left',
            marginBottom: 20,
            fontSize: 13
          }}>
            <div style={{ fontWeight: 600, color: 'var(--lime)', marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              📱 iPhone / iPad Setup:
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
              <span style={{ background: 'var(--lime-dim)', color: 'var(--lime)', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>1</span>
              <span>Tap the <strong>Share</strong> button at bottom of Safari <span style={{ fontSize: 16 }}>📤</span></span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
              <span style={{ background: 'var(--lime-dim)', color: 'var(--lime)', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>2</span>
              <span>Scroll down and tap <strong>"Add to Home Screen"</strong> ➕</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ background: 'var(--lime-dim)', color: 'var(--lime)', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>3</span>
              <span>Tap <strong>Add</strong>. Open ForgeOS directly from your phone!</span>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'left',
            marginBottom: 20,
            fontSize: 13
          }}>
            <div style={{ fontWeight: 600, color: 'var(--lime)', marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              📱 Android / Chrome Setup:
            </div>
            <p style={{ marginBottom: 12, color: 'var(--text-dim)', fontSize: 12 }}>
              Install directly to your home screen or app drawer with the ForgeOS logo icon:
            </p>
            {deferredPrompt ? (
              <button 
                className="btn btn-primary" 
                onClick={onNativeInstall}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                ⚡ Install to Phone Now
              </button>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Tap the browser menu <strong>(⋮)</strong> and select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
              </div>
            )}
          </div>
        )}

        <button 
          className="btn btn-ghost" 
          onClick={onClose}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}


