import { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

export default function EditModal({ title, fields, initialData, onSave, onClose }) {
  const [form, setForm] = useState({ ...initialData });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-50 card p-0 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-slate-800/40">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-1">Modify entry details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-300 ring-1 ring-transparent hover:ring-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 sm:px-8 py-6 sm:py-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 flex-1 custom-scrollbar">
            {fields.map((field) => (
              <div key={field.key} className={`${field.full ? 'sm:col-span-2' : ''} space-y-3`}>
                <label className="block text-sm font-semibold text-slate-300 ml-1 mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    className="form-input w-full appearance-none cursor-pointer"
                    value={form[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.inputType || 'text'}
                    className="form-input w-full"
                    value={form[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 px-5 sm:px-8 py-4 sm:py-6 border-t border-slate-800/40 bg-slate-900/20 backdrop-blur-xl">
            <button type="button" className="w-full sm:w-auto text-sm font-medium text-slate-400 hover:text-white transition-colors px-6 py-3" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto min-w-[160px] justify-center" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={16} /> Save Changes
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
