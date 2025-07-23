import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Activity,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Download
} from 'lucide-react';
import { blink } from '../blink/client';

interface AdminStats {
  totalUsers: number;
  totalAccounts: number;
  totalTransactions: number;
  totalVolume: number;
  activeUsers: number;
  pendingKyc: number;
  flaggedAccounts: number;
  systemHealth: number;
}

interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  status: string;
  kycStatus: string;
  accountCount: number;
  totalBalance: number;
  lastLogin: string;
  riskScore: number;
  createdAt: string;
}

export default function EnhancedAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load all accounts and transactions for stats
      const [allAccounts, allTransactions] = await Promise.all([
        blink.db.accounts.list({}),
        blink.db.transactions.list({})
      ]);

      // Calculate stats
      const totalVolume = allTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const uniqueUsers = new Set(allAccounts.map(acc => acc.userId));
      
      const adminStats: AdminStats = {
        totalUsers: uniqueUsers.size,
        totalAccounts: allAccounts.length,
        totalTransactions: allTransactions.length,
        totalVolume,
        activeUsers: Math.floor(uniqueUsers.size * 0.8), // Mock active users
        pendingKyc: Math.floor(uniqueUsers.size * 0.15), // Mock pending KYC
        flaggedAccounts: Math.floor(uniqueUsers.size * 0.05), // Mock flagged accounts
        systemHealth: 98 // Mock system health
      };

      setStats(adminStats);

      // Create user accounts data (mock enhanced data)
      const userAccountsMap = new Map<string, {
        accountCount: number;
        totalBalance: number;
        email: string;
        displayName: string;
      }>();

      allAccounts.forEach(account => {
        const existing = userAccountsMap.get(account.userId) || {
          accountCount: 0,
          totalBalance: 0,
          email: `user${account.userId.slice(-4)}@example.com`,
          displayName: `User ${account.userId.slice(-4)}`
        };
        
        existing.accountCount += 1;
        existing.totalBalance += parseFloat(account.balance);
        userAccountsMap.set(account.userId, existing);
      });

      const userAccounts: UserAccount[] = Array.from(userAccountsMap.entries()).map(([userId, data]) => ({
        id: userId,
        email: data.email,
        displayName: data.displayName,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        kycStatus: Math.random() > 0.2 ? 'approved' : Math.random() > 0.5 ? 'pending' : 'rejected',
        accountCount: data.accountCount,
        totalBalance: data.totalBalance,
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      }));

      setUsers(userAccounts);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = useCallback(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (kycFilter !== 'all') {
      filtered = filtered.filter(user => user.kycStatus === kycFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, kycFilter]);

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, kycFilter, filterUsers]);

  const handleUserAction = async (userId: string, action: string) => {
    try {
      // Mock user actions - in real app, these would call backend APIs
      console.log(`Performing ${action} on user ${userId}`);
      
      // Update local state
      setUsers(prev => prev.map(user => {
        if (user.id === userId) {
          switch (action) {
            case 'activate':
              return { ...user, status: 'active' };
            case 'deactivate':
              return { ...user, status: 'inactive' };
            case 'approve_kyc':
              return { ...user, kycStatus: 'approved' };
            case 'reject_kyc':
              return { ...user, kycStatus: 'rejected' };
            default:
              return user;
          }
        }
        return user;
      }));
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const exportUserData = () => {
    const csvContent = [
      ['Email', 'Display Name', 'Status', 'KYC Status', 'Account Count', 'Total Balance', 'Risk Score', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        user.email,
        user.displayName,
        user.status,
        user.kycStatus,
        user.accountCount,
        user.totalBalance.toFixed(2),
        user.riskScore,
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and user management</p>
        </div>
        <button
          onClick={exportUserData}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Data</span>
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{stats.activeUsers} active</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAccounts.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{(stats.totalAccounts / stats.totalUsers).toFixed(1)} avg per user</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transaction Volume</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">{stats.totalTransactions} transactions</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">{stats.systemHealth}%</p>
                <p className="text-sm text-yellow-600">{stats.flaggedAccounts} flagged accounts</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {stats && stats.pendingKyc > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {stats.pendingKyc} users have pending KYC verification
              </p>
              <p className="text-sm text-yellow-700">Review and approve pending applications to maintain compliance.</p>
            </div>
          </div>
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All KYC</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accounts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.kycStatus === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : user.kycStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.accountCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${user.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        user.riskScore < 30 ? 'text-green-600' :
                        user.riskScore < 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {user.riskScore}
                      </span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            user.riskScore < 30 ? 'bg-green-500' :
                            user.riskScore < 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${user.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'deactivate')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      )}
                      
                      {user.kycStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUserAction(user.id, 'approve_kyc')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'reject_kyc')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.displayName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">KYC Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.kycStatus === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : selectedUser.kycStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.kycStatus}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Count</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.accountCount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Balance</label>
                  <p className="mt-1 text-sm text-gray-900">
                    ${selectedUser.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Score</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.riskScore}/100</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.lastLogin).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                {selectedUser.status === 'active' ? (
                  <button
                    onClick={() => {
                      handleUserAction(selectedUser.id, 'deactivate');
                      setShowUserModal(false);
                    }}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Deactivate User</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleUserAction(selectedUser.id, 'activate');
                      setShowUserModal(false);
                    }}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Activate User</span>
                  </button>
                )}
                
                {selectedUser.kycStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleUserAction(selectedUser.id, 'approve_kyc');
                        setShowUserModal(false);
                      }}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Approve KYC</span>
                    </button>
                    <button
                      onClick={() => {
                        handleUserAction(selectedUser.id, 'reject_kyc');
                        setShowUserModal(false);
                      }}
                      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <UserX className="h-4 w-4" />
                      <span>Reject KYC</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}