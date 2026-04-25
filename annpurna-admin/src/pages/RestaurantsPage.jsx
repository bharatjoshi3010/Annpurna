import { useEffect, useState, useCallback } from 'react';
import { fetchRestaurants, updateRestaurant, deleteRestaurant } from '../api/adminApi';
import { Pencil, Trash2, Search, RefreshCw, UtensilsCrossed, ImageIcon, X } from 'lucide-react';
import EditModal from '../components/EditModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { API_BASE_URL as BASE_IMG } from '../config';

const KYC_BADGE = {
  pending: <span className="badge-pending">⏳ Pending</span>,
  approved: <span className="badge-approved">✓ Approved</span>,
  rejected: <span className="badge-rejected">✕ Rejected</span>,
};

const RESTAURANT_FIELDS = [
  { key: 'ownerName', label: 'Owner Name', placeholder: "Owner's full name" },
  { key: 'restaurantName', label: 'Restaurant Name', placeholder: 'Restaurant name' },
  { key: 'email', label: 'Email', placeholder: 'Email address' },
  { key: 'phoneNumber', label: 'Phone Number', placeholder: 'Phone number' },
  { key: 'openingYear', label: 'Opening Year', placeholder: 'e.g. 2015', inputType: 'number' },
  { key: 'maxCapacity', label: 'Max Capacity', placeholder: 'e.g. 60', inputType: 'number' },
  { key: 'address', label: 'Address', placeholder: 'Full address', full: true },
  { key: 'location', label: 'City / Location', placeholder: 'City' },
  { key: 'fssaiLicense', label: 'FSSAI License', placeholder: 'FSSAI license number' },
  { key: 'specifications', label: 'Specifications', placeholder: 'e.g. Veg, Non-veg, Jain...', full: true },
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


export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
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
      const { data } = await fetchRestaurants();
      setRestaurants(data);
    } catch {
      showToast('Failed to load restaurants', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    try {
      await updateRestaurant(editTarget._id, form);
      showToast('Restaurant updated successfully!');
      setEditTarget(null);
      load();
    } catch {
      showToast('Failed to update restaurant', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRestaurant(deleteTarget._id);
      showToast('Restaurant deleted', 'warning');
      setDeleteTarget(null);
      load();
    } catch {
      showToast('Failed to delete restaurant', 'error');
    }
  };

  const filtered = restaurants.filter((r) => {
    const matchSearch =
      r.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
      r.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase());
    const matchKyc = kycFilter === 'all' || r.kycStatus === kycFilter;
    return matchSearch && matchKyc;
  });

  return (
    <div className="p-8 space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Image lightbox */}
      {viewingImg && (
        <div
          style={{
            position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.85)',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}
          onClick={() => setViewingImg(null)}
        >
          <div style={{background:'#1e293b',borderRadius:12,padding:16,maxWidth:'90vw',maxHeight:'90vh',overflow:'auto'}} onClick={e => e.stopPropagation()}>
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
          <h1 className="text-2xl font-bold text-white">Manage Restaurants</h1>
          <p className="text-slate-400 text-sm mt-1">View, edit, and manage restaurant accounts</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="form-input pl-9"
            placeholder="Search by name, owner or email..."
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

      {/* Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">
          <RefreshCw className="animate-spin w-8 h-8 mx-auto mb-3" />
          Loading restaurants...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No restaurants found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <div key={r._id} className="card p-5 space-y-4 hover:border-slate-600/60 transition-colors">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                    {(r.restaurantName || 'R')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{r.restaurantName}</p>
                    <p className="text-xs text-slate-500 truncate">{r.email}</p>
                  </div>
                </div>
                {KYC_BADGE[r.kycStatus]}
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm">
                <Detail label="Owner" value={r.ownerName} />
                <Detail label="Phone" value={r.phoneNumber} />
                <Detail label="Address" value={r.address} />
                <Detail label="Capacity" value={r.maxCapacity ? `${r.maxCapacity} seats` : null} />
                <Detail label="Opening Year" value={r.openingYear} />
                <Detail label="FSSAI" value={r.fssaiLicense} />
                <Detail label="Wallet" value={`₹${r.walletBalance ?? 0}`} />
              </div>

              {/* Document viewers */}
              {(r.fssaiCertificate || r.registrationCertificate) && (
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {r.fssaiCertificate && (
                    <button
                      onClick={() => setViewingImg({ url: `${BASE_IMG}${r.fssaiCertificate}`, label: `${r.restaurantName} — FSSAI Certificate` })}
                      style={{
                        display:'flex',alignItems:'center',gap:5,padding:'5px 10px',
                        background:'#0f172a',border:'1px solid #334155',borderRadius:8,
                        color:'#34d399',fontSize:11,fontWeight:600,cursor:'pointer',
                      }}
                    >
                      <ImageIcon size={12}/> FSSAI Cert
                    </button>
                  )}
                  {r.registrationCertificate && (
                    <button
                      onClick={() => setViewingImg({ url: `${BASE_IMG}${r.registrationCertificate}`, label: `${r.restaurantName} — Registration Certificate` })}
                      style={{
                        display:'flex',alignItems:'center',gap:5,padding:'5px 10px',
                        background:'#0f172a',border:'1px solid #334155',borderRadius:8,
                        color:'#818cf8',fontSize:11,fontWeight:600,cursor:'pointer',
                      }}
                    >
                      <ImageIcon size={12}/> Reg. Cert
                    </button>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                <button
                  className="btn-secondary flex-1 justify-center"
                  onClick={() => setEditTarget(r)}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className="btn-danger flex-1 justify-center"
                  onClick={() => setDeleteTarget(r)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {editTarget && (
        <EditModal
          title={`Edit Restaurant — ${editTarget.restaurantName}`}
          fields={RESTAURANT_FIELDS}
          initialData={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`This will permanently delete "${deleteTarget.restaurantName}". This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 w-24 flex-shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-slate-300 text-xs">{value}</span>
    </div>
  );
}
