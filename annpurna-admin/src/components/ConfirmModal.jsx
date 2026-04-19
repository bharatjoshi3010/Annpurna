import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 card p-6 w-full max-w-sm shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Are you sure?</h3>
          <p className="text-sm text-slate-400">{message}</p>
          <div className="flex gap-3 w-full mt-2">
            <button className="btn-secondary flex-1 justify-center" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-danger flex-1 justify-center" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
