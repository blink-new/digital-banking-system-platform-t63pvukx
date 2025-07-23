import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, BarChart3 } from 'lucide-react';
import { blink } from '../blink/client';

interface TransactionAnalytics {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactionCount: number;
  averageTransaction: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const user = await blink.auth.me();
      
      // Get user's accounts
      const accounts = await blink.db.accounts.list({
        where: { userId: user.id }
      });
      
      if (accounts.length === 0) {
        setAnalytics({
          totalIncome: 0,
          totalExpenses: 0,
          netFlow: 0,
          transactionCount: 0,
          averageTransaction: 0,
          monthlyData: [],
          categoryBreakdown: []
        });
        return;
      }

      const accountIds = accounts.map(acc => acc.id);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Get transactions for the period
      const transactions = await blink.db.transactions.list({
        where: {
          OR: [
            { fromAccountId: { in: accountIds } },
            { toAccountId: { in: accountIds } }
          ],
          createdAt: { gte: startDate.toISOString() }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate analytics
      let totalIncome = 0;
      let totalExpenses = 0;
      const monthlyMap = new Map<string, { income: number; expenses: number }>();
      const categoryMap = new Map<string, number>();

      transactions.forEach(tx => {
        const amount = parseFloat(tx.amount);
        const isIncome = accountIds.includes(tx.toAccountId);
        const month = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        if (isIncome) {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
        }

        // Monthly data
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { income: 0, expenses: 0 });
        }
        const monthData = monthlyMap.get(month)!;
        if (isIncome) {
          monthData.income += amount;
        } else {
          monthData.expenses += amount;
        }

        // Category breakdown (simplified)
        const category = tx.type || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });

      const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data
      }));

      const totalCategoryAmount = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0);
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalCategoryAmount > 0 ? (amount / totalCategoryAmount) * 100 : 0
      }));

      setAnalytics({
        totalIncome,
        totalExpenses,
        netFlow: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        averageTransaction: transactions.length > 0 ? (totalIncome + totalExpenses) / transactions.length : 0,
        monthlyData,
        categoryBreakdown
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Financial Analytics</h2>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${analytics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${analytics.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Flow</p>
              <p className={`text-2xl font-bold ${analytics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${analytics.netFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.transactionCount}</p>
              <p className="text-sm text-gray-500">
                Avg: ${analytics.averageTransaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trend</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.monthlyData.slice(-6).map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{month.month}</span>
                  <span className="text-gray-500">
                    Net: ${(month.income - month.expenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min((month.income / Math.max(month.income, month.expenses)) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min((month.expenses / Math.max(month.income, month.expenses)) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Income: ${month.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  <span>Expenses: ${month.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.categoryBreakdown.slice(0, 5).map((category, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Financial Health Score */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min((analytics.netFlow > 0 ? 85 : 45), 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {Math.min((analytics.netFlow > 0 ? 85 : 45), 100)}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700">Overall Score</p>
            <p className="text-xs text-gray-500">
              {analytics.netFlow > 0 ? 'Excellent' : 'Needs Improvement'}
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min((analytics.transactionCount / 50) * 100, 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {Math.min(Math.round((analytics.transactionCount / 50) * 100), 100)}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700">Activity Level</p>
            <p className="text-xs text-gray-500">
              {analytics.transactionCount > 25 ? 'Very Active' : analytics.transactionCount > 10 ? 'Active' : 'Low Activity'}
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray={`${analytics.totalIncome > analytics.totalExpenses ? 90 : 60}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {analytics.totalIncome > analytics.totalExpenses ? 90 : 60}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700">Savings Rate</p>
            <p className="text-xs text-gray-500">
              {analytics.totalIncome > analytics.totalExpenses ? 'Great' : 'Moderate'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}