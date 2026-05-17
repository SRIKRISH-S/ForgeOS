import { useState, useEffect, useCallback } from 'react';
import Launch from './pages/Launch.jsx';
import Storefront from './pages/Storefront.jsx';
import Dashboard from './pages/Dashboard.jsx';

const API = '/api';

export default function App() {
  const [view, setView] = useState('launch'); // 'launch' | 'storefront' | 'dashboard'
  const [business, setBusiness] = useState(null);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch business on load
  useEffect(() => {
    fetch(`${API}/business`)
      .then(r => r.json())
      .then(async (b) => { 
        if (b.id) { 
          setBusiness(b); 
          setView('storefront'); 
          localStorage.setItem('forgeos_business', JSON.stringify(b));
        } else {
          // Check localStorage
          const saved = localStorage.getItem('forgeos_business');
          if (saved) {
            const parsed = JSON.parse(saved);
            setBusiness(parsed);
            setView('storefront');
            // Restore backend
            await fetch(`${API}/business/restore`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: saved
            });
          }
        }
      })
      .catch(async () => {
        // Fallback to localStorage if server is offline/error
        const saved = localStorage.getItem('forgeos_business');
        if (saved) {
          const parsed = JSON.parse(saved);
          setBusiness(parsed);
          setView('storefront');
        }
      });
  }, []);

  // Poll logs and orders when business is active
  useEffect(() => {
    if (!business) return;
    const poll = setInterval(async () => {
      try {
        const [logsRes, ordersRes, walletRes] = await Promise.all([
          fetch(`${API}/logs`).then(r => r.json()),
          fetch(`${API}/orders`).then(r => r.json()),
          fetch(`${API}/finance/wallet`).then(r => r.json()),
        ]);
        
        // If the backend has reset and returned error 'No business active', restore it!
        if (logsRes.error === 'No business active' || ordersRes.error === 'No business active') {
          const saved = localStorage.getItem('forgeos_business');
          if (saved) {
            await fetch(`${API}/business/restore`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: saved
            });
          }
          return;
        }
        
        setLogs(logsRes);
        setOrders(ordersRes);
        setWallet(walletRes);
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [business]);

  const launchBusiness = useCallback(async (prompt) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/business/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
        setView('storefront');
        localStorage.setItem('forgeos_business', JSON.stringify(data.business));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const placeOrder = useCallback(async (orderData) => {
    let res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    let data = await res.json();
    
    // If backend restarted and lost the business config, restore and retry once!
    if (data.error === 'No business active') {
      const saved = localStorage.getItem('forgeos_business');
      if (saved) {
        const b = JSON.parse(saved);
        // Restore business config
        await fetch(`${API}/business/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(b)
        });
        // Retry placing order
        res = await fetch(`${API}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        data = await res.json();
      }
    }
    return data;
  }, []);

  const fulfillOrder = useCallback(async (orderId) => {
    const res = await fetch(`${API}/orders/${orderId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }, []);

  return (
    <div>
      <Nav view={view} setView={setView} business={business} />
      {view === 'launch' && (
        <Launch onLaunch={launchBusiness} loading={loading} />
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
    </div>
  );
}

function Nav({ view, setView, business }) {
  return (
    <nav className="nav">
      <div className="nav-logo">FORGE<span style={{color:'var(--text-dim)'}}>OS</span></div>
      
      <button
        className={`nav-link ${view === 'launch' ? 'active' : ''}`}
        onClick={() => setView('launch')}
      >
        Launch
      </button>
      
      {business && (
        <>
          <button
            className={`nav-link ${view === 'storefront' ? 'active' : ''}`}
            onClick={() => setView('storefront')}
          >
            Storefront
          </button>
          <button
            className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
        </>
      )}
      
      <div className="nav-spacer" />
      
      {business && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--lime)' }}>
            {business.businessName}
          </span>
          <span className="badge badge-active">LIVE</span>
        </div>
      )}
    </nav>
  );
}
