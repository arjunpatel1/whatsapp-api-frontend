import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Plus, Edit2, Trash2, Package, X } from 'lucide-react';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', price: '', status: 'Active' });

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/packages');
      setPackages(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openModal = (pkg = null) => {
    if (pkg) {
      setFormData({ id: pkg.id, name: pkg.name, price: pkg.price, status: pkg.status });
    } else {
      setFormData({ id: '', name: '', price: '', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const deletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await api('DELETE', `/api/packages/${id}`);
      fetchPackages();
    } catch (e) {
      alert('Failed to delete package');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api('PUT', `/api/packages/${formData.id}`, { name: formData.name, price: formData.price, status: formData.status });
      } else {
        await api('POST', '/api/packages', { name: formData.name, price: formData.price, status: formData.status });
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (e) {
      alert(e.message || 'Failed to save package');
    }
  };

  return (
    <div style={{ padding: '30px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={24} /> Packages
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Manage subscription and pricing tiers</p>
        </div>
        <button 
          onClick={() => openModal()}
          style={{ padding: '8px 16px', backgroundColor: 'var(--green-xdark)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          <Plus size={16} /> Create
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600', width: '80px' }}>SRNO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Package Name</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>WhatsApp Price</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right', width: '120px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading packages...</td></tr>
            ) : packages.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No packages found.</td></tr>
            ) : (
              packages.map((pkg, index) => (
                <tr key={pkg.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{pkg.name}</td>
                  <td style={{ padding: '12px 16px' }}>₹ {pkg.price}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: pkg.status === 'Active' ? 'var(--green-light)' : 'var(--red-light)',
                      color: pkg.status === 'Active' ? 'var(--green-dark)' : 'var(--red)'
                    }}>
                      {pkg.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => openModal(pkg)} style={{ padding: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={16} /></button>
                    <button onClick={() => deletePackage(pkg.id)} style={{ padding: '6px', backgroundColor: 'var(--red-light)', color: 'var(--red)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '400px', maxWidth: '95vw', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{formData.id ? 'Edit Package' : 'Create Package'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-light)" /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Package Name *</label>
                <input required type="text" placeholder="e.g. Diamond" style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>WhatsApp Price *</label>
                <input required type="number" step="0.001" placeholder="0.114" style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Status</label>
                <select style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--green-xdark)', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Save Package</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
