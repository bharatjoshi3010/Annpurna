import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchAnalytics } from '../api/adminApi';
import { RefreshCw, IndianRupee, TrendingUp, Activity, Filter, Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    mealType: 'all',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAnalytics(filters);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const th = 'text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/50';

  const chartData = useMemo(() => {
    if (!data?.students) return [];
    return [...data.students]
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
      .slice(0, 10)
      .map(s => ({
        name: s.student.name.split(' ')[0], // First name only
        efficiency: Number(s.efficiencyScore.toFixed(1)),
      }));
  }, [data]);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Global metrics and student-wise performance</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Filters */}
      <div className="card p-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm">
          <Filter size={16} /> Filters:
        </div>
        <input 
          type="date" 
          className="form-input px-4 py-2 text-sm bg-slate-900 border-slate-800"
          value={filters.startDate}
          onChange={(e) => setFilters(p => ({...p, startDate: e.target.value}))}
        />
        <span className="text-slate-500">to</span>
        <input 
          type="date" 
          className="form-input px-4 py-2 text-sm bg-slate-900 border-slate-800"
          value={filters.endDate}
          onChange={(e) => setFilters(p => ({...p, endDate: e.target.value}))}
        />
        <select 
          className="form-input px-4 py-2 text-sm bg-slate-900 border-slate-800 appearance-none"
          value={filters.mealType}
          onChange={(e) => setFilters(p => ({...p, mealType: e.target.value}))}
        >
          <option value="all">All Meals</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
        </select>
      </div>

      {loading && !data ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <RefreshCw className="animate-spin w-8 h-8 mb-4" />
          <p>Loading analytics data...</p>
        </div>
      ) : data ? (
        <>
          {/* Global Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6 border-t-4 border-t-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Wallet Balance</p>
                  <h3 className="text-3xl font-black text-white mt-2">₹{data.global.totalWalletBalance.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400"><IndianRupee size={24} /></div>
              </div>
            </div>
            
            <div className="card p-6 border-t-4 border-t-emerald-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Subscription Revenue</p>
                  <h3 className="text-3xl font-black text-white mt-2">₹{data.global.totalSubscriptionRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400"><TrendingUp size={24} /></div>
              </div>
            </div>

            <div className="card p-6 border-t-4 border-t-primary-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Consumed Meal Value</p>
                  <h3 className="text-3xl font-black text-white mt-2">₹{data.global.totalConsumedValue.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-400"><Activity size={24} /></div>
              </div>
            </div>

            <div className="card p-6 border-t-4 border-t-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Missed Meal Value</p>
                  <h3 className="text-3xl font-black text-white mt-2">₹{data.global.totalMissedValue.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-400"><Activity size={24} /></div>
              </div>
            </div>
          </div>

          {/* Efficiency Chart */}
          <div className="card mt-8 p-6">
             <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="text-primary-400" />
                <h2 className="text-lg font-bold text-white">Top 10 Students by Efficiency Score</h2>
             </div>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                    <RechartsTooltip 
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                       itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                       cursor={{ fill: '#1e293b' }}
                    />
                    <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.efficiency > 70 ? '#10b981' : entry.efficiency > 40 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Student Table */}
          <div className="card overflow-hidden mt-8">
            <div className="px-6 py-5 border-b border-slate-800/60 bg-slate-900/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-primary-400" />
                Student-wise Performance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Student</th>
                    <th className={th}>Wallet</th>
                    <th className={th}>Sub Spend</th>
                    <th className={th}>Consumed (Qty / Val)</th>
                    <th className={th}>Missed (Qty / Val)</th>
                    <th className={th}>Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
                  {data.students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">No data found for the selected filters.</td>
                    </tr>
                  ) : (
                    data.students.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{row.student.name}</td>
                        <td className="px-6 py-4 text-slate-300">₹{row.walletBalance}</td>
                        <td className="px-6 py-4 text-slate-300">₹{row.totalSubscriptionSpend}</td>
                        <td className="px-6 py-4 text-slate-300">
                          <span className="text-emerald-400 font-bold">{row.mealsConsumed}</span> / ₹{row.consumedValue}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          <span className="text-red-400 font-bold">{row.mealsMissed}</span> / ₹{row.missedValue}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${row.efficiencyScore > 70 ? 'bg-emerald-500' : row.efficiencyScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(row.efficiencyScore, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-300">{row.efficiencyScore.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
