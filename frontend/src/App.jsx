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
    // Load local cache immediately for zero-flicker UI
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
          // Check localStorage to restore empty backend
          const saved = localStorage.getItem('forgeos_business');
          if (saved) {
            const parsed = JSON.parse(saved);
            setBusiness(parsed);
            setView('storefront');
            
            const localOrders = localStorage.getItem('forgeos_orders') || '[]';
            const localLogs = localStorage.getItem('forgeos_logs') || '[]';
            
            // Restore backend with full database dump
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
      .catch(async () => {
        // Fallback to localStorage already set above
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
        
        // Defensive synchronization: prevent overwriting local state with empty responses from fresh containers
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
        setOrders([]);
        setLogs([]);
        setView('storefront');
        localStorage.setItem('forgeos_business', JSON.stringify(data.business));
        localStorage.setItem('forgeos_orders', '[]');
        localStorage.setItem('forgeos_logs', '[]');
      }
    } catch (err) {
      console.error(err);
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
    
    // If backend restarted and lost the business config, restore and retry once!
    if (data.error === 'No business active') {
      if (saved) {
        const b = JSON.parse(saved);
        const savedOrders = localStorage.getItem('forgeos_orders') || '[]';
        const savedLogs = localStorage.getItem('forgeos_logs') || '[]';
        
        // Restore business config
        await fetch(`${API}/business/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentBusiness: b,
            orders: JSON.parse(savedOrders),
            agentLogs: JSON.parse(savedLogs)
          })
        });
        
        // Retry placing order
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
