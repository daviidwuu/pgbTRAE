// iOS Share API implementation
export class IOSShareAPI {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'share' in navigator && /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log('[iOS Share] Share API support:', this.isSupported);
  }

  // Share transaction data
  async shareTransaction(transaction: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[iOS Share] Share API not supported');
      return false;
    }

    try {
      await navigator.share({
        title: 'Transaction Details',
        text: `${transaction.description} - $${transaction.amount} (${transaction.category})`,
        url: window.location.href,
      });
      
      console.log('[iOS Share] Transaction shared successfully');
      return true;
    } catch (error) {
      console.error('[iOS Share] Failed to share transaction:', error);
      return false;
    }
  }

  // Share budget report
  async shareBudgetReport(report: {
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    period: string;
  }): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const text = `Budget Report (${report.period})\n` +
                  `Income: $${report.totalIncome}\n` +
                  `Expenses: $${report.totalExpenses}\n` +
                  `Savings: $${report.savings}`;

      await navigator.share({
        title: 'Budget Report',
        text: text,
        url: window.location.href,
      });

      console.log('[iOS Share] Budget report shared successfully');
      return true;
    } catch (error) {
      console.error('[iOS Share] Failed to share budget report:', error);
      return false;
    }
  }

  // Share app with friends
  async shareApp(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      await navigator.share({
        title: 'PiggyBank - Personal Finance Tracker',
        text: 'Check out this awesome personal finance tracking app!',
        url: window.location.origin,
      });

      console.log('[iOS Share] App shared successfully');
      return true;
    } catch (error) {
      console.error('[iOS Share] Failed to share app:', error);
      return false;
    }
  }
}