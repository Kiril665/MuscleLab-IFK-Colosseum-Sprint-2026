import { 
  UserSubscriptionDetails, 
  PremiumPlanInfo, 
  PaymentHistoryItem, 
  BankTransferDetails 
} from '../types';
import { authStore } from './authStore';
import { sound } from './soundEngine';

export type SupportedCurrency = 'UAH' | 'USD' | 'EUR' | 'PLN';

interface BillingState {
  subscription: UserSubscriptionDetails | null;
  plans: PremiumPlanInfo[];
  currency: SupportedCurrency;
  history: PaymentHistoryItem[];
  activeBankTransfer: BankTransferDetails | null;
  isLoading: boolean;
  error: string | null;
}

type BillingListener = (state: BillingState) => void;

class BillingStore {
  private subscription: UserSubscriptionDetails | null = null;
  private plans: PremiumPlanInfo[] = [];
  private currency: SupportedCurrency = 'UAH';
  private history: PaymentHistoryItem[] = [];
  private activeBankTransfer: BankTransferDetails | null = null;
  private isLoading = false;
  private error: string | null = null;
  private listeners: Set<BillingListener> = new Set();

  constructor() {
    this.initFromStorage();
    // Re-fetch billing details whenever auth status changes
    authStore.subscribe(() => {
      if (authStore.isAuthenticated()) {
        this.fetchBillingStatus();
      } else {
        this.subscription = null;
        this.history = [];
        this.activeBankTransfer = null;
        this.notify();
      }
    });
  }

  private initFromStorage() {
    try {
      const savedCurr = localStorage.getItem('forgemuscle_currency') as SupportedCurrency;
      if (savedCurr && ['UAH', 'USD', 'EUR', 'PLN'].includes(savedCurr)) {
        this.currency = savedCurr;
      }
    } catch {
      // fallback
    }
    this.fetchPlans(this.currency);
    if (authStore.isAuthenticated()) {
      this.fetchBillingStatus();
    }
  }

  public subscribe(listener: BillingListener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public getState(): BillingState {
    return {
      subscription: this.subscription,
      plans: this.plans,
      currency: this.currency,
      history: this.history,
      activeBankTransfer: this.activeBankTransfer,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  public getCurrency(): SupportedCurrency {
    return this.currency;
  }

  public setCurrency(curr: SupportedCurrency) {
    this.currency = curr;
    try {
      localStorage.setItem('forgemuscle_currency', curr);
    } catch {
      // ignore
    }
    this.fetchPlans(curr);
    this.notify();
  }

  public async fetchPlans(currency = this.currency): Promise<PremiumPlanInfo[]> {
    try {
      const res = await fetch(`/api/billing/plans?currency=${currency}`);
      if (res.ok) {
        const data = await res.json();
        if (data.plans) {
          this.plans = data.plans;
          this.notify();
          return data.plans;
        }
      }
    } catch (err) {
      console.warn('Could not fetch billing plans from server, using fallback', err);
    }
    return this.plans;
  }

  public async fetchBillingStatus(): Promise<UserSubscriptionDetails | null> {
    if (!authStore.isAuthenticated()) return null;
    this.isLoading = true;
    this.notify();

    try {
      const res = await fetch('/api/billing/status', {
        headers: authStore.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        this.subscription = data.subscription || {
          status: 'free',
          isPremium: false,
        };
        this.history = data.history || [];
        this.activeBankTransfer = data.activeBankTransfer || null;
        this.error = null;
        
        // Ensure authStore is in sync with server verified entitlement
        const currentUser = authStore.getCurrentUser();
        if (currentUser && currentUser.isPremium !== this.subscription?.isPremium) {
          authStore.fetchMe();
        }
      } else {
        this.error = 'Не вдалося завантажити статус підписки';
      }
    } catch (err: any) {
      this.error = err.message || 'Мережева помилка';
    } finally {
      this.isLoading = false;
      this.notify();
    }
    return this.subscription;
  }

  /**
   * Starts an online card checkout flow by creating a real server checkout session
   */
  public async createCheckoutSession(
    planId: 'premium_monthly' | 'premium_yearly' | 'lifetime_forge',
    currency = this.currency
  ): Promise<{ success: boolean; sessionId?: string; checkoutUrl?: string; error?: string }> {
    if (!authStore.isAuthenticated()) {
      return { success: false, error: 'Потрібна авторизація' };
    }

    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({ planId, currency }),
      });

      const data = await res.json();
      if (!res.ok) {
        this.error = data.error || 'Помилка створення сесії оплати';
        this.isLoading = false;
        this.notify();
        return { success: false, error: this.error };
      }

      this.isLoading = false;
      this.notify();
      return {
        success: true,
        sessionId: data.sessionId,
        checkoutUrl: data.checkoutUrl,
      };
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.message || 'Мережева помилка при зверненні до платіжного шлюзу';
      this.notify();
      return { success: false, error: this.error };
    }
  }

  /**
   * Completes and confirms a payment session on the server side
   */
  public async processCheckoutReturn(sessionId: string): Promise<{ success: boolean; isPremium: boolean; error?: string }> {
    this.isLoading = true;
    this.notify();

    try {
      const res = await fetch('/api/billing/process-checkout-return', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        this.isLoading = false;
        this.error = data.error || 'Платіж не був підтверджений банком-еквайром';
        this.notify();
        return { success: false, isPremium: false, error: this.error };
      }

      sound.playTrophy();
      await this.fetchBillingStatus();
      await authStore.fetchMe();
      this.isLoading = false;
      this.notify();
      return { success: true, isPremium: true };
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.message || 'Помилка підтвердження платежу';
      this.notify();
      return { success: false, isPremium: false, error: this.error };
    }
  }

  /**
   * Generates a formal Bank Transfer invoice/order with unique reference code and IBAN
   */
  public async createBankTransfer(
    planId: 'premium_monthly' | 'premium_yearly' | 'lifetime_forge',
    currency = this.currency
  ): Promise<{ success: boolean; transfer?: BankTransferDetails; error?: string }> {
    if (!authStore.isAuthenticated()) {
      return { success: false, error: 'Потрібна авторизація' };
    }

    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const res = await fetch('/api/billing/create-bank-transfer', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({ planId, currency }),
      });

      const data = await res.json();
      if (!res.ok) {
        this.error = data.error || 'Помилка формування реквізитів для банківського переказу';
        this.isLoading = false;
        this.notify();
        return { success: false, error: this.error };
      }

      this.activeBankTransfer = data.transfer;
      this.isLoading = false;
      this.notify();
      return { success: true, transfer: data.transfer };
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.message || 'Помилка формування рахунку';
      this.notify();
      return { success: false, error: this.error };
    }
  }

  /**
   * User submits proof/notification of bank transfer sent
   */
  public async submitBankTransferReceipt(
    transferId: string,
    payload: { payerName?: string; note?: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    this.isLoading = true;
    this.notify();

    try {
      const res = await fetch('/api/billing/confirm-bank-transfer-submit', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({ transferId, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        this.error = data.error || 'Помилка надсилання підтвердження';
        this.isLoading = false;
        this.notify();
        return { success: false, error: this.error };
      }

      await this.fetchBillingStatus();
      this.isLoading = false;
      this.notify();
      return { success: true, message: data.message };
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.message || 'Помилка звʼязку';
      this.notify();
      return { success: false, error: this.error };
    }
  }

  /**
   * Cancels active subscription auto-renewal
   */
  public async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    this.isLoading = true;
    this.notify();

    try {
      const res = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        this.error = data.error || 'Помилка скасування автопродовження';
        this.isLoading = false;
        this.notify();
        return { success: false, error: this.error };
      }

      await this.fetchBillingStatus();
      this.isLoading = false;
      this.notify();
      return { success: true };
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.message || 'Помилка операції';
      this.notify();
      return { success: false, error: this.error };
    }
  }

  /**
   * Purchases an individual product from the marketplace
   */
  public async purchaseProduct(
    productId: string,
    currency = this.currency
  ): Promise<{ success: boolean; error?: string }> {
    if (!authStore.isAuthenticated()) {
      return { success: false, error: 'Потрібна авторизація для покупки' };
    }

    this.isLoading = true;
    this.notify();

    try {
      const res = await fetch('/api/billing/purchase-product', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({ productId, currency }),
      });

      const data = await res.json();
      if (!res.ok) {
        this.isLoading = false;
        this.error = data.error || 'Помилка проведення платежу за товар';
        this.notify();
        return { success: false, error: this.error };
      }

      sound.playTrophy();
      await authStore.fetchMe();
      await this.fetchBillingStatus();
      this.isLoading = false;
      this.notify();
      return { success: true };
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.message || 'Помилка покупки товару';
      this.notify();
      return { success: false, error: this.error };
    }
  }
}

export const billingStore = new BillingStore();
