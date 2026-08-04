'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, LayoutDashboard, Globe, AlertTriangle } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  description: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export function SponsorsPage() {
  const { currentUser } = useAppStore();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Sponsor>>({
    name: '', logoUrl: '', websiteUrl: '', description: '', priority: 0, isActive: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchSponsors = async () => {
    try {
      const res = await fetch('/api/sponsors?includeInactive=true');
      const data = await res.json();
      if (data.success) {
        setSponsors(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load sponsors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/sponsors/${editingId}` : '/api/sponsors';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchSponsors();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('An error occurred while saving.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor permanently?')) return;
    try {
      const res = await fetch(`/api/sponsors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchSponsors();
      else alert(data.message);
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const openEdit = (s: Sponsor) => {
    setFormData(s);
    setEditingId(s.id);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setFormData({ name: '', logoUrl: '', websiteUrl: '', description: '', priority: 0, isActive: true });
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (currentUser?.role !== 'PRESIDENT' && currentUser?.role !== 'PLATFORM_ADMIN' && currentUser?.role !== 'GS' && currentUser?.role !== 'TREASURER') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-16 w-16 text-rose-500" />
        <h2 className="text-2xl font-bold text-gray-100">Access Denied</h2>
        <p className="text-gray-400 max-w-md">Only executive committee members have clearance to access the Sponsor Management dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            <Globe className="h-8 w-8 text-emerald-500" />
            Official Sponsors
          </h1>
          <p className="mt-2 text-gray-400">Manage club sponsors displayed on the About page</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500">
          <Plus className="h-4 w-4" />
          Add Sponsor
        </button>
      </div>

      {loading ? (
        <div className="text-emerald-500 text-center py-10">Loading Sponsors...</div>
      ) : error ? (
        <div className="text-rose-500 text-center py-10">{error}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sponsors.map(sponsor => (
            <div key={sponsor.id} className="relative overflow-hidden rounded-xl border border-gray-800 bg-[#111111] p-6 shadow-xl transition-all hover:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${sponsor.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                  {sponsor.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {sponsor.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(sponsor)} className="text-blue-400 hover:text-blue-300"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(sponsor.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <div className="w-24 h-24 bg-gray-900 rounded-lg p-2 flex items-center justify-center border border-gray-800">
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                </div>
                <h3 className="text-xl font-bold text-gray-200">{sponsor.name}</h3>
                {sponsor.description && <p className="text-xs text-gray-400 line-clamp-2">{sponsor.description}</p>}
                <div className="mt-2 flex w-full justify-between text-xs text-gray-500">
                  <span>Priority: {sponsor.priority}</span>
                  {sponsor.websiteUrl && <a href={sponsor.websiteUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">Website ↗</a>}
                </div>
              </div>
            </div>
          ))}
          {sponsors.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500">
              <LayoutDashboard className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p>No sponsors found. Add one to get started.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111111] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">{editingId ? 'Edit Sponsor' : 'Add New Sponsor'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Sponsor Name</label>
                <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-800 bg-black px-4 py-2 text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Logo Image URL</label>
                <input type="url" required value={formData.logoUrl || ''} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-800 bg-black px-4 py-2 text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Website URL (Optional)</label>
                <input type="url" value={formData.websiteUrl || ''} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-800 bg-black px-4 py-2 text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Short Description (Optional)</label>
                <textarea rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-800 bg-black px-4 py-2 text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-400">Display Priority</label>
                  <input type="number" value={formData.priority || 0} onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})} className="mt-1 w-full rounded-lg border border-gray-800 bg-black px-4 py-2 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="h-5 w-5 rounded border-gray-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900 bg-black" />
                    <span className="text-sm font-medium text-gray-300">Active Status</span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Save Sponsor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
