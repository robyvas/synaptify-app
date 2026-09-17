import { Transaction, Client } from '../../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegramMessage(text: string) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
  } catch (err) {
    console.warn('Telegram notify failed:', err);
  }
}

function ownershipLine(t: Transaction): string {
  if (!t.isCompany) return '👤 Personal';

  const split = t.companySplit;
  if (!split) return '🏢 Pe Firmă';

  if (split.type === 'robert') return '🏢 Pe Firmă (100% Robert)';
  if (split.type === 'iustin') return '🏢 Pe Firmă (100% Iustin)';
  if (split.type === 'both' && split.robertPercent === 50 && split.iustinPercent === 50) {
    return '🏢 Pe Firmă (50/50 Robert/Iustin)';
  }
  return `🏢 Pe Firmă (Robert ${split.robertAmount} RON / Iustin ${split.iustinAmount} RON)`;
}

export function notifyNewTransaction(t: Transaction) {
  const isExpense = t.type === 'expense';
  const emoji = isExpense ? '💸' : '💰';
  const label = isExpense ? 'Cheltuială Nouă' : 'Încasare Nouă';

  const msg = `${emoji} <b>${label}!</b>\n${t.amount} RON - ${escapeHtml(t.title)}\n${ownershipLine(t)}`;
  return sendTelegramMessage(msg);
}

export function notifyNewClient(c: Client) {
  let msg = `👤 <b>Client Nou Adăugat</b>\n`;
  msg += `🏢 ${escapeHtml(c.businessName)}\n`;
  msg += `📊 Status: ${escapeHtml(c.status)}\n`;
  if (c.notes) msg += `📝 <b>Notă:</b> <i>${escapeHtml(c.notes)}</i>`;
  return sendTelegramMessage(msg);
}

export function notifyClientUpdate(c: Client) {
  let msg = `🔄 <b>Update Client: ${escapeHtml(c.businessName)}</b>\n`;
  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `📈 Sales Status: ${escapeHtml(c.status)}\n`;
  msg += `⚙️ Tech Status: ${escapeHtml(c.techStatus)}\n`;
  if (c.notes) msg += `\n<b>📝 Notă Sales:</b>\n<i>${escapeHtml(c.notes)}</i>\n`;
  if (c.techNotes) msg += `\n<b>🛠️ Notă Tehnică:</b>\n<i>${escapeHtml(c.techNotes)}</i>\n`;
  return sendTelegramMessage(msg);
}
