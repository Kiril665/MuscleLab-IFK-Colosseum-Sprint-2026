import React, { useEffect, useState } from 'react';
import { Wallet, Unlink, RefreshCw } from 'lucide-react';
import { authStore } from '../../services/authStore';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useI18n } from '../../services/i18n';
import { connectSolanaWallet, disconnectSolanaWallet, shortAddress, getSolanaProvider } from '../../services/solanaWallet';

export const SolanaWalletCard: React.FC = () => {
  const { t } = useI18n();
  const [wallet, setWallet] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const r = await fetch('/api/solana/wallet');
    if (r.ok) setWallet((await r.json()).wallet);
  };

  useEffect(() => {
    if (authStore.getUser().isGuest) return;
    void load();

    const provider = getSolanaProvider();
    if (!provider?.on) return;
    const handleAccountChanged = () => void load();
    provider.on('accountChanged', handleAccountChanged);
    return () => provider.off?.('accountChanged', handleAccountChanged);
  }, []);

  const openMobileWallet = (kind: 'phantom' | 'solflare') => {
    const target = encodeURIComponent(window.location.href);
    const url = kind === 'phantom'
      ? `https://phantom.app/ul/browse/${target}`
      : `https://solflare.com/ul/v1/browse/${target}`;
    window.location.href = url;
  };

  const connect = async () => {
    setBusy(true);
    setError('');
    try {
      await connectSolanaWallet();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося підключити гаманець.');
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    setBusy(true);
    setError('');
    try {
      await disconnectSolanaWallet();
      setWallet(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося від’єднати гаманець.');
    } finally {
      setBusy(false);
    }
  };

  if (authStore.getUser().isGuest) {
    return (
      <Card padding="md">
        <div className="text-sm font-bold">{t.profile.walletTitle}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{t.profile.walletGuest}</p>
      </Card>
    );
  }

  const mobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);

  return (
    <Card padding="md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-heading font-bold flex items-center gap-2">
            <Wallet size={16} className="text-[var(--accent)]" />
            {t.profile.walletTitle}
          </div>
          {wallet ? (
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {shortAddress(wallet.address)} · {Number(wallet.balanceSol || 0).toFixed(4)} SOL · {wallet.network || 'devnet'}
            </p>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] mt-1">{t.profile.walletDesc}</p>
          )}
        </div>
        {wallet ? (
          <Button size="sm" variant="outline" onClick={unlink} disabled={busy} title="Від’єднати гаманець">
            {busy ? <RefreshCw size={14} className="animate-spin" /> : <Unlink size={14} />}
          </Button>
        ) : (
          <Button size="sm" className="min-w-[190px] font-bold" onClick={connect} disabled={busy}>
            {busy ? <RefreshCw size={14} className="animate-spin" /> : t.profile.walletConnect}
          </Button>
        )}
      </div>

      {!wallet && mobile && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => openMobileWallet('phantom')}>Phantom</Button>
          <Button size="sm" variant="outline" onClick={() => openMobileWallet('solflare')}>Solflare</Button>
        </div>
      )}

      {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
    </Card>
  );
};
