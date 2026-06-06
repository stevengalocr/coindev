'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { useToast } from '@/components/ui/Toast';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { CreateSharedAccountModal } from '@/components/screens/CreateSharedAccountModal';
import { SharedTransactionModal } from '@/components/screens/SharedTransactionModal';
import {
  fetchSharedAccounts, fetchSharedTransactions,
  respondToSharedInvite, deleteSharedAccount,
  type DbSharedAccount, type DbSharedMember, type DbSharedTransaction,
} from '@/lib/db';
import { fmtMoney } from '@/lib/data';

type FullSharedAccount = DbSharedAccount & { members: DbSharedMember[] };
type AccountKind = 'received' | 'sent_pending' | 'rejected' | 'active';

function classifyAccount(acc: FullSharedAccount, myId: string): AccountKind | null {
  const myMember = acc.members.find(m => m.user_id === myId);
  if (!myMember) return null;
  if (myMember.status === 'pending') return 'received';
  if (myMember.status === 'rejected') return null; // I rejected — I don't see it
  // myMember is active
  if (myMember.role === 'owner') {
    const invitee = acc.members.find(m => m.user_id !== myId);
    if (!invitee) return 'active';
    if (invitee.status === 'pending')  return 'sent_pending';
    if (invitee.status === 'rejected') return 'rejected';
  }
  return 'active';
}

function MemberAvatar({ m, size = 28 }: { m: DbSharedMember; size?: number }) {
  const name = m.profile?.full_name ?? m.invited_email;
  const avatar = m.profile?.avatar_url;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const style: React.CSSProperties = { width: size, height: size, borderRadius: '50%', border: '2px solid var(--surface)', flexShrink: 0, overflow: 'hidden' };
  if (avatar?.startsWith('http')) return <img src={avatar} alt={name} title={name} style={{ ...style, objectFit: 'cover' }} />;
  if (avatar) return <div title={name} style={{ ...style, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: size * 0.5 }}>{avatar}</div>;
  return <div title={name} style={{ ...style, background: 'var(--gradient-hero)', display: 'grid', placeItems: 'center', fontSize: size * 0.35, fontWeight: 800, color: 'var(--btn-hero-text)', letterSpacing: '-0.02em' }}>{initials}</div>;
}

function SectionHeader({ icon, label, color, count }: { icon: string; label: string; color: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <Icon name={icon} size={13} style={{ color }} />
      <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text-4)', background: 'var(--surface-3)', borderRadius: 999, padding: '1px 7px', fontWeight: 600 }}>{count}</span>
    </div>
  );
}

export default function CuentasCompartidasPage() {
  const { lang } = useApp();
  const { user, refetch: refetchData } = useData();
  const toast = useToast();

  const [accounts, setAccounts] = useState<FullSharedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [txModal, setTxModal] = useState<{ accountId: string; name: string; balance: number; currency: string; type: 'deposit' | 'withdrawal' } | null>(null);
  const [movPanel, setMovPanel] = useState<{ account: FullSharedAccount } | null>(null);
  const [movTransactions, setMovTransactions] = useState<DbSharedTransaction[]>([]);
  const [movLoading, setMovLoading] = useState(false);

  const myId = user?.id ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    try { setAccounts(await fetchSharedAccounts()); }
    catch (e) { console.error('fetchSharedAccounts:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Partition accounts into 4 buckets
  const received    = accounts.filter(a => classifyAccount(a, myId) === 'received');
  const sentPending = accounts.filter(a => classifyAccount(a, myId) === 'sent_pending');
  const rejected    = accounts.filter(a => classifyAccount(a, myId) === 'rejected');
  const active      = accounts.filter(a => classifyAccount(a, myId) === 'active');

  async function respond(memberId: string, accept: boolean) {
    setActionId(memberId);
    try {
      await respondToSharedInvite(memberId, accept);
      toast(
        accept
          ? (lang === 'es' ? 'Cuenta compartida aceptada' : 'Shared account accepted')
          : (lang === 'es' ? 'Invitación rechazada' : 'Invitation declined'),
        accept ? 'success' : 'info',
      );
      await load();
    } catch {
      toast(lang === 'es' ? 'Error al responder' : 'Error responding', 'error');
    } finally { setActionId(null); }
  }

  async function deleteAccount(accountId: string) {
    setActionId(accountId);
    try {
      await deleteSharedAccount(accountId);
      toast(lang === 'es' ? 'Cuenta eliminada' : 'Account deleted', 'info');
      await load();
    } catch {
      toast(lang === 'es' ? 'Error al eliminar' : 'Error deleting', 'error');
    } finally { setActionId(null); }
  }

  async function openMovements(acc: FullSharedAccount) {
    setMovPanel({ account: acc });
    setMovLoading(true);
    try { setMovTransactions(await fetchSharedTransactions(acc.id)); }
    catch { setMovTransactions([]); }
    finally { setMovLoading(false); }
  }

  const isEmpty = received.length + sentPending.length + rejected.length + active.length === 0;

  // ── Render helpers ──────────────────────────────────────────────────────

  function renderReceivedCard(acc: FullSharedAccount) {
    const myMember = acc.members.find(m => m.user_id === myId)!;
    const owner = acc.members.find(m => m.role === 'owner');
    const ownerName = owner?.profile?.full_name ?? owner?.invited_email ?? '—';
    const busyMember = actionId === myMember.id;
    const busyAccount = actionId === acc.id;
    const busy = busyMember || busyAccount;
    return (
      <div key={acc.id} className="cd-card" style={{ overflow: 'hidden', background: 'color-mix(in oklab, var(--warn) 4%, var(--surface))' }}>
        {/* Info banner */}
        <div style={{ padding: '7px 14px', background: 'color-mix(in oklab, var(--warn) 10%, var(--surface-2))', borderBottom: '1px solid color-mix(in oklab, var(--warn) 22%, var(--border))', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="bell" size={12} style={{ color: 'var(--warn)', flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: 'var(--warn)', fontWeight: 600 }}>
            {lang === 'es' ? 'Tienes una invitación pendiente' : 'You have a pending invitation'}
          </span>
        </div>
        <div style={{ padding: '14px 16px' }}>
          {/* Account info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'color-mix(in oklab, var(--warn) 14%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--warn) 25%, var(--border))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="users" size={18} stroke={1.7} style={{ color: 'var(--warn)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {lang === 'es' ? 'De: ' : 'From: '}
                <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{ownerName}</span>
                {' · '}<span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{acc.currency}</span>
              </div>
            </div>
          </div>
          {/* Actions: Accept (full width), then Decline + Delete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => respond(myMember.id, true)} disabled={busy}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: busy ? 'var(--surface-3)' : 'var(--income-soft)', border: `1px solid ${busy ? 'var(--border)' : 'color-mix(in oklab, var(--income) 30%, transparent)'}`, color: busy ? 'var(--text-3)' : 'var(--income)', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {busyMember && !busy ? <Icon name="spark" size={14} /> : <Icon name="check" size={14} stroke={2.5} />}
              {lang === 'es' ? 'Aceptar invitación' : 'Accept invitation'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Decline = marks rejected, blocks future invites */}
              <button onClick={() => respond(myMember.id, false)} disabled={busy}
                title={lang === 'es' ? 'Rechazar bloquea futuras invitaciones de este usuario' : 'Declining blocks future invitations from this user'}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, opacity: busy ? 0.5 : 1 }}>
                {lang === 'es' ? 'Rechazar' : 'Decline'}
              </button>
              {/* Delete = removes completely, sender can re-invite */}
              <button onClick={() => deleteAccount(acc.id)} disabled={busy}
                title={lang === 'es' ? 'Eliminar borra la invitación sin bloquear al remitente' : 'Delete removes the invite without blocking the sender'}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: 'color-mix(in oklab, var(--expense) 8%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--expense) 20%, var(--border))', color: 'var(--expense)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: busy ? 0.5 : 1 }}>
                {busyAccount ? <Icon name="spark" size={12} /> : <Icon name="trash" size={12} stroke={1.8} />}
                {lang === 'es' ? 'Eliminar' : 'Delete'}
              </button>
            </div>
            {/* Helper text */}
            <div style={{ fontSize: 10.5, color: 'var(--text-4)', lineHeight: 1.4, paddingTop: 2 }}>
              {lang === 'es'
                ? '· Rechazar bloquea futuras invitaciones de este remitente · Eliminar borra sin bloquear'
                : '· Decline blocks future invitations from this sender · Delete removes without blocking'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderSentPendingCard(acc: FullSharedAccount) {
    const invitee = acc.members.find(m => m.user_id !== myId);
    const inviteeName = invitee?.profile?.full_name ?? invitee?.invited_email ?? '—';
    const inviteeEmail = invitee?.invited_email ?? '';
    const busy = actionId === acc.id;
    const sentDate = new Date(acc.created_at).toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short' });
    return (
      <div key={acc.id} className="cd-card" style={{ overflow: 'hidden' }}>
        {/* Info banner */}
        <div style={{ padding: '8px 14px', background: 'color-mix(in oklab, var(--warn) 8%, var(--surface-2))', borderBottom: '1px solid color-mix(in oklab, var(--warn) 20%, var(--border))', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="bell" size={12} style={{ color: 'var(--warn)', flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: 'var(--warn)', fontWeight: 600 }}>
            {lang === 'es' ? `Invitación enviada el ${sentDate} — esperando respuesta` : `Invitation sent on ${sentDate} — awaiting response`}
          </span>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'color-mix(in oklab, var(--cyan) 12%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--cyan) 22%, var(--border))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="send" size={17} stroke={1.8} style={{ color: 'var(--cyan)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lang === 'es' ? 'Para: ' : 'To: '}
              <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{inviteeName}</span>
              {inviteeName !== inviteeEmail && inviteeEmail && (
                <span style={{ color: 'var(--text-4)' }}>{` · ${inviteeEmail}`}</span>
              )}
            </div>
          </div>
          <button onClick={() => deleteAccount(acc.id)} disabled={busy}
            title={lang === 'es' ? 'Cancelar solicitud' : 'Cancel request'}
            style={{ height: 34, padding: '0 12px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, opacity: busy ? 0.5 : 1 }}>
            {busy ? <Icon name="spark" size={13} /> : <Icon name="trash" size={13} stroke={1.8} />}
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  function renderRejectedCard(acc: FullSharedAccount) {
    const invitee = acc.members.find(m => m.user_id !== myId);
    const inviteeName = invitee?.profile?.full_name ?? invitee?.invited_email ?? '—';
    const busy = actionId === acc.id;
    return (
      <div key={acc.id} className="cd-card" style={{ padding: '16px 18px', background: 'color-mix(in oklab, var(--expense) 4%, var(--surface))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--expense) 22%, var(--border))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="x" size={18} stroke={2} style={{ color: 'var(--expense)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              <span style={{ color: 'var(--expense)', fontWeight: 600 }}>
                {lang === 'es' ? 'Rechazada' : 'Declined'}
              </span>
              {' · '}
              {lang === 'es' ? `${inviteeName} rechazó la invitación` : `${inviteeName} declined the invitation`}
            </div>
          </div>
          <button onClick={() => deleteAccount(acc.id)} disabled={busy}
            style={{ height: 34, padding: '0 14px', borderRadius: 9, background: 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--expense) 30%, var(--border))', color: 'var(--expense)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, opacity: busy ? 0.5 : 1 }}>
            {busy ? <Icon name="spark" size={13} /> : <Icon name="trash" size={13} stroke={1.8} />}
            {lang === 'es' ? 'Eliminar' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }

  function renderActiveCard(acc: FullSharedAccount) {
    const activeMembers = acc.members.filter(m => m.status === 'active');
    const myRole = acc.members.find(m => m.user_id === myId)?.role;
    return (
      <div key={acc.id} className="cd-card" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in oklab, var(--cyan) 6%, var(--surface)) 0%, var(--surface) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'color-mix(in oklab, var(--cyan) 14%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--cyan) 25%, var(--border))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="users" size={19} stroke={1.7} style={{ color: 'var(--cyan)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex' }}>
                    {activeMembers.map((m, i) => (
                      <div key={m.id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: activeMembers.length - i }}>
                        <MemberAvatar m={m} size={26} />
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                    {activeMembers.length} {lang === 'es' ? 'miembro(s)' : 'member(s)'}
                  </span>
                  {myRole === 'owner' && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', background: 'color-mix(in oklab, var(--cyan) 12%, var(--surface-3))', borderRadius: 999, padding: '2px 7px', border: '1px solid color-mix(in oklab, var(--cyan) 20%, var(--border))' }}>
                      {lang === 'es' ? 'Creador' : 'Owner'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Balance</div>
              <MoneyText amount={acc.balance} currency={acc.currency} size={18} weight={800} type="income" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[
            { type: 'deposit' as const, label_es: 'Depositar', label_en: 'Deposit', icon: 'plus', color: 'var(--income)', hoverBg: 'var(--income-soft)' },
            { type: 'withdrawal' as const, label_es: 'Retirar', label_en: 'Withdraw', icon: 'minus', color: 'var(--expense)', hoverBg: 'color-mix(in oklab, var(--expense) 8%, transparent)' },
            { type: null, label_es: 'Movimientos', label_en: 'History', icon: 'list', color: 'var(--text-2)', hoverBg: 'var(--surface-2)' },
          ].map((action, i, arr) => (
            <button key={action.icon}
              onClick={() => action.type
                ? setTxModal({ accountId: acc.id, name: acc.name, balance: acc.balance, currency: acc.currency, type: action.type })
                : openMovements(acc)}
              style={{ flex: 1, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: action.color, background: 'transparent', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 140ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = action.hoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={action.icon} size={14} stroke={action.icon === 'plus' || action.icon === 'minus' ? 2.4 : 1.8} />
              {lang === 'es' ? action.label_es : action.label_en}
            </button>
          ))}
        </div>

        {/* Members */}
        <div style={{ padding: '12px 18px 0' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {lang === 'es' ? 'Miembros' : 'Members'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {acc.members.map(m => {
              const isMe = m.user_id === myId;
              const name = m.profile?.full_name ?? m.invited_email;
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MemberAvatar m={m} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isMe ? (lang === 'es' ? `${name} (tú)` : `${name} (you)`) : name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.invited_email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {m.role === 'owner' && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', background: 'color-mix(in oklab, var(--cyan) 10%, var(--surface-3))', borderRadius: 999, padding: '2px 7px', border: '1px solid color-mix(in oklab, var(--cyan) 18%, var(--border))' }}>
                        {lang === 'es' ? 'Creador' : 'Owner'}
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '2px 7px', color: m.status === 'active' ? 'var(--income)' : 'var(--warn)', background: m.status === 'active' ? 'var(--income-soft)' : 'color-mix(in oklab, var(--warn) 12%, var(--surface-3))', border: `1px solid ${m.status === 'active' ? 'color-mix(in oklab, var(--income) 25%, transparent)' : 'color-mix(in oklab, var(--warn) 25%, var(--border))'}` }}>
                      {m.status === 'active' ? (lang === 'es' ? 'Activo' : 'Active') : (lang === 'es' ? 'Pendiente' : 'Pending')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger zone: delete for both members */}
        <div style={{ padding: '12px 18px 14px', marginTop: 4, borderTop: '1px solid var(--border)' }}>
          {confirmDeleteId === acc.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--expense)', fontWeight: 600, textAlign: 'center' }}>
                {lang === 'es' ? '¿Eliminar esta cuenta para ambos miembros? Esta acción no se puede deshacer.' : 'Delete this account for both members? This cannot be undone.'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDeleteId(null)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}>
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button onClick={() => { setConfirmDeleteId(null); deleteAccount(acc.id); }} disabled={actionId === acc.id}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 9, background: 'color-mix(in oklab, var(--expense) 15%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--expense) 35%, var(--border))', color: 'var(--expense)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {actionId === acc.id ? <Icon name="spark" size={13} /> : <Icon name="trash" size={13} stroke={2} />}
                  {lang === 'es' ? 'Sí, eliminar' : 'Yes, delete'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDeleteId(acc.id)}
              style={{ width: '100%', padding: '8px 0', borderRadius: 9, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 140ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--expense) 40%, var(--border))'; e.currentTarget.style.color = 'var(--expense)'; e.currentTarget.style.background = 'color-mix(in oklab, var(--expense) 6%, transparent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name="trash" size={12} stroke={1.8} />
              {lang === 'es' ? 'Eliminar cuenta para ambos' : 'Delete account for both'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Page ────────────────────────────────────────────────────────────────
  return (
    <>
      <CreateSharedAccountModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { toast(lang === 'es' ? 'Invitación enviada' : 'Invitation sent', 'success'); load(); }}
      />
      {txModal && (
        <SharedTransactionModal
          open={!!txModal}
          onClose={() => setTxModal(null)}
          onSuccess={() => { toast(lang === 'es' ? 'Movimiento registrado' : 'Transaction recorded', 'success'); load(); refetchData(); }}
          sharedAccountId={txModal.accountId}
          sharedAccountName={txModal.name}
          sharedBalance={txModal.balance}
          sharedCurrency={txModal.currency}
          defaultType={txModal.type}
        />
      )}

      {/* Movements panel */}
      {movPanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
          onClick={() => setMovPanel(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440, background: 'var(--bg-2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', animation: 'cd-slide-right 220ms ease' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{movPanel.account.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {lang === 'es' ? 'Historial de movimientos' : 'Transaction history'}
                  {' · '}
                  <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{fmtMoney(movPanel.account.balance, movPanel.account.currency)}</span>
                </div>
              </div>
              <button onClick={() => setMovPanel(null)} style={{ color: 'var(--text-3)', padding: 6, borderRadius: 8 }}>
                <Icon name="x" size={18} stroke={2} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
              {movLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  <Icon name="spark" size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
                  {lang === 'es' ? 'Cargando…' : 'Loading…'}
                </div>
              ) : movTransactions.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: 'var(--text-3)' }}>
                    <Icon name="list" size={22} stroke={1.6} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    {lang === 'es' ? 'Sin movimientos' : 'No transactions yet'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {lang === 'es' ? 'Los movimientos aparecerán aquí.' : 'Transactions will appear here.'}
                  </div>
                </div>
              ) : movTransactions.map(tx => {
                const isDeposit = tx.type === 'deposit';
                const isMine = tx.user_id === myId;
                const userName = tx.profile?.full_name ?? tx.profile?.email ?? '—';
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: isDeposit ? 'var(--income-soft)' : 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))', border: `1px solid ${isDeposit ? 'color-mix(in oklab, var(--income) 30%, transparent)' : 'color-mix(in oklab, var(--expense) 30%, var(--border))'}` }}>
                      <Icon name={isDeposit ? 'plus' : 'minus'} size={15} stroke={2.2} style={{ color: isDeposit ? 'var(--income)' : 'var(--expense)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.description || (isDeposit ? (lang === 'es' ? 'Depósito' : 'Deposit') : (lang === 'es' ? 'Retiro' : 'Withdrawal'))}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                        {isMine ? (lang === 'es' ? 'Tú' : 'You') : userName}
                        {' · '}
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isDeposit ? 'var(--income)' : 'var(--expense)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {isDeposit ? '+' : '-'}{fmtMoney(tx.amount, movPanel.account.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main page */}
      <div className="page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
              {lang === 'es' ? 'Cuentas compartidas' : 'Shared accounts'}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              {lang === 'es' ? 'Administra fondos con otras personas' : 'Manage funds with other people'}
            </div>
          </div>
          <button onClick={() => setCreateOpen(true)}
            style={{ padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={15} stroke={2.4} />
            {lang === 'es' ? 'Nueva cuenta' : 'New account'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map(i => (
              <div key={i} className="cd-card" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-3)', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 13, borderRadius: 4, background: 'var(--surface-3)', width: '40%' }} />
                  <div style={{ height: 11, borderRadius: 4, background: 'var(--surface-3)', width: '25%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="cd-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
              <Icon name="users" size={28} stroke={1.5} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              {lang === 'es' ? 'Sin cuentas compartidas' : 'No shared accounts'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto 20px' }}>
              {lang === 'es'
                ? 'Crea una cuenta compartida e invita a alguien para administrar fondos juntos.'
                : 'Create a shared account and invite someone to manage funds together.'}
            </div>
            <button onClick={() => setCreateOpen(true)}
              style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="plus" size={14} stroke={2.4} />
              {lang === 'es' ? 'Crear cuenta compartida' : 'Create shared account'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 1. Invitaciones recibidas */}
            {received.length > 0 && (
              <div>
                <SectionHeader icon="bell" label={lang === 'es' ? 'Invitaciones recibidas' : 'Received invitations'} color="var(--warn)" count={received.length} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {received.map(renderReceivedCard)}
                </div>
              </div>
            )}

            {/* 2. Solicitudes enviadas (pendientes) */}
            {sentPending.length > 0 && (
              <div>
                <SectionHeader icon="send" label={lang === 'es' ? 'Solicitudes enviadas' : 'Sent requests'} color="var(--cyan)" count={sentPending.length} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sentPending.map(renderSentPendingCard)}
                </div>
              </div>
            )}

            {/* 3. Rechazadas */}
            {rejected.length > 0 && (
              <div>
                <SectionHeader icon="x" label={lang === 'es' ? 'Rechazadas' : 'Declined'} color="var(--expense)" count={rejected.length} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rejected.map(renderRejectedCard)}
                </div>
              </div>
            )}

            {/* 4. Activas */}
            {active.length > 0 && (
              <div>
                {(received.length + sentPending.length + rejected.length) > 0 && (
                  <SectionHeader icon="check" label={lang === 'es' ? 'Activas' : 'Active'} color="var(--income)" count={active.length} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {active.map(renderActiveCard)}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
