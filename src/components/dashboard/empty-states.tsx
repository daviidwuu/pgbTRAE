import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, TrendingUp, PieChart } from "lucide-react";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

interface EmptyBalanceProps {
  isLoading?: boolean;
  onAddTransaction?: () => void;
}

export function EmptyBalance({ isLoading = false, onAddTransaction }: EmptyBalanceProps) {
  if (isLoading) {
    return <FullScreenLoader text="Loading balance..." />;
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Balance</h2>
            <p className="text-sm text-muted-foreground">Your current financial status</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">$0.00</span>
          <span className="text-sm text-muted-foreground">This month</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
        <div className="flex justify-center pt-1">
          <span className="text-sm text-muted-foreground">0%</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyTransactionsProps {
  isLoading?: boolean;
  onAddTransaction?: () => void;
}

export function EmptyTransactions({ isLoading = false, onAddTransaction }: EmptyTransactionsProps) {
  if (isLoading) {
    return <FullScreenLoader text="Loading transactions..." />;
  }

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Your latest financial activities</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onAddTransaction}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-6 pt-0">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium mb-2">No transactions yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Start tracking your finances by adding your first transaction
          </p>
          <Button onClick={onAddTransaction} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyBudgetsProps {
  isLoading?: boolean;
  onSetupBudget?: () => void;
}

export function EmptyBudgets({ isLoading = false, onSetupBudget }: EmptyBudgetsProps) {
  if (isLoading) {
    return <FullScreenLoader text="Loading budgets..." />;
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Budget Overview</h3>
            <p className="text-sm text-muted-foreground">Track your spending goals</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSetupBudget}
          >
            <PieChart className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium mb-2">No budgets set</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create budgets to better manage your spending
          </p>
          <Button onClick={onSetupBudget} size="sm">
            <PieChart className="h-4 w-4 mr-2" />
            Setup Budget
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Remove LoadingIndicator as it's replaced by FullScreenLoader
// export function LoadingIndicator({ text = "Loading...", size = 'sm' }: LoadingIndicatorProps) {
//   const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8';
//   const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';
//   
//   return (
//     <div className="flex items-center gap-2">
//       <Loader2 className={`${iconSize} animate-spin`} />
//       <span className={`${textSize} text-muted-foreground`}>{text}</span>
//     </div>
//   );
// }