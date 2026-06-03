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
  fetchSharedAccounts, fetchSharedTransactions, respondToSharedInvite,
  type DbSharedAccount, type DbSharedMember, type DbSharedTransaction,
} from '@/lib/db';
import { fmtMoney } from '@/lib/data';

type FullSharedAccount = DbSharedAccount & { members: DbSharedMember[] };

function MemberAvatar({ m }: { m: DbSharedMember }) {
  const name = m.profile?.full_name ?? m.invited_email;
  const avatar = m.profile?.avatar_url;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (avatar?.startsWith('http')) {
    return <img src={avatar} alt={name} title={name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--surface)', flexShrink: 0 }} />;
  }
  if (avatar) {
    return <div title={name} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)', border: '2px solid var(--surface)', display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>{avatar}</div>;
  }
  return <div title={name} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-hero)', border: '2px solid var(--surface)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, color: 'var(--btn-hero-text)', flexShrink: 0, letterSpacing: '-0.02em' }}>{initials}</div>;
}

export default function CuentasCompartidasPage() {
  const { lang } = useApp();
  const { user, refetch: refetchData } = useData();
  const toast = useToast();

  const [accounts, setAccounts] = useState<FullSharedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Transaction modal
  const [txModal, setTxModal] = useState<{ accountId: string; name: string; balance: number; currency: string; type: 'deposit' | 'withdrawal' } | null>(null);

  // Movements panel
  const [movPanel, setMovPanel] = useState<{ account: FullSharedAccount } | null>(null);
  const [movTransactions, setMovTransactions] = useState<DbSharedTransaction[]>([]);
  const [movLoading, setMovLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSharedAccounts();
      setAccounts(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function respond(memberId: string, accept: boolean) {
    setRespondingId(memberId);
    try {
      await respondToSharedInvite(memberId, accept);
      toast(
        accept
          ? (lang === 'es' ? 'Cuenta compartida aceptada' : 'Shared account accepted')
          : (lang === 'es' ? 'Invitación rechazada' : 'Invitation rejected'),
        accept ? 'success' : 'info'
      );
      await load();
    } catch {
      toast(lang === 'es' ? 'Error al responder' : 'Error responding', 'error');
    } finally {
      setRespondingId(null);
    }
  }

  async function openMovements(acc: FullSharedAccount) {
    setMovPanel({ account: acc });
    setMovLoading(true);
    try {
      const txs = await fetchSharedTransactions(acc.id);
      setMovTransactions(txs);
    } catch { setMovTransactions([]); } finally {
      setMovLoading(false);
    }
  }

  // Partition: pending invites for me vs active accounts
  const myId = user?.id ?? '';
  const pendingInvites = accounts.filter(acc => {
    const myMembership = acc.members.find(m => m.user_id === myId);
    return myMembership?.status === 'pending';
  });
  const activeAccounts = accounts.filter(acc => {
    const myMembership = acc.members.find(m => m.user_id === myId);
    return myMembership?.status === 'active';
  });

  return (
    <>
      {/* Create modal */}
      <CreateSharedAccountModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { toast(lang === 'es' ? 'Invitación enviada' : 'Invitation sent', 'success'); load(); }}
      />

      {/* Transaction modal */}
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
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
          onClick={() => setMovPanel(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440,
              background: 'var(--bg-2)', borderLeft: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column',
              animation: 'cd-slide-right 220ms ease',
            }}
          >
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{movPanel.account.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {lang === 'es' ? 'Movimientos' : 'Transactions'}
                </div>
              </div>
              <button onClick={() => setMovPanel(null)} style={{ color: 'var(--text-3)', padding: 6, borderRadius: 8 }}>
                <Icon name="x" size={18} stroke={2} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }} className="no-scrollbar">
              {movLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  <Icon name="spark" size={20} style={{ margin: '0 auto 8px' }} />
                  <div>{lang === 'es' ? 'Cargando…' : 'Loading…'}</div>
                </div>
              ) : movTransactions.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: 'var(--text-3)' }}>
                    <Icon name="list" size={22} stroke={1.6} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    {lang === 'es' ? 'Sin movimientos' : 'No transactions'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {lang === 'es' ? 'Los movimientos aparecerán aquí.' : 'Transactions will appear here.'}
                  </div>
                </div>
              ) : movTransactions.map(tx => {
                const isDeposit = tx.type === 'deposit';
                const userName = tx.profile?.full_name ?? tx.profile?.email ?? '—';
                const isMine = tx.user_id === myId;
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center',
                      background: isDeposit ? 'var(--income-soft)' : 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))',
                      border: `1px solid ${isDeposit ? 'color-mix(in oklab, var(--income) 30%, transparent)' : 'color-mix(in oklab, var(--expense) 30%, var(--border))'}`,
                    }}>
                      <Icon name={isDeposit ? 'plus' : 'minus'} size={16} stroke={2.2} style={{ color: isDeposit ? 'var(--income)' : 'var(--expense)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.description || (isDeposit ? (lang === 'es' ? 'Depósito' : 'Deposit') : (lang === 'es' ? 'Retiro' : 'Withdrawal'))}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                        {isMine ? (lang === 'es' ? 'Tú' : 'You') : userName} · {new Date(tx.date + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short' })}
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

      {/* Page */}
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
          <button
            onClick={() => setCreateOpen(true)}
            style={{ padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="plus" size={15} stroke={2.4} />
            {lang === 'es' ? 'Nueva cuenta' : 'New account'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map(i => (
              <div key={i} className="cd-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-3)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-3)', width: '40%' }} />
                  <div style={{ height: 11, borderRadius: 4, background: 'var(--surface-3)', width: '25%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── Pending invitations ── */}
            {pendingInvites.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Icon name="bell" size={13} style={{ color: 'var(--warn)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {lang === 'es' ? 'Invitaciones pendientes' : 'Pending invitations'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-4)', background: 'var(--surface-3)', borderRadius: 999, padding: '1px 7px', fontWeight: 600 }}>{pendingInvites.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingInvites.map(acc => {
                    const myMember = acc.members.find(m => m.user_id === myId)!;
                    const owner = acc.members.find(m => m.role === 'owner');
                    const ownerName = owner?.profile?.full_name ?? owner?.invited_email ?? '—';
                    const busy = respondingId === myMember.id;
                    return (
                      <div key={acc.id} className="cd-card" style={{ padding: '16px 20px', background: 'color-mix(in oklab, var(--warn) 5%, var(--surface))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'color-mix(in oklab, var(--warn) 14%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--warn) 25%, var(--border))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <Icon name="users" size={20} stroke={1.7} style={{ color: 'var(--warn)' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{acc.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                              {lang === 'es' ? `Invitado por ${ownerName}` : `Invited by ${ownerName}`}
                              {' · '}<span style={{ fontWeight: 600 }}>{acc.currency}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button
                              onClick={() => respond(myMember.id, false)}
                              disabled={busy}
                              style={{ height: 36, padding: '0 14px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, opacity: busy ? 0.5 : 1 }}
                            >
                              {lang === 'es' ? 'Rechazar' : 'Decline'}
                            </button>
                            <button
                              onClick={() => respond(myMember.id, true)}
                              disabled={busy}
                              style={{ height: 36, padding: '0 14px', borderRadius: 9, background: 'var(--income-soft)', border: '1px solid color-mix(in oklab, var(--income) 30%, transparent)', color: 'var(--income)', fontSize: 13, fontWeight: 700, opacity: busy ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              {busy ? <Icon name="spark" size={13} /> : <Icon name="check" size={13} stroke={2.5} />}
                              {lang === 'es' ? 'Aceptar' : 'Accept'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Active shared accounts ── */}
            {activeAccounts.length === 0 && pendingInvites.length === 0 ? (
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
                <button
                  onClick={() => setCreateOpen(true)}
                  style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="plus" size={14} stroke={2.4} />
                  {lang === 'es' ? 'Crear cuenta compartida' : 'Create shared account'}
                </button>
              </div>
            ) : activeAccounts.length > 0 && (
              <>
                {pendingInvites.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Icon name="check" size={13} style={{ color: 'var(--income)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {lang === 'es' ? 'Mis cuentas activas' : 'My active accounts'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {activeAccounts.map(acc => {
                    const activeMembers = acc.members.filter(m => m.status === 'active');
                    const pendingMembers = acc.members.filter(m => m.status === 'pending');
                    const myRole = acc.members.find(m => m.user_id === myId)?.role;
                    return (
                      <div key={acc.id} className="cd-card" style={{ overflow: 'hidden' }}>
                        {/* Card header */}
                        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in oklab, var(--cyan) 6%, var(--surface)) 0%, var(--surface) 100%)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'color-mix(in oklab, var(--cyan) 14%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--cyan) 25%, var(--border))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                <Icon name="users" size={20} stroke={1.7} style={{ color: 'var(--cyan)' }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{acc.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                  {/* Member avatars */}
                                  <div style={{ display: 'flex' }}>
                                    {activeMembers.map((m, i) => (
                                      <div key={m.id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: activeMembers.length - i }}>
                                        <MemberAvatar m={m} />
                                      </div>
                                    ))}
                                  </div>
                                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                                    {activeMembers.length} {lang === 'es' ? 'miembro(s)' : 'member(s)'}
                                    {pendingMembers.length > 0 && (
                                      <span style={{ color: 'var(--warn)', marginLeft: 4 }}>· {pendingMembers.length} {lang === 'es' ? 'pendiente(s)' : 'pending'}</span>
                                    )}
                                  </span>
                                  {myRole === 'owner' && (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', background: 'color-mix(in oklab, var(--cyan) 12%, var(--surface-3))', borderRadius: 999, padding: '2px 7px', border: '1px solid color-mix(in oklab, var(--cyan) 20%, var(--border))' }}>
                                      {lang === 'es' ? 'Creador' : 'Owner'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Balance */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{lang === 'es' ? 'Balance' : 'Balance'}</div>
                              <MoneyText amount={acc.balance} currency={acc.currency} size={18} weight={800} type="income" />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                          <button
                            onClick={() => setTxModal({ accountId: acc.id, name: acc.name, balance: acc.balance, currency: acc.currency, type: 'deposit' })}
                            style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--income)', background: 'transparent', borderRight: '1px solid var(--border)', transition: 'background 140ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--income-soft)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Icon name="plus" size={15} stroke={2.4} />
                            {lang === 'es' ? 'Depositar' : 'Deposit'}
                          </button>
                          <button
                            onClick={() => setTxModal({ accountId: acc.id, name: acc.name, balance: acc.balance, currency: acc.currency, type: 'withdrawal' })}
                            style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--expense)', background: 'transparent', borderRight: '1px solid var(--border)', transition: 'background 140ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in oklab, var(--expense) 8%, transparent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Icon name="minus" size={15} stroke={2.4} />
                            {lang === 'es' ? 'Retirar' : 'Withdraw'}
                          </button>
                          <button
                            onClick={() => openMovements(acc)}
                            style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)', background: 'transparent', transition: 'background 140ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Icon name="list" size={15} stroke={1.8} />
                            {lang === 'es' ? 'Movimientos' : 'Transactions'}
                          </button>
                        </div>

                        {/* Members list (active) */}
                        <div style={{ padding: '12px 20px' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                            {lang === 'es' ? 'Miembros' : 'Members'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {acc.members.map(m => {
                              const name = m.profile?.full_name ?? m.invited_email;
                              const isMe = m.user_id === myId;
                              return (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <MemberAvatar m={m} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {isMe ? (lang === 'es' ? `${name} (tú)` : `${name} (you)`) : name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.invited_email}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                                    {m.role === 'owner' && (
                                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', background: 'color-mix(in oklab, var(--cyan) 10%, var(--surface-3))', borderRadius: 999, padding: '2px 7px', border: '1px solid color-mix(in oklab, var(--cyan) 18%, var(--border))' }}>
                                        {lang === 'es' ? 'Creador' : 'Owner'}
                                      </span>
                                    )}
                                    <span style={{
                                      fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '2px 7px',
                                      color: m.status === 'active' ? 'var(--income)' : 'var(--warn)',
                                      background: m.status === 'active' ? 'var(--income-soft)' : 'color-mix(in oklab, var(--warn) 12%, var(--surface-3))',
                                      border: `1px solid ${m.status === 'active' ? 'color-mix(in oklab, var(--income) 25%, transparent)' : 'color-mix(in oklab, var(--warn) 25%, var(--border))'}`,
                                    }}>
                                      {m.status === 'active'
                                        ? (lang === 'es' ? 'Activo' : 'Active')
                                        : (lang === 'es' ? 'Pendiente' : 'Pending')}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
