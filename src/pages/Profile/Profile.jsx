import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { User, Mail, Shield, Building2, Phone, Edit2, Save, X, MapPin } from 'lucide-react';
import { api } from '../../utils/api';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const { showToast } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [loading, setLoading] = useState(false);

  if (!user) return <div style={{ padding: '30px' }}>Loading...</div>;

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setFormData({
        companyName: user?.companyName || '',
        phone: user?.phone || '',
        address: user?.address || ''
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api('PUT', '/api/auth/profile', formData);
      if (res.success) {
        // update context
        const newToken = localStorage.getItem('token');
        login(newToken, { ...user, companyName: formData.companyName, phone: formData.phone, address: formData.address });
        setIsEditing(false);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile', 'error');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text)' }}>My Profile</h1>
        {!isEditing ? (
          <button onClick={handleEditToggle} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
            <Edit2 size={16} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleEditToggle} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
              <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
      <p style={{ color: 'var(--text-mid)', fontSize: '14px', marginBottom: '30px' }}>Your account information and details.</p>

      <div style={{ 
        backgroundColor: 'var(--white)', 
        borderRadius: '12px', 
        padding: '40px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
        border: '1px solid var(--border)' 
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary-light)', 
            color: 'var(--primary)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '40px'
          }}>
            {(user.companyName?.[0] || user.email?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '28px', color: 'var(--text)', marginBottom: '8px' }}>
              {user.companyName || 'User'}
            </h2>
            <div style={{ display: 'inline-flex', padding: '6px 14px', backgroundColor: user.role === 'admin' ? 'var(--orange-light)' : 'var(--green-light)', color: user.role === 'admin' ? 'var(--orange)' : 'var(--green-dark)', borderRadius: '12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
              {user.role}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 40px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <Mail size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
              <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: '500' }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <Building2 size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company / Name</div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                />
              ) : (
                <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: '500' }}>{user.companyName || 'Not Provided'}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <Phone size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</div>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                />
              ) : (
                <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: '500' }}>{user.phone || 'Not Provided'}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <MapPin size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                  placeholder="Enter full address"
                />
              ) : (
                <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: '500' }}>{user.address || 'Not Provided'}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <Shield size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Status</div>
              <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: '500', textTransform: 'capitalize' }}>{user.status || 'Active'}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
