import { useState } from 'react';
import type { Category } from '../../types';

export default function CategoryManagement({ token, categories, onChange, loadError }: {
  token: string | null; categories: Category[]; onChange: () => Promise<void>; loadError: string;
}) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const save = async (method: 'POST' | 'PUT' | 'DELETE', id?: string) => {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/categories${id ? `/${id}` : ''}`, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        ...(method !== 'DELETE' ? { body: JSON.stringify({ name }) } : {}),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Unable to save category.');
      setName(''); setEditingId(null);
      await onChange();
      window.dispatchEvent(new Event('nita-categories-changed'));
      setMessage(method === 'DELETE' ? 'Category deleted.' : 'Category saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save category.'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl bg-white border border-emerald-100 p-6 space-y-5">
    <h2 className="text-xl font-bold text-emerald-900">Product Categories</h2>
    <p className="text-sm text-gray-600">Manage the categories used by product forms and the shop. Reassign products before deleting a category.</p>
    <form className="flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); void save(editingId ? 'PUT' : 'POST', editingId || undefined); }}>
      <label className="flex-1">Category name<input required maxLength={120} value={name} disabled={busy} onChange={event => setName(event.target.value)} className="block w-full border rounded-lg p-2" /></label>
      <button disabled={busy || !name.trim()} className="self-end bg-emerald-700 text-white rounded-lg px-4 py-2 disabled:opacity-50">{editingId ? 'Save category' : 'Create category'}</button>
      {editingId && <button type="button" disabled={busy} onClick={() => { setEditingId(null); setName(''); }}>Cancel</button>}
    </form>
    {(message || loadError) && <p role="status" className="text-sm">{message || loadError}</p>}
    {!categories.length && !loadError && <p>No categories yet. Create one before adding products.</p>}
    <ul className="divide-y">{categories.map(category => <li key={category.id} className="flex flex-wrap items-center gap-3 py-3">
      <span className="flex-1 font-medium">{category.name || 'Unnamed legacy category'}</span>
      <span className="text-sm text-gray-500">{category._count?.products || 0} products</span>
      <button disabled={busy} onClick={() => { setEditingId(category.id); setName(category.name); setMessage(''); }} className="text-emerald-700 px-2">Edit</button>
      <button disabled={busy || !!category._count?.products} title={category._count?.products ? 'Reassign products first' : 'Delete unused category'} onClick={() => { if (window.confirm(`Delete unused category "${category.name}"?`)) void save('DELETE', category.id); }} className="text-red-700 px-2 disabled:opacity-40">Delete</button>
    </li>)}</ul>
  </section>;
}
