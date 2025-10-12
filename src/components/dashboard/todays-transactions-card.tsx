'use client';

import { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { type Transaction } from '@/shared/types';

interface TodaysTransactionsCardProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  isLoading?: boolean;
}

export function TodaysTransactionsCard({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  isLoading = false
}: TodaysTransactionsCardProps) {
  
  const todaysTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(transaction => {
      let transactionDate: Date;
      
      if (typeof transaction.Date === 'string') {
        transactionDate = new Date(transaction.Date);
      } else if (transaction.Date && typeof transaction.Date === 'object' && 'seconds' in transaction.Date) {
        transactionDate = new Date(transaction.Date.seconds * 1000);
      } else {
        return false;
      }
      
      return isToday(transactionDate);
    });
  }, [transactions]);

  const todaysSummary = useMemo(() => {
    const expenses = todaysTransactions
      .filter(t => t.Type === 'expense' && t.Category !== 'Transfer')
      .reduce((sum, t) => sum + t.Amount, 0);
    
    const income = todaysTransactions
      .filter(t => t.Type === 'income' || t.Category === 'Transfer')
      .reduce((sum, t) => sum + t.Amount, 0);
    
    const net = income - expenses;
    
    return { expenses, income, net, count: todaysTransactions.length };
  }, [todaysTransactions]);

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.Category === 'Transfer') {
      return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
    }
    return transaction.Type === 'income' 
      ? <TrendingUp className="w-4 h-4 text-green-500" />
      : <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTransactionBadgeVariant = (transaction: Transaction) => {
    if (transaction.Category === 'Transfer') return 'secondary';
    return transaction.Type === 'income' ? 'default' : 'destructive';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Today&apos;s Transactions
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Today&apos;s Transactions
            <Badge variant="outline" className="text-xs">
              {todaysSummary.count}
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={onAddTransaction}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </CardTitle>
        
        {/* Today's Summary */}
        {todaysSummary.count > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-sm font-semibold text-red-600">
                ${todaysSummary.expenses.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="text-sm font-semibold text-green-600">
                ${todaysSummary.income.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Net</p>
              <p className={`text-sm font-semibold ${
                todaysSummary.net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${todaysSummary.net >= 0 ? '+' : ''}${todaysSummary.net.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {todaysTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No transactions today</p>
            <Button onClick={onAddTransaction} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add your first transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {transaction.Notes || 'No description'}
                      </p>
                      <Badge 
                        variant={getTransactionBadgeVariant(transaction)}
                        className="text-xs"
                      >
                        {transaction.Category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        typeof transaction.Date === 'string' 
                          ? new Date(transaction.Date)
                          : new Date((transaction.Date?.seconds || 0) * 1000),
                        'h:mm a'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${
                    transaction.Type === 'income' || transaction.Category === 'Transfer'
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.Type === 'income' || transaction.Category === 'Transfer' ? '+' : '-'}
                    ${transaction.Amount.toFixed(2)}
                  </span>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditTransaction(transaction)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteTransaction(transaction)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}