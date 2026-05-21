'use client';

import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/hooks/useData';
import { useApp } from '@/hooks/useApp';
import { Icon } from '@/components/ui/Icon';
import { fetchAllProfiles, updateUserPlanStatus, adminDeleteUser, type DbProfile } from '@/lib/db';

const ADMIN_EMAIL = 'stevengalocr@gmail.com';
const TRIAL_DAYS = 7;
const STATUS_LABELS: Record<string, { es: string; en: string; color: string; bg: string }> = {
  trial:           { es: 'Prueba',    en: 'Trial',    color: '#5B9BFF', bg: 'rgba(91,155,255,0.1)'   },
  active:          { es: 'Activo',    en: 'Active',   color: '#10B981', bg: 'rgba(16,185,129,0.1)'   },
  pending_payment: { es: 'Pendiente', en: 'Pending',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'   },
  blocked:         { es: 'Bloqueado', en: 'Blocked',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)'    },
};

function trialDaysLeft(trialStartedAt: string | null): number {
  if (!trialStartedAt) return TRIAL_DAYS;
  const end = new Date(new Date(trialStartedAt).getTime() + TRIAL_DAYS * 86400000);
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.trial;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: s.color, background: s.bg }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.es}
    </span>
  );
}

export default function AdminPage() {
  const { user } = useData();
  const { lang } = useApp();
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllProfiles();
      setProfiles(data);
      const notes: Record<string, string> = {};
      data.forEach(p => { notes[p.id] = p.admin_notes ?? ''; });
      setEditNotes(notes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  async function handleStatusChange(userId: string, newStatus: DbProfile['plan_status']) {
    setSaving(userId);
    try {
      await updateUserPlanStatus(userId, newStatus);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, plan_status: newStatus } : p));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveNotes(userId: string) {
    setSaving(userId + '_notes');
    try {
      await updateUserPlanStatus(userId, profiles.find(p => p.id === userId)!.plan_status, editNotes[userId]);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, admin_notes: editNotes[userId] } : p));
      setNotesOpen(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--expense-soft)', border: '1px solid rgba(239,68,68,0.15)', display: 'grid', placeItems: 'center', color: 'var(--expense)' }}>
          <Icon name="lock" size={24} stroke={1.7} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Acceso restringido</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Esta sección es solo para administradores.</div>
      </div>
    );
  }

  // Stats
  const total = profiles.length;
  const byStatus = { trial: 0, active: 0, pending_payment: 0, blocked: 0 };
  profiles.forEach(p => { const s = p.plan_status as keyof typeof byStatus; if (s in byStatus) byStatus[s]++; });

  return (
    <div>
      <style>{`
        @media (max-width: 640px) { .admin-stats { grid-template-columns: repeat(2, 1fr) !important; } .admin-table-row { flex-direction: column !important; align-items: flex-start !important; } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>Administración</h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Control de acceso de usuarios</div>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <Icon name="swap" size={14} stroke={2} />
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }} className="admin-stats">
        {[
          { label: 'Total usuarios', value: total, color: 'var(--text)' },
          { label: 'En prueba', value: byStatus.trial, color: '#5B9BFF' },
          { label: 'Activos', value: byStatus.active, color: '#10B981' },
          { label: 'Pendiente / Bloqueado', value: byStatus.pending_payment + byStatus.blocked, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="cd-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: '-0.04em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* User list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="cd-card" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-3)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 13, width: '35%', borderRadius: 4, background: 'var(--surface-3)' }} />
                <div style={{ height: 11, width: '50%', borderRadius: 4, background: 'var(--surface-3)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="cd-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
          No hay usuarios registrados aún.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profiles.map(p => {
            const isAdminUser = p.email === ADMIN_EMAIL;
            const days = trialDaysLeft(p.trial_started_at);
            const initials = (p.full_name ?? p.email).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const joinDate = new Date(p.created_at).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div key={p.id} className="cd-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }} className="admin-table-row">
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: isAdminUser ? 'var(--gradient-hero)' : 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: isAdminUser ? '#0A0F1C' : 'var(--text-2)', flexShrink: 0 }}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.full_name ?? '(sin nombre)'}</span>
                      {isAdminUser && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#5B9BFF', padding: '1px 7px', borderRadius: 999, background: 'rgba(91,155,255,0.1)', border: '1px solid rgba(91,155,255,0.2)' }}>ADMIN</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{p.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      Registro: {joinDate}
                      {p.plan_status === 'trial' && ` · ${days} días de prueba restantes`}
                    </div>
                  </div>

                  {/* Status badge */}
                  <StatusBadge status={p.plan_status} />

                  {/* Actions */}
                  {!isAdminUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {/* Status selector */}
                      <div style={{ position: 'relative' }}>
                        <select
                          value={p.plan_status}
                          disabled={saving === p.id}
                          onChange={e => handleStatusChange(p.id, e.target.value as DbProfile['plan_status'])}
                          style={{
                            appearance: 'none', background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 8, padding: '6px 28px 6px 10px', fontSize: 12, fontWeight: 500,
                            color: 'var(--text)', fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
                          }}
                        >
                          <option value="trial">Prueba</option>
                          <option value="active">Activo</option>
                          <option value="pending_payment">Pendiente pago</option>
                          <option value="blocked">Bloqueado</option>
                        </select>
                        <Icon name="chevron-down" size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                      </div>

                      {/* Notes button */}
                      <button
                        onClick={() => setNotesOpen(notesOpen === p.id ? null : p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}
                      >
                        <Icon name="edit" size={12} stroke={1.7} />
                        Nota
                        {p.admin_notes && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5B9BFF' }} />}
                      </button>

                      {/* Delete button — two-step confirm */}
                      {confirmDelete === p.id ? (
                        <button
                          onClick={async () => {
                            setSaving(p.id + '_del');
                            try {
                              await adminDeleteUser(p.id);
                              setProfiles(prev => prev.filter(u => u.id !== p.id));
                              setConfirmDelete(null);
                            } catch (e) { console.error(e); }
                            finally { setSaving(null); }
                          }}
                          disabled={saving === p.id + '_del'}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: 'var(--expense-soft)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, color: 'var(--expense)', cursor: 'pointer', fontWeight: 600 }}
                        >
                          <Icon name="trash" size={12} stroke={1.7} />
                          {saving === p.id + '_del' ? 'Eliminando…' : '¿Confirmar?'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--expense)', cursor: 'pointer' }}
                        >
                          <Icon name="trash" size={12} stroke={1.7} />
                          Eliminar
                        </button>
                      )}

                      {saving === p.id && (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Guardando…</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes inline editor */}
                {notesOpen === p.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notas del administrador</div>
                    <textarea
                      value={editNotes[p.id] ?? ''}
                      onChange={e => setEditNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Escribe una nota sobre este usuario…"
                      rows={3}
                      style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => handleSaveNotes(p.id)}
                        disabled={saving === p.id + '_notes'}
                        style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--gradient-hero)', color: '#0A0F1C', fontSize: 12.5, fontWeight: 700, border: 0, cursor: 'pointer' }}
                      >
                        {saving === p.id + '_notes' ? 'Guardando…' : 'Guardar nota'}
                      </button>
                      <button
                        onClick={() => setNotesOpen(null)}
                        style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12.5, cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
