import { useEffect, useState } from 'react';
import { Users, UtensilsCrossed, CheckCircle, Clock, XCircle } from 'lucide-react';
import { fetchStudents, fetchRestaurants } from '../api/adminApi';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([fetchStudents(), fetchRestaurants()]);
        setStudents(s.data);
        setRestaurants(r.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kycCount = (list, status) => list.filter((x) => x.kycStatus === status).length;

  const stat = (list) => ({
    total: list.length,
    pending: kycCount(list, 'pending'),
    approved: kycCount(list, 'approved'),
    rejected: kycCount(list, 'rejected'),
  });

  const s = stat(students);
  const r = stat(restaurants);
  const totalPending = s.pending + r.pending;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of all users and restaurants</p>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading stats...</div>
      ) : (
        <>
          {/* Global Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users size={22} className="text-blue-400" />}
              label="Total Students"
              value={s.total}
              color="bg-blue-500/15 border border-blue-500/20"
            />
            <StatCard
              icon={<UtensilsCrossed size={22} className="text-purple-400" />}
              label="Total Restaurants"
              value={r.total}
              color="bg-purple-500/15 border border-purple-500/20"
            />
            <StatCard
              icon={<Clock size={22} className="text-amber-400" />}
              label="Pending KYC"
              value={totalPending}
              color="bg-amber-500/15 border border-amber-500/20"
            />
            <StatCard
              icon={<CheckCircle size={22} className="text-emerald-400" />}
              label="Approved KYC"
              value={s.approved + r.approved}
              color="bg-emerald-500/15 border border-emerald-500/20"
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Students breakdown */}
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400" /> Student KYC Breakdown
              </h2>
              {[
                { label: 'Approved', count: s.approved, cls: 'bg-emerald-500' },
                { label: 'Pending', count: s.pending, cls: 'bg-amber-500' },
                { label: 'Rejected', count: s.rejected, cls: 'bg-red-500' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-white font-semibold">{row.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.cls} rounded-full transition-all duration-500`}
                      style={{ width: s.total ? `${(row.count / s.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Restaurants breakdown */}
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-purple-400" /> Restaurant KYC Breakdown
              </h2>
              {[
                { label: 'Approved', count: r.approved, cls: 'bg-emerald-500' },
                { label: 'Pending', count: r.pending, cls: 'bg-amber-500' },
                { label: 'Rejected', count: r.rejected, cls: 'bg-red-500' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-white font-semibold">{row.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.cls} rounded-full transition-all duration-500`}
                      style={{ width: r.total ? `${(row.count / r.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
