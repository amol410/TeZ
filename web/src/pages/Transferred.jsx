import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  success: {
    icon: 'check_circle',
    iconColor: 'text-emerald-400',
    ringColor: 'ring-emerald-400/20',
    bgGlow: 'rgba(16,185,129,0.12)',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-400',
    badgeLabel: 'TRANSFER SUCCESSFUL',
    headline: 'Money Transferred!',
    subtext: 'Your payment has been processed and is on its way.',
    barColor: 'bg-emerald-400',
  },
  failed: {
    icon: 'cancel',
    iconColor: 'text-red-400',
    ringColor: 'ring-red-400/20',
    bgGlow: 'rgba(239,68,68,0.12)',
    badgeBg: 'bg-red-500/10 border-red-500/30',
    badgeText: 'text-red-400',
    badgeLabel: 'TRANSFER FAILED',
    headline: 'Payment Failed',
    subtext: 'Your transfer could not be completed. No money has been debited.',
    barColor: 'bg-red-400',
  },
  pending: {
    icon: 'pending',
    iconColor: 'text-amber-400',
    ringColor: 'ring-amber-400/20',
    bgGlow: 'rgba(245,158,11,0.12)',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-400',
    badgeLabel: 'PROCESSING',
    headline: 'Transfer Pending',
    subtext: 'Your payment is being processed. This usually takes a few minutes.',
    barColor: 'bg-amber-400',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatINR = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return null;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num);
};

const formatDate = (iso) => {
  if (!iso) return new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

// ─── Component ────────────────────────────────────────────────────────────────
const Transferred = () => {
  const { status: urlStatus } = useParams();
  const [searchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Derive status — from URL segment, query param, or default to success
  const rawStatus = (urlStatus || searchParams.get('status') || 'success').toLowerCase();
  const status = STATUS_CONFIG[rawStatus] ? rawStatus : 'success';
  const cfg = STATUS_CONFIG[status];

  // Query-param metadata (Android app passes these)
  const txnId     = searchParams.get('txnId')      || searchParams.get('orderId') || null;
  const amount    = searchParams.get('amount')      || null;
  const toName    = searchParams.get('to')          || searchParams.get('beneficiary') || null;
  const toAccount = searchParams.get('account')     || searchParams.get('upi') || null;
  const timestamp = searchParams.get('timestamp')   || null;
  const fee       = searchParams.get('fee')         || null;
  const mode      = searchParams.get('mode')        || 'Card Transfer';

  // Android deep-link back to app (custom URI scheme)
  const appDeepLink = searchParams.get('callbackUri') || 'tezsend://transfer-complete';

  useEffect(() => {
    // Stagger in animation
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="bg-orbs" aria-hidden="true" />

      {/* Subtle status glow behind card */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${cfg.bgGlow} 0%, transparent 70%)`,
          transition: 'background 0.6s ease',
        }}
        aria-hidden="true"
      />

      {/* ── Minimal branded header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface/60 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            send_money
          </span>
          <span className="font-bold text-lg tracking-tight text-on-surface">TezSend</span>
        </div>
        <span className="font-label-caps text-label-caps text-on-surface-variant opacity-60 uppercase tracking-widest">
          Transfer Receipt
        </span>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4 py-12">

        {/* Card */}
        <div
          className="w-full max-w-md"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {/* Status card */}
          <div className="bg-surface-container-low/60 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden shadow-2xl">

            {/* Coloured top bar */}
            <div className={`h-1 w-full ${cfg.barColor}`} />

            <div className="p-8 flex flex-col items-center text-center gap-4">

              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold tracking-[0.12em] ${cfg.badgeBg} ${cfg.badgeText}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.barColor} ${status === 'pending' ? 'animate-pulse' : ''}`} />
                {cfg.badgeLabel}
              </span>

              {/* Icon */}
              <div
                className={`w-24 h-24 rounded-full bg-surface-container flex items-center justify-center ring-8 ${cfg.ringColor} mt-2`}
                style={{
                  transform: mounted ? 'scale(1)' : 'scale(0.7)',
                  transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
                }}
              >
                <span
                  className={`material-symbols-outlined text-5xl ${cfg.iconColor}`}
                  style={{ fontVariationSettings: "'FILL' 1", fontSize: '3rem' }}
                >
                  {cfg.icon}
                </span>
              </div>

              {/* Amount (prominent) */}
              {amount && (
                <div
                  className="mt-1"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: 'opacity 0.4s ease 0.25s',
                  }}
                >
                  <p className="text-on-surface-variant text-sm mb-1">Amount</p>
                  <p className="font-data-display text-data-display text-on-surface text-4xl font-bold tracking-tight">
                    {formatINR(amount)}
                  </p>
                </div>
              )}

              {/* Headline & subtext */}
              <div>
                <h1 className="font-headline-md text-headline-md text-on-surface font-bold mt-1">
                  {cfg.headline}
                </h1>
                <p className="text-on-surface-variant text-sm mt-1.5 leading-relaxed max-w-xs mx-auto">
                  {cfg.subtext}
                </p>
              </div>
            </div>

            {/* ── Details table ── */}
            <div className="border-t border-white/5 px-6 py-5 space-y-3">

              {toName && (
                <DetailRow
                  label="Recipient"
                  icon="person"
                  value={toName}
                />
              )}
              {toAccount && (
                <DetailRow
                  label="Account / UPI"
                  icon="account_balance"
                  value={toAccount}
                />
              )}
              {mode && (
                <DetailRow
                  label="Payment Mode"
                  icon="credit_card"
                  value={mode}
                />
              )}
              {fee && (
                <DetailRow
                  label="Platform Fee"
                  icon="percent"
                  value={formatINR(fee) || fee}
                />
              )}
              <DetailRow
                label="Date & Time"
                icon="schedule"
                value={formatDate(timestamp)}
              />
              {txnId && (
                <DetailRow
                  label="Transaction ID"
                  icon="tag"
                  value={txnId}
                  mono
                />
              )}
            </div>

            {/* ── Actions ── */}
            <div className="px-6 pb-8 pt-3 flex flex-col gap-3">

              {/* Back to App — primary CTA */}
              <a
                href={appDeepLink}
                id="btn-back-to-app"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-secondary text-on-secondary font-semibold text-sm active:scale-95 transition-all hover:opacity-90"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  arrow_back
                </span>
                Back to TezSend App
              </a>

              {/* Secondary — view history on web */}
              <Link
                to="/history"
                id="btn-view-history"
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-white/10 text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-sm transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                View Transaction History
              </Link>

              {/* Failed state — try again */}
              {status === 'failed' && (
                <Link
                  to="/send-money"
                  id="btn-try-again"
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-red-400/20 text-red-400 hover:bg-red-400/10 text-sm transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Try Again
                </Link>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-on-surface-variant/50 text-xs mt-6 px-4">
            For support, contact{' '}
            <a
              href="mailto:support@tezsend.com"
              className="text-secondary/70 hover:text-secondary transition-colors"
            >
              support@tezsend.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

// ─── Detail Row sub-component ─────────────────────────────────────────────────
const DetailRow = ({ label, icon, value, mono = false }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-center gap-2 text-on-surface-variant min-w-0">
      <span className="material-symbols-outlined text-[16px] shrink-0 opacity-60">{icon}</span>
      <span className="text-xs uppercase tracking-widest font-semibold whitespace-nowrap">{label}</span>
    </div>
    <span
      className={`text-right text-sm text-on-surface break-all ${mono ? 'font-mono text-xs' : 'font-medium'}`}
    >
      {value}
    </span>
  </div>
);

export default Transferred;
