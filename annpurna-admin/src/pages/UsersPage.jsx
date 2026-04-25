import { useEffect, useState, useCallback } from 'react';
import { fetchStudents, updateStudent, deleteStudent } from '../api/adminApi';
import { Pencil, Trash2, Search, RefreshCw, User, ImageIcon, X } from 'lucide-react';
import EditModal from '../components/EditModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

const KYC_BADGE = {
  pending: <span className="badge-pending">⏳ Pending</span>,
  approved: <span className="badge-approved">✓ Approved</span>,
  rejected: <span className="badge-rejected">✕ Rejected</span>,
};

const STUDENT_FIELDS = [
  { key: 'name', label: 'Full Name', placeholder: 'Full name' },
  { key: 'email', label: 'Email', placeholder: 'Email address' },
  { key: 'phoneNumber', label: 'Phone Number', placeholder: 'Phone number' },
  { key: 'address', label: 'Current Address', placeholder: 'Current address', full: true },
  { key: 'localGuardianName', label: 'Guardian Name', placeholder: "Guardian's name" },
  { key: 'localGuardianPhone', label: 'Guardian Phone', placeholder: "Guardian's phone" },
  { key: 'hometownAddress', label: 'Hometown Address', placeholder: 'Hometown address', full: true },
  { key: 'college', label: 'College', placeholder: 'College name' },
  { key: 'location', label: 'Location', placeholder: 'City / Location' },
  { key: 'budget', label: 'Budget', placeholder: 'Monthly budget' },
  { key: 'selectedPlan', label: 'Selected Plan', placeholder: 'Meal plan' },
  {
    key: 'kycStatus',
    label: 'KYC Status',
    type: 'select',
    options: [
      { value: 'pending', label: '⏳ Pending' },
      { value: 'approved', label: '✓ Approved' },
      { value: 'rejected', label: '✕ Rejected' },
    ],
  },
];

const BASE_IMG = 'http://localhost:5000';

export default function UsersPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewingImg, setViewingImg] = useState(null); // { url, label }
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchStudents();
      setStudents(data);
    } catch {
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    try {
      await updateStudent(editTarget._id, form);
      showToast('Student updated successfully!');
      setEditTarget(null);
      load();
    } catch {
      showToast('Failed to update student', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(deleteTarget._id);
      showToast('Student deleted', 'warning');
      setDeleteTarget(null);
      load();
    } catch {
      showToast('Failed to delete student', 'error');
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchKyc = kycFilter === 'all' || s.kycStatus === kycFilter;
    return matchSearch && matchKyc;
  });

  const th = 'text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider';
  return (
    <div className="p-8 space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Image lightbox */}
      {viewingImg && (
        <div
          style={{
            position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.85)',
            display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,
          }}
          onClick={() => setViewingImg(null)}
        >
          <div style={{background:'#1e293b',borderRadius:12,padding:16,maxWidth:'90vw',maxHeight:'90vh',overflow:'auto',position:'relative'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{color:'#fff',fontWeight:600,fontSize:15}}>{viewingImg.label}</span>
              <button onClick={() => setViewingImg(null)} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <img src={viewingImg.url} alt={viewingImg.label} style={{maxWidth:'80vw',maxHeight:'75vh',borderRadius:8,objectFit:'contain'}} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Users</h1>
          <p className="text-slate-400 text-sm mt-1">View, edit, and manage student accounts</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative" style={{flex:'1 1 220px'}}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="form-input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setKycFilter(f)}
              style={{
                padding:'0.375rem 0.875rem',
                fontSize:'0.75rem',
                fontWeight:600,
                borderRadius:'0.5rem',
                textTransform:'capitalize',
                transition:'all 0.2s',
                cursor:'pointer',
                border: kycFilter === f ? 'none' : '1px solid #475569',
                background: kycFilter === f ? 'linear-gradient(to right,#c53939,#da5353)' : '#1e293b',
                color: kycFilter === f ? '#fff' : '#94a3b8',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className={th}>Student</th>
                <th className={th}>Phone</th>
                <th className={th}>Plan</th>
                <th className={th}>Wallet</th>
                <th className={th}>ID Card</th>
                <th className={th}>KYC Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <RefreshCw className="animate-spin w-6 h-6 mx-auto mb-2" />
                    Loading students...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr
                    key={student._id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(student.name || 'S')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{student.name || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{student.phoneNumber || '-'}</td>
                    <td className="px-6 py-4 text-slate-300">{student.selectedPlan || '-'}</td>
                    <td className="px-6 py-4 text-slate-300">₹{student.walletBalance ?? 0}</td>
                    {/* Student ID Card */}
                    <td className="px-6 py-4">
                      {student.studentIdCard ? (
                        <button
                          onClick={() => setViewingImg({ url: `${BASE_IMG}${student.studentIdCard}`, label: `${student.name} — ID Card` })}
                          style={{
                            display:'flex',alignItems:'center',gap:6,padding:'4px 10px',
                            background:'#0f172a',border:'1px solid #334155',borderRadius:8,
                            color:'#60a5fa',fontSize:12,fontWeight:600,cursor:'pointer',
                          }}
                          title="View student ID card"
                        >
                          <ImageIcon size={13}/> View
                        </button>
                      ) : (
                        <span style={{color:'#475569',fontSize:12}}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{KYC_BADGE[student.kycStatus] ?? student.kycStatus}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                          onClick={() => setEditTarget(student)}
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          onClick={() => setDeleteTarget(student)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-800/60 text-xs text-slate-500">
            Showing {filtered.length} of {students.length} students
          </div>
        )}
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          title={`Edit Student — ${editTarget.name}`}
          fields={STUDENT_FIELDS}
          initialData={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`This will permanently delete "${deleteTarget.name}". This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
