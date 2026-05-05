import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Content */}
      <div className="relative z-50 card p-8 w-full max-w-sm shadow-[0_0_50px_rgba(239,68,68,0.15)] border-red-500/20">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Are you sure?</h3>
            <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{message}</p>
          </div>

          <div className="flex flex-col gap-3 w-full pt-2">
            <button className="btn-danger w-full justify-center py-3.5 text-sm font-bold uppercase tracking-widest shadow-lg shadow-red-500/10" onClick={onConfirm}>
              Confirm Delete
            </button>
            <button className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors py-2" onClick={onClose}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
