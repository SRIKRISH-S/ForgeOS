// ============================================================
// ForgeOS Plugin Framework & Tool Registry
// ============================================================
// Modular extension system allowing external agents (browser agents,
// email delivery plugins, CRM integrations, social media bots)
// and custom tool execution to plug seamlessly into ForgeOS.
// ============================================================

import { readDb, updateDb } from '../database.js';

// Default registered plugins in ForgeOS OS
const DEFAULT_PLUGINS = [
  {
    id: 'plugin_browser_agent',
    name: 'Browser Agent (Puppeteer / Playwright)',
    category: 'Automation',
    description: 'Autonomous web navigation, competitor scraping, and automated form submission.',
    status: 'active',
    version: '1.4.0',
    capabilities: ['web_scraping', 'form_fill', 'screenshot_capture', 'element_click'],
    author: 'ForgeOS Core'
  },
  {
    id: 'plugin_email_agent',
    name: 'Nodemailer / SendGrid Email Gateway',
    category: 'Communication',
    description: 'Transactional email delivery, HTML template rendering, and test preview generation.',
    status: 'active',
    version: '2.1.0',
    capabilities: ['send_email', 'render_template', 'track_delivery'],
    author: 'ForgeOS Core'
  },
  {
    id: 'plugin_crm_integration',
    name: 'HubSpot / Salesforce CRM Sync',
    category: 'Integrations',
    description: 'Syncs customer profiles, order history, and satisfaction scores into external CRM platforms.',
    status: 'active',
    version: '1.0.2',
    capabilities: ['sync_contact', 'create_deal', 'update_lead_score'],
    author: 'ForgeOS Ecosystem'
  },
  {
    id: 'plugin_social_agent',
    name: 'Social Media Auto-Publisher',
    category: 'Marketing',
    description: 'Autonomous content creation and posting across X/Twitter, LinkedIn, and Instagram.',
    status: 'active',
    version: '1.2.0',
    capabilities: ['generate_post', 'schedule_publication', 'track_engagement'],
    author: 'ForgeOS Marketing'
  },
  {
    id: 'plugin_locus_checkout',
    name: 'Locus Autonomous Wallet Gateway',
    category: 'Finance',
    description: 'Direct integration with Locus Checkout sessions and wallet revenue routing.',
    status: 'active',
    version: '3.0.0',
    capabilities: ['create_checkout', 'verify_webhook', 'get_balance'],
    author: 'Locus Finance'
  }
];

/**
 * Returns all active plugins registered in ForgeOS.
 */
export async function getRegisteredPlugins() {
  const db = await readDb();
  return db.registeredPlugins || DEFAULT_PLUGINS;
}

/**
 * Registers a new plugin agent or tool into the ForgeOS OS.
 */
export async function registerPlugin(pluginConfig) {
  return await updateDb(db => {
    if (!db.registeredPlugins) db.registeredPlugins = [...DEFAULT_PLUGINS];

    const idx = db.registeredPlugins.findIndex(p => p.id === pluginConfig.id);
    if (idx !== -1) {
      db.registeredPlugins[idx] = { ...db.registeredPlugins[idx], ...pluginConfig };
    } else {
      db.registeredPlugins.push({
        ...pluginConfig,
        status: pluginConfig.status || 'active',
        version: pluginConfig.version || '1.0.0'
      });
    }
    return db.registeredPlugins;
  });
}

/**
 * Executes a capability on a registered plugin.
 */
export async function executePluginAction(pluginId, capability, payload) {
  const plugins = await getRegisteredPlugins();
  const plugin = plugins.find(p => p.id === pluginId);

  if (!plugin) {
    throw new Error(`Plugin '${pluginId}' not found.`);
  }

  if (!plugin.capabilities.includes(capability)) {
    throw new Error(`Plugin '${pluginId}' does not support capability '${capability}'.`);
  }

  // Simulated execution response
  return {
    success: true,
    pluginId,
    capability,
    executedAt: new Date().toISOString(),
    output: `Capability '${capability}' executed successfully via ${plugin.name}.`
  };
}
