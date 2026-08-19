import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { api } from '../../utils/api';
import { Plus, RefreshCw, Trash2, Smartphone, X, MoreVertical, Send, Edit, Clock, List, Settings, MessageSquare, RotateCcw, XCircle, LayoutTemplate, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import FundsModal from '../../components/ui/FundsModal';
import SendCampaignModal from '../../components/ui/SendCampaignModal';
import EditAccountModal from '../../components/ui/EditAccountModal';
import AccountHistoryModal from '../../components/ui/AccountHistoryModal';

const matchesBalance = (balance, filterText) => {
  if (!filterText) return true;
  const text = filterText.trim();
  if (text === '') return true;

  // Range query: "100-500"
  if (text.includes('-')) {
    const parts = text.split('-');
    if (parts.length === 2) {
      const min = parseFloat(parts[0].trim());
      const max = parseFloat(parts[1].trim());
      if (!isNaN(min) && !isNaN(max)) return balance >= min && balance <= max;
      if (!isNaN(min) && isNaN(max)) return balance >= min;
      if (isNaN(min) && !isNaN(max)) return balance <= max;
    }
  }

  // Operators: ">500", "<=500" etc.
  if (text.startsWith('>=')) {
    const val = parseFloat(text.slice(2).trim());
    return !isNaN(val) && balance >= val;
  }
  if (text.startsWith('<=')) {
    const val = parseFloat(text.slice(2).trim());
    return !isNaN(val) && balance <= val;
  }
  if (text.startsWith('>')) {
    const val = parseFloat(text.slice(1).trim());
    return !isNaN(val) && balance > val;
  }
  if (text.startsWith('<')) {
    const val = parseFloat(text.slice(1).trim());
    return !isNaN(val) && balance < val;
  }

  // Single number: default to "less than or equal to" (500 and below)
  const val = parseFloat(text);
  if (!isNaN(val)) {
    return balance <= val;
  }

  return true;
};

const Numbers = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast, showConfirm } = useContext(AppContext);
  const [accounts, setAccounts] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [childModalState, setChildModalState] = useState({ isOpen: false, client: null });
  const [packages, setPackages] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, x, y }

  // Modals state
  const [fundsModalState, setFundsModalState] = useState({ isOpen: false, account: null, isDebit: false, balanceType: 'acBalance' });
  const [sendModalAccount, setSendModalAccount] = useState(null);
  const [editModalAccount, setEditModalAccount] = useState(null);
  const [acHistoryModalAccount, setAcHistoryModalAccount] = useState(null);
  const [waHistoryModalAccount, setWaHistoryModalAccount] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeAccount, setUpgradeAccount] = useState(null);
  const [selectedUpgradePackage, setSelectedUpgradePackage] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Filters state
  const [numSearch, setNumSearch] = useState('');
  const [amountSearch, setAmountSearch] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [autoRechargeFilter, setAutoRechargeFilter] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Child modal filters state
  const [childNumSearch, setChildNumSearch] = useState('');
  const [childAmountSearch, setChildAmountSearch] = useState('');
  const [childPackageFilter, setChildPackageFilter] = useState('');
  const [childAutoRechargeFilter, setChildAutoRechargeFilter] = useState('');
  const [childSubStatusFilter, setChildSubStatusFilter] = useState('');
  const [isChildFilterOpen, setIsChildFilterOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [childCurrentPage, setChildCurrentPage] = useState(1);
  const [childItemsPerPage, setChildItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    accountName: '',
    displayPhone: '',
    phoneId: '',
    wabaId: '',
    wabaId: '',
    token: '',
    packageId: '',
    subscriptionPeriod: ''
  });

  const [phoneError, setPhoneError] = useState('');
  const [signupTab, setSignupTab] = useState('embedded'); // 'embedded' | 'manual'
  const [isEmbeddedLoading, setIsEmbeddedLoading] = useState(false);

  const sessionRef = useRef({ code: '', phoneId: '', wabaId: '' });
  const tableRef = useRef(null);
  const childTableRef = useRef(null);
  const isFirstRender = useRef(true);
  const isFirstChildRender = useRef(true);

  const tryAutoSubmit = async () => {
    const { code, phoneId, wabaId } = sessionRef.current;
    if (phoneId || wabaId || code) {
      console.log('⚡ AUTO CONNECT TRIGGERED:', { code, phoneId, wabaId });
      sessionRef.current = { code: '', phoneId: '', wabaId: '' };
      await handleEmbeddedSignupSuccess({ code, phoneId, wabaId });
    }
  };

  useEffect(() => {
    if (!window.FB) {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: '692935879795192',
          cookie: true,
          xfbml: true,
          version: 'v20.0'
        });
      };
      (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }

    const handleMetaMessage = async (event) => {
      let isMetaDomain = false;
      if (typeof event.origin === 'string') {
        const originLower = event.origin.toLowerCase();
        if (originLower.includes('facebook.com') || originLower.includes('facebook.net') || originLower.includes('fb.com') || originLower.includes('meta.com')) {
          isMetaDomain = true;
        }
      }

      let raw = event.data;
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          return;
        }
      }

      if (!raw || typeof raw !== 'object') return;
      console.log('Meta postMessage received:', raw, 'origin:', event.origin);

      const payloadData = raw.data || raw;
      const phoneId = payloadData.phone_number_id || payloadData.phoneNumberId || payloadData.phone_id || payloadData.phoneId || raw.phone_number_id || raw.phoneNumberId;
      const wabaId = payloadData.waba_id || payloadData.wabaId || payloadData.waba_account_id || raw.waba_id || raw.wabaId;
      const code = payloadData.code || raw.code;

      if (raw.event === 'CANCEL' || raw.type === 'CANCEL') {
        showToast('Meta signup cancelled', 'info');
        setIsEmbeddedLoading(false);
        return;
      }

      if (phoneId || wabaId || code) {
        console.log('✅ Captured Meta Signup Data:', { phoneId, wabaId, code });
        if (phoneId) sessionRef.current.phoneId = phoneId;
        if (wabaId) sessionRef.current.wabaId = wabaId;
        if (code) sessionRef.current.code = code;
        await tryAutoSubmit();
      }
    };

    window.addEventListener('message', handleMetaMessage);
    return () => window.removeEventListener('message', handleMetaMessage);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setIsEmbeddedLoading(false);
      sessionRef.current = { code: '', phoneId: '', wabaId: '' };
    }
  }, [isModalOpen]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncMeta = async () => {
    setIsSyncing(true);
    try {
      const res = await api('POST', '/api/accounts/sync-meta');
      if (res && res.syncedCount > 0) {
        showToast(`Successfully synced ${res.syncedCount} new WhatsApp number(s) from Meta!`, 'success');
      } else {
        showToast('Meta sync complete. All numbers are up to date.', 'info');
      }
      await fetchAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to sync numbers from Meta', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const [selectedClientId, setSelectedClientId] = useState('');

  const handleEmbeddedSignupSuccess = async ({ code, phoneId, wabaId }) => {
    setIsEmbeddedLoading(true);
    try {
      const payload = {
        code,
        phoneId,
        wabaId,
        package: formData.packageId || 'Free',
        name: formData.accountName || undefined,
        clientId: user?.role === 'admin' ? selectedClientId : undefined
      };
      console.log('Sending embedded signup payload:', payload);
      try {
        await api('POST', '/api/accounts/embedded-signup', payload);
      } catch (embErr) {
        console.warn('Embedded signup direct POST warning, running full Meta sync...', embErr);
      }

      await api('POST', '/api/accounts/sync-meta', { package: formData.packageId || 'Free', clientId: user?.role === 'admin' ? selectedClientId : undefined });
      setIsModalOpen(false);
      await fetchAccounts();
      showToast('WhatsApp number synced successfully from Meta!', 'success');
    } catch (err) {
      console.error('Embedded signup failed error:', err);
      showToast(err.message || 'Failed to complete Meta Embedded Signup', 'error');
    } finally {
      setIsEmbeddedLoading(false);
    }
  };

  const launchMetaEmbeddedSignup = () => {
    if (!formData.packageId) {
      showToast('Please select a package before proceeding with Meta signup', 'error');
      return;
    }
    setIsEmbeddedLoading(true);

    const onboardUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=692935879795192&config_id=2785703191793397&extras=${encodeURIComponent(JSON.stringify({ sessionInfoVersion: "3", version: "v4" }))}`;
    const width = 1200, height = 850;
    const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
    const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);

    let popup = null;
    try {
      popup = window.open(onboardUrl, 'MetaWhatsAppSignup', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
    } catch (e) {
      console.warn('Popup open error:', e);
    }

    if (!popup) {
      setIsEmbeddedLoading(false);
      showToast('Popup blocked! Please allow popups for this site.', 'error');
      return;
    }

    const timer = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setIsEmbeddedLoading(false);
        if (sessionRef.current.phoneId || sessionRef.current.wabaId || sessionRef.current.code) {
          await tryAutoSubmit();
        } else {
          console.log('Popup closed, attempting automatic Meta account sync fallback...');
          try {
            await handleEmbeddedSignupSuccess({ code: '', phoneId: '', wabaId: '' });
          } catch (e) {}
        }
      }
    }, 1000);

    const loginOptions = {
      config_id: '2785703191793397',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        sessionInfoVersion: '3',
        version: 'v4'
      }
    };

    if (window.FB && typeof window.FB.login === 'function') {
      try {
        window.FB.login(async (response) => {
          if (response && response.authResponse && response.authResponse.code) {
            console.log('Meta FB.login OAuth code:', response.authResponse.code);
            sessionRef.current.code = response.authResponse.code;
            await tryAutoSubmit();
          }
        }, loginOptions);
      } catch (err) {
        console.warn('FB.login error:', err);
      }
    }
  };

  const handlePhoneChange = (val) => {
    let cleanVal = val.replace(/[^\d\s\-+]/g, '');
    if (cleanVal.includes('+')) {
      cleanVal = (cleanVal.startsWith('+') ? '+' : '') + cleanVal.replace(/\+/g, '');
    }

    setFormData(prev => ({ ...prev, displayPhone: cleanVal }));

    if (!cleanVal) {
      setPhoneError('');
      return;
    }
    if (!cleanVal.startsWith('+')) {
      setPhoneError('Must start with + followed by country code (e.g., +91)');
      return;
    }
    const digitsOnly = cleanVal.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setPhoneError('Must contain between 7 and 15 digits');
      return;
    }
    setPhoneError('');
  };

  const [periodMonth, setPeriodMonth] = useState('');
  const [periodYear, setPeriodYear] = useState('');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  const computePeriod = (month, year) => {
    if (!month || !year) return '';
    const mIdx = parseInt(month) - 1;
    const mName = MONTHS[mIdx].slice(0, 3);
    const daysInMonth = new Date(parseInt(year), mIdx + 1, 0).getDate();
    return `${mName}01-${daysInMonth}`;
  };

  const handleMonthChange = (e) => {
    const m = e.target.value;
    setPeriodMonth(m);
    setFormData(prev => ({ ...prev, subscriptionPeriod: computePeriod(m, periodYear) }));
  };

  const handleYearChange = (e) => {
    const y = e.target.value;
    setPeriodYear(y);
    setFormData(prev => ({ ...prev, subscriptionPeriod: computePeriod(periodMonth, y) }));
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      if (user?.role === 'admin') {
        const res = await api('GET', '/api/admin/users');
        if (Array.isArray(res)) {
          setAdminUsers(res);
          setChildModalState(prev => {
            if (prev.isOpen && prev.client) {
              const updatedClient = res.find(u => (u.id || u._id) === (prev.client.id || prev.client._id));
              return updatedClient ? { ...prev, client: updatedClient } : prev;
            }
            return prev;
          });
        }
      } else {
        const res = await api('GET', '/api/accounts');
        if (Array.isArray(res)) setAccounts(res);
      }
      fetchWallet();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchPackages = async () => {
    try {
      const res = await api('GET', '/api/packages');
      if (Array.isArray(res)) {
        const active = res.filter(p => p.status === 'Active');
        setPackages(active);
        return active;
      }
    } catch (e) {
      console.error('fetchPackages error:', e.message);
    }
    return [];
  };

  const fetchWallet = async () => {
    try {
      const res = await api('GET', '/api/user-wallet');
      setWalletBalance(res.balance || 0);
    } catch (e) {
      console.error('fetchWallet error:', e.message);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchPackages();

    const handleClickOutside = () => {
      setActiveDropdown(null);
      setIsFilterOpen(false);
      setIsChildFilterOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [numSearch, amountSearch, packageFilter, autoRechargeFilter, subStatusFilter]);

  useEffect(() => {
    setChildCurrentPage(1);
  }, [childNumSearch, childAmountSearch, childPackageFilter, childAutoRechargeFilter, childSubStatusFilter]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  useEffect(() => {
    if (isFirstChildRender.current) {
      isFirstChildRender.current = false;
      return;
    }
    if (childTableRef.current) {
      childTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [childCurrentPage]);

  const openModalForClient = (client) => {
    fetchPackages();
    fetchWallet();
    if (client) {
      setSelectedClientId(client.id || client._id);
    } else if (adminUsers.length > 0) {
      setSelectedClientId(adminUsers[0].id || adminUsers[0]._id);
    } else {
      setSelectedClientId('');
    }
    setFormData({
      accountName: '',
      displayPhone: '',
      phoneId: '',
      wabaId: '',
      token: '',
      packageId: '',
      subscriptionPeriod: ''
    });
    setPhoneError('');
    if (user?.role !== 'admin') {
      setSignupTab('manual');
    } else {
      setSignupTab('embedded');
    }
    setIsModalOpen(true);
  };

  const openModal = () => openModalForClient(null);

  const getPackageSubPrice = (packageName) => {
    if (!packageName || packageName === 'Free') return 0;
    const pkg = packages.find(p => p.name.toLowerCase() === packageName.toLowerCase());
    return pkg && typeof pkg.subscriptionPrice === 'number' ? pkg.subscriptionPrice : 500;
  };

  const renewSubscription = async (id, packageName) => {
    const subPrice = getPackageSubPrice(packageName);
    const ok = await showConfirm({
      title: 'Renew Subscription',
      message: `Are you sure you want to renew this number for 1 month?\n\n₹${subPrice} will be deducted from your Wallet Balance.`,
      type: 'info',
      confirmText: 'Renew'
    });
    if (!ok) return;
    try {
      await api('POST', `/api/accounts/${id}/renew`);
      showToast(`Subscription renewed! ₹${subPrice} deducted from your Wallet Balance.`, 'success');
      fetchAccounts();
    } catch (e) {
      showToast(e.message || 'Failed to renew subscription', 'error');
    }
  };

  const cancelSubscription = async (id) => {
    const ok = await showConfirm({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel this plan?\n\nThis will immediately deactivate your plan. A prorated refund for unused days will be added back to your Wallet Balance.',
      type: 'danger',
      confirmText: 'Deactivate'
    });
    if (!ok) return;
    try {
      const res = await api('POST', `/api/accounts/${id}/cancel`);
      showToast(`Plan cancelled. ₹${res.refunded || 0} refunded to your Wallet Balance.`, 'info');
      fetchAccounts();
    } catch (e) {
      showToast(e.message || 'Failed to cancel subscription', 'error');
    }
  };

  const canUpgradeAccount = (packageName) => {
    if (!packageName || packageName === 'Free') return true;
    const currentPkg = packages.find(p => p.name.toLowerCase() === packageName.toLowerCase());
    if (!currentPkg) return true;
    const currentPriority = typeof currentPkg.priority === 'number' ? currentPkg.priority : 9999;
    return packages.some(p => typeof p.priority === 'number' && p.priority < currentPriority);
  };

  const getUpgradePackages = (currentPackageName) => {
    if (!currentPackageName || currentPackageName === 'Free') return packages;
    const currentPkg = packages.find(p => p.name.toLowerCase() === currentPackageName.toLowerCase());
    if (!currentPkg) return packages;
    const currentPriority = typeof currentPkg.priority === 'number' ? currentPkg.priority : 9999;
    return packages.filter(p => typeof p.priority === 'number' && p.priority < currentPriority);
  };

  const openUpgradeModal = (acc) => {
    fetchWallet();
    fetchPackages();
    setUpgradeAccount(acc);
    setSelectedUpgradePackage('');
    setIsUpgradeModalOpen(true);
  };

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    if (!upgradeAccount || !selectedUpgradePackage) return;
    
    const targetPkg = packages.find(p => p.name === selectedUpgradePackage);
    if (!targetPkg) return;
    
    if (walletBalance < (targetPkg.subscriptionPrice || 0) && user?.role !== 'admin') {
      showToast('Insufficient Wallet Balance. Please add funds to your wallet.', 'warning');
      return;
    }
    
    setIsUpgrading(true);
    try {
      await api('POST', `/api/accounts/${upgradeAccount.id}/upgrade`, { package: selectedUpgradePackage });
      showToast(`Successfully upgraded to package: ${selectedUpgradePackage}!`, 'success');
      setIsUpgradeModalOpen(false);
      fetchAccounts();
      fetchWallet();
    } catch (e) {
      showToast(e.message || 'Failed to upgrade package', 'error');
    }
    setIsUpgrading(false);
  };

  const deleteAccount = async (id) => {
    const ok = await showConfirm({
      title: 'Delete Account',
      message: 'Are you sure you want to delete this account?',
      type: 'danger',
      confirmText: 'Delete'
    });
    if (!ok) return;
    try {
      await api('DELETE', `/api/accounts/${id}`);
      fetchAccounts();
      showToast('Account deleted successfully', 'success');
    } catch (e) {
      showToast('Failed to delete account', 'error');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.packageId) {
      showToast('Please select a package', 'error');
      return;
    }
    if (user?.role === 'admin' && !selectedClientId) {
      showToast('Please select a client to add this number for', 'error');
      return;
    }
    const cleanPhone = (formData.displayPhone || '').trim();
    const phoneRegex = /^\+[0-9\s\-]+$/;
    if (!cleanPhone.startsWith('+') || !phoneRegex.test(cleanPhone)) {
      setPhoneError('Must start with + followed by country code (e.g., +91)');
      return;
    }
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setPhoneError('Must contain between 7 and 15 digits');
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.accountName,
        package: formData.packageId,
        clientId: user?.role === 'admin' ? selectedClientId : undefined
      };
      await api('POST', '/api/accounts', payload);
      setIsModalOpen(false);
      fetchAccounts();
      showToast('WhatsApp number added successfully!', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to add number', 'error');
    }
  };

  const filteredAdminUsers = adminUsers.filter(client => {
    if (numSearch) {
      const searchLower = numSearch.toLowerCase();
      const phoneMatch = client.phone && client.phone.toLowerCase().includes(searchLower);
      const emailMatch = client.email && client.email.toLowerCase().includes(searchLower);
      const nameMatch = client.companyName && client.companyName.toLowerCase().includes(searchLower);
      if (!phoneMatch && !emailMatch && !nameMatch) return false;
    }
    if (amountSearch) {
      const balance = client.walletBalance || 0;
      if (!matchesBalance(balance, amountSearch)) return false;
    }
    return true;
  });

  const filteredAccounts = accounts.filter(acc => {
    if (numSearch) {
      const searchLower = numSearch.toLowerCase();
      const phone = acc.displayPhone || acc.phoneId || '';
      if (!phone.toLowerCase().includes(searchLower)) return false;
    }
    if (amountSearch) {
      const balance = acc.whatsappBalance || acc.prepaidBalance || 0;
      if (!matchesBalance(balance, amountSearch)) return false;
    }
    if (packageFilter) {
      const accPackage = acc.package || acc.packageId || '';
      if (accPackage.toLowerCase() !== packageFilter.toLowerCase()) return false;
    }
    if (autoRechargeFilter) {
      const isAuto = acc.autoRecharge ? 'yes' : 'no';
      if (isAuto !== autoRechargeFilter.toLowerCase()) return false;
    }
    if (subStatusFilter) {
      const now = new Date();
      const subActive = acc.subscriptionExpiresAt && new Date(acc.subscriptionExpiresAt) > now;
      if (subStatusFilter === 'active' && !subActive) return false;
      if (subStatusFilter === 'expired' && subActive) return false;
    }
    return true;
  });

  const totalItems = user?.role === 'admin' ? filteredAdminUsers.length : filteredAccounts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const effectiveCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const indexOfLastItem = effectiveCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const paginatedAdminUsers = filteredAdminUsers.slice(indexOfFirstItem, indexOfLastItem);
  const paginatedAccounts = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);

  const renderPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;

    if (totalPages === 0) {
      return (
        <button
          key="p-empty"
          disabled
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--white)',
            color: 'var(--text-light)',
            cursor: 'not-allowed',
            fontSize: '13px',
            minWidth: '32px'
          }}
        >
          1
        </button>
      );
    }

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, effectiveCurrentPage - 1);
      let end = Math.min(totalPages - 1, effectiveCurrentPage + 1);

      if (effectiveCurrentPage <= 2) {
        end = 4;
      } else if (effectiveCurrentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('ellipsis1');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis2');
      }

      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === 'ellipsis1' || p === 'ellipsis2') {
        return (
          <span
            key={`ellipsis-${idx}`}
            style={{
              padding: '6px 12px',
              color: 'var(--text-light)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ...
          </span>
        );
      }

      const isActive = p === effectiveCurrentPage;
      return (
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: isActive ? 'var(--primary)' : 'var(--white)',
            color: isActive ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: isActive ? '600' : '400',
            transition: 'all 0.2s',
            minWidth: '32px',
            textAlign: 'center'
          }}
        >
          {p}
        </button>
      );
    });
  };
  const currentSubFee = getPackageSubPrice(formData.packageId);

  return (
    <div style={{ padding: '30px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={24} /> Numbers
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Manage your WhatsApp Business phone numbers</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={openModal}
            style={{ padding: '8px 16px', backgroundColor: 'var(--green-xdark)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            <Plus size={16} /> Add Number
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={handleSyncMeta}
              disabled={isSyncing}
              style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: isSyncing ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isSyncing ? 0.7 : 1 }}
            >
              <RefreshCw size={16} /> {isSyncing ? 'Syncing Meta...' : 'Sync Meta Numbers'}
            </button>
          )}

          {/* Filter Popover Button & Popup */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
              style={{
                padding: '8px 12px',
                backgroundColor: isFilterOpen || numSearch || amountSearch || packageFilter || autoRechargeFilter || subStatusFilter ? 'var(--primary-light)' : 'var(--white)',
                border: `1px solid ${isFilterOpen || numSearch || amountSearch || packageFilter || autoRechargeFilter || subStatusFilter ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                color: isFilterOpen || numSearch || amountSearch || packageFilter || autoRechargeFilter || subStatusFilter ? 'var(--primary)' : 'var(--text-mid)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}
              title="Filter records"
            >
              <SlidersHorizontal size={16} />
              Filter {(numSearch || amountSearch || packageFilter || autoRechargeFilter || subStatusFilter) ? '(Active)' : ''}
            </button>

            {isFilterOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '42px',
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  padding: '16px',
                  zIndex: 1000,
                  width: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>Filter Records</span>
                  <button
                    onClick={() => { setNumSearch(''); setAmountSearch(''); setPackageFilter(''); setAutoRechargeFilter(''); setSubStatusFilter(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: 'var(--primary)', padding: 0 }}
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>Search Number/Name</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                    <Search size={14} color="var(--text-light)" style={{ marginRight: '6px' }} />
                    <input
                      type="text"
                      placeholder={user?.role === 'admin' ? "Search client..." : "Search number..."}
                      value={numSearch}
                      onChange={(e) => setNumSearch(e.target.value)}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: 'var(--text)', background: 'transparent' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>
                    {user?.role === 'admin' ? 'AC Balance Filter' : 'WhatsApp Balance Filter'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                    <input
                      type="text"
                      placeholder="e.g. 500 or 100-500"
                      value={amountSearch}
                      onChange={(e) => setAmountSearch(e.target.value)}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: 'var(--text)', background: 'transparent' }}
                    />
                  </div>
                </div>

                {user?.role !== 'admin' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>Package Filter</label>
                      <select
                        value={packageFilter}
                        onChange={(e) => setPackageFilter(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text)', outline: 'none', backgroundColor: 'transparent' }}
                      >
                        <option value="">All Packages</option>
                        {packages.map(p => (
                          <option key={p.id || p._id} value={p.name}>{p.name}</option>
                        ))}
                        <option value="None">None</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>Auto Recharge</label>
                      <select
                        value={autoRechargeFilter}
                        onChange={(e) => setAutoRechargeFilter(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text)', outline: 'none', backgroundColor: 'transparent' }}
                      >
                        <option value="">All Auto Recharge</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>Subscription Status</label>
                      <select
                        value={subStatusFilter}
                        onChange={(e) => setSubStatusFilter(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text)', outline: 'none', backgroundColor: 'transparent' }}
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="expired">No Subscription / Expired</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={fetchAccounts}
            style={{ padding: '8px 12px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-mid)' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div ref={tableRef} style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>SRNO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Number</th>
              {user?.role === 'admin' && <th style={{ padding: '12px 16px', fontWeight: '600' }}>AC Balance</th>}
              {user?.role !== 'admin' && (
                <>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>WhatsappBalance</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Whatsapp</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Package</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Upgrade</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Period</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Autorecharge</th>
                </>
              )}
              {user?.role === 'admin' && <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Child Numbers</th>}
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading numbers...</td></tr>
            ) : user?.role === 'admin' ? (
              filteredAdminUsers.length === 0 ? (
                <tr><td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No registered clients found.</td></tr>
              ) : (
                paginatedAdminUsers.map((client, index) => (
                  <React.Fragment key={client.id || client._id}>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fff' }}>
                      <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px' }}>{indexOfFirstItem + index + 1}</td>
                      <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '13px' }}>{client.phone || '-'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-mid)' }}>{client.email} {client.companyName ? `(${client.companyName})` : ''}</div>
                      </td>
                      <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '13px', color: 'var(--text)' }}>₹ {Number(client.walletBalance || 0).toFixed(2)}</div>
                        <div style={{ fontSize: '11px', display: 'flex', gap: '8px' }}>
                          <button onClick={() => setFundsModalState({ isOpen: true, account: client, isDebit: false, balanceType: 'wallet' })} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Credit</button>
                          <span style={{ color: 'var(--text-light)' }}>/</span>
                          <button onClick={() => setFundsModalState({ isOpen: true, account: client, isDebit: true, balanceType: 'wallet' })} style={{ color: '#e53935', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Debit</button>
                        </div>
                      </td>
                      <td style={{ padding: '13px 14px', textAlign: 'center' }}>
                        <button onClick={() => setChildModalState({ isOpen: true, client })} style={{ padding: '6px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}>
                          View
                        </button>
                      </td>
                      <td style={{ padding: '16px', position: 'relative', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const id = `client-${client.id || client._id}`;
                            if (activeDropdown && activeDropdown.id === id) {
                              setActiveDropdown(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const openUpward = spaceBelow < 270 && rect.top > 270;
                              setActiveDropdown({
                                id,
                                x: rect.right,
                                top: rect.bottom + 4,
                                bottom: window.innerHeight - rect.top + 4,
                                openUpward
                              });
                            }
                          }}
                          style={{ padding: '6px', background: 'none', color: 'var(--text)', border: 'none', cursor: 'pointer' }}
                        >
                          <MoreVertical size={20} />
                        </button>
                        {activeDropdown && activeDropdown.id === `client-${client.id || client._id}` && (
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{
                              position: 'fixed',
                              right: `${window.innerWidth - activeDropdown.x}px`,
                              top: activeDropdown.openUpward ? 'auto' : `${activeDropdown.top}px`,
                              bottom: activeDropdown.openUpward ? `${activeDropdown.bottom}px` : 'auto',
                              backgroundColor: 'white',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              padding: '6px 0',
                              zIndex: 99999,
                              minWidth: '170px',
                              textAlign: 'left',
                              maxHeight: 'calc(100vh - 20px)',
                              overflowY: 'auto'
                            }}
                          >
                            <button onClick={() => { setActiveDropdown(null); navigate(`/admin/users`); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}>
                              <Edit size={14} color="var(--orange)" /> Edit
                            </button>
                            <button onClick={() => { setActiveDropdown(null); setAcHistoryModalAccount({ ...client, isClientWallet: true }); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}>
                              <List size={14} color="var(--text-light)" /> AC History
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                            <button onClick={async () => {
                              setActiveDropdown(null);
                              const ok = await showConfirm({
                                title: 'Suspend Account',
                                message: 'Are you sure you want to suspend this client account?',
                                type: 'danger',
                                confirmText: 'Suspend'
                              });
                              if (ok) {
                                api('PUT', `/api/admin/users/${client.id || client._id}/status`, { status: 'rejected' })
                                  .then(() => {
                                    fetchAccounts();
                                    showToast('Client account suspended', 'info');
                                  })
                                  .catch(() => showToast('Failed to suspend client.', 'error'));
                              }
                            }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--red)' }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )
            ) : filteredAccounts.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No WhatsApp accounts found.</td></tr>
            ) : (
              paginatedAccounts.map((acc, index) => {
                const now = new Date();
                const subActive = acc.subscriptionExpiresAt && new Date(acc.subscriptionExpiresAt) > now;
                const daysLeft = subActive ? Math.ceil((new Date(acc.subscriptionExpiresAt) - now) / (1000 * 60 * 60 * 24)) : 0;
                return (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fbfd'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px' }}>{indexOfFirstItem + index + 1}</td>
                    <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '13px' }}>{acc.displayPhone || acc.phoneId}</div>
                      <div style={{ marginTop: '3px' }}>
                        {subActive
                          ? <span style={{ display: 'inline-block', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '700' }}>{daysLeft}d left</span>
                          : <span style={{ display: 'inline-block', background: '#fbe9e7', color: '#c62828', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '700' }}>⚠️ No Sub</span>
                        }
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>{Number(acc.whatsappBalance || acc.prepaidBalance || 0).toFixed(2)}</div>
                      <div style={{ fontSize: '11px', display: 'flex', gap: '8px' }}>
                        {subActive
                          ? <button onClick={() => setFundsModalState({ isOpen: true, account: acc, isDebit: false, balanceType: 'prepaidBalance' })} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Credit</button>
                          : <span title="Renew subscription first" style={{ fontSize: '11px', color: '#bdbdbd', fontWeight: '600', cursor: 'not-allowed' }}>Credit</span>
                        }
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <button onClick={() => setSendModalAccount(acc)} style={{ padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                        <Send size={14} /> Send
                      </button>
                    </td>
                    <td style={{ padding: '13px 14px', fontWeight: '600', fontSize: '13px' }}>{acc.package || acc.packageId || 'None'}</td>
                    <td style={{ padding: '13px 14px' }}>
                      {canUpgradeAccount(acc.package) ? (
                        <button
                          onClick={() => openUpgradeModal(acc)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e3f2fd',
                            color: '#0d47a1',
                            border: '1px solid #bbdefb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '11px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#bbdefb'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                        >
                          Upgrade
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#bdbdbd', fontWeight: '600' }}>Highest Tier</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {acc.subscriptionExpiresAt ? (() => {
                        const end = new Date(acc.subscriptionExpiresAt);
                        const start = new Date(end);
                        start.setDate(start.getDate() - 30);
                        const formatDt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return `${formatDt(start)} - ${formatDt(end)}`;
                      })() : '-'}
                    </td>
                    <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px' }}>{acc.autoRecharge ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '16px', position: 'relative', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeDropdown && activeDropdown.id === acc.id) {
                            setActiveDropdown(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const openUpward = spaceBelow < 270 && rect.top > 270;
                            setActiveDropdown({
                              id: acc.id,
                              x: rect.right,
                              top: rect.bottom + 4,
                              bottom: window.innerHeight - rect.top + 4,
                              openUpward
                            });
                          }
                        }}
                        style={{ padding: '6px', background: 'none', color: 'var(--text)', border: 'none', cursor: 'pointer' }}
                      >
                        <MoreVertical size={20} />
                      </button>
                      {activeDropdown && activeDropdown.id === acc.id && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            position: 'fixed',
                            right: `${window.innerWidth - activeDropdown.x}px`,
                            top: activeDropdown.openUpward ? 'auto' : `${activeDropdown.top}px`,
                            bottom: activeDropdown.openUpward ? `${activeDropdown.bottom}px` : 'auto',
                            backgroundColor: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            padding: '6px 0',
                            zIndex: 99999,
                            minWidth: '170px',
                            textAlign: 'left',
                            maxHeight: 'calc(100vh - 20px)',
                            overflowY: 'auto'
                          }}
                        >
                          <button onClick={() => { setActiveDropdown(null); setEditModalAccount(acc); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><Edit size={14} color="var(--orange)" /> Edit</button>
                          <button onClick={() => { setActiveDropdown(null); navigate(`/dashboard/templates?account=${acc.id}`); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><LayoutTemplate size={14} color="var(--primary)" /> Templates</button>
                          <button onClick={() => { setActiveDropdown(null); navigate('/dashboard/settings'); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><Settings size={14} color="#8e24aa" /> API Settings</button>
                          <button onClick={() => { setActiveDropdown(null); setWaHistoryModalAccount(acc); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><List size={14} color="var(--text-light)" /> Number Logs</button>
                          <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                          <button onClick={() => { setActiveDropdown(null); renewSubscription(acc.id, acc.package); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1565c0', fontWeight: '600' }}><RotateCcw size={14} color="#1565c0" /> Renew Sub</button>
                          <button onClick={() => { setActiveDropdown(null); cancelSubscription(acc.id); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e65100', fontWeight: '600' }}><XCircle size={14} color="#e65100" /> Cancel Sub</button>
                          {user?.role === 'admin' && (
                            <>
                              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                              <button onClick={() => { setActiveDropdown(null); deleteAccount(acc.id); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--red)' }}><Trash2 size={14} /> Delete</button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid var(--border)',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ color: 'var(--text-mid)', fontSize: '13px' }}>
            Showing <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems > 0 ? indexOfFirstItem + 1 : 0}</span> to{' '}
            <span style={{ fontWeight: '600', color: 'var(--text)' }}>{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
            <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems}</span> {user?.role === 'admin' ? 'clients' : 'numbers'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-mid)', fontSize: '13px' }}>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--white)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={effectiveCurrentPage === 1}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--white)',
                  color: effectiveCurrentPage === 1 ? 'var(--text-light)' : 'var(--text)',
                  cursor: effectiveCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  height: '32px'
                }}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              {renderPageNumbers()}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={effectiveCurrentPage === totalPages || totalPages === 0}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--white)',
                  color: (effectiveCurrentPage === totalPages || totalPages === 0) ? 'var(--text-light)' : 'var(--text)',
                  cursor: (effectiveCurrentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  height: '32px'
                }}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '500px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Add WhatsApp Number</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>Connect a Meta WhatsApp Business API account</div>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }} title="Close">✕</button>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderBottom: '1px solid #e5e7eb' }}>
                {user?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setSignupTab('embedded')}
                    style={{
                      padding: '8px 14px',
                      border: 'none',
                      background: 'none',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: signupTab === 'embedded' ? '#1877f2' : 'var(--text-light)',
                      borderBottom: signupTab === 'embedded' ? '2px solid #1877f2' : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={signupTab === 'embedded' ? '#1877f2' : 'currentColor'}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Fast Setup via Meta
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSignupTab('manual')}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    background: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: signupTab === 'manual' ? '#075e54' : 'var(--text-light)',
                    borderBottom: signupTab === 'manual' ? '2px solid #075e54' : '2px solid transparent'
                  }}
                >
                  Manual API Credentials
                </button>
              </div>
            </div>

            {signupTab === 'embedded' ? (
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '16px', border: '1px solid #bfdbfe', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1d4ed8"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Meta Embedded Signup
                  </div>
                  <p style={{ fontSize: '12px', color: '#1e40af', margin: 0, lineHeight: '1.5' }}>
                    Connect your Meta WhatsApp Business account automatically. Meta will prompt you to log in, select your business, verify your phone number, and grant permissions.
                  </p>
                </div>

                {user?.role === 'admin' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      Target Client <span style={{ color: 'var(--red, #e53935)' }}>*</span>
                    </label>
                    <select
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                      value={selectedClientId}
                      onChange={e => setSelectedClientId(e.target.value)}
                    >
                      <option value="">-- Select Client Account --</option>
                      {adminUsers.map(client => (
                        <option key={client.id || client._id} value={client.id || client._id}>
                          {client.companyName ? `${client.companyName} (${client.phone || client.email})` : (client.phone || client.email)} — ₹{Number(client.walletBalance || 0).toFixed(2)} Balance
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    Package <span style={{ color: 'var(--red, #e53935)' }}>*</span>
                  </label>
                  <select
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                    value={formData.packageId}
                    onChange={e => setFormData({ ...formData, packageId: e.target.value })}
                  >
                    <option value="">Select Package</option>
                    {packages.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

                {(() => {
                  const targetClient = user?.role === 'admin' ? adminUsers.find(u => (u.id || u._id) === selectedClientId) : null;
                  const effectiveWalletBal = user?.role === 'admin' ? (targetClient ? Number(targetClient.walletBalance || 0) : 0) : walletBalance;
                  const isSufficient = effectiveWalletBal >= currentSubFee;

                  if (user?.role === 'admin' && !selectedClientId) {
                    return (
                      <div style={{ marginBottom: '20px', background: '#fff8e1', border: '1px solid #ffe082', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#b78103', fontWeight: '600' }}>
                        ⚠️ Please select a target client account above.
                      </div>
                    );
                  }

                  if (!formData.packageId) {
                    return (
                      <div style={{ marginBottom: '20px', background: '#fff8e1', border: '1px solid #ffe082', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#b78103', fontWeight: '600' }}>
                        ⚠️ Please select a package above to activate the WhatsApp number.
                      </div>
                    );
                  }

                  return (
                    <div style={{ marginBottom: '20px', background: isSufficient ? '#e8f5e9' : '#ffebee', border: `1px solid ${isSufficient ? '#c8e6c9' : '#ffcdd2'}`, padding: '12px', borderRadius: '6px', fontSize: '12px', color: isSufficient ? '#2e7d32' : '#c62828' }}>
                      <strong>{user?.role === 'admin' ? `Client Wallet Balance (${targetClient?.companyName || targetClient?.phone || targetClient?.email}):` : 'Wallet Balance:'} ₹{effectiveWalletBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      <div style={{ marginTop: '4px' }}>
                        {currentSubFee === 0 ? (
                          'No subscription fee is required for the selected package.'
                        ) : isSufficient ? (
                          `A ₹${currentSubFee} subscription fee will be deducted from ${user?.role === 'admin' ? "the client's" : 'your'} Wallet Balance to activate this number for 1 month.`
                        ) : (
                          `Insufficient Wallet Balance. A ₹${currentSubFee} subscription fee is required. ${user?.role === 'admin' ? "Please credit funds to the client's wallet first before adding a number." : 'Please add funds to your Wallet.'}`
                        )}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const targetClient = user?.role === 'admin' ? adminUsers.find(u => (u.id || u._id) === selectedClientId) : null;
                  const effectiveWalletBal = user?.role === 'admin' ? (targetClient ? Number(targetClient.walletBalance || 0) : 0) : walletBalance;
                  const isSufficient = effectiveWalletBal >= currentSubFee;
                  const isDisabled = !formData.packageId || (user?.role === 'admin' && !selectedClientId) || isEmbeddedLoading || !isSufficient;

                  return (
                    <button
                      type="button"
                      onClick={launchMetaEmbeddedSignup}
                      disabled={isDisabled}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isDisabled ? '#9e9e9e' : '#1877f2',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 12px rgba(24, 119, 242, 0.25)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      {isEmbeddedLoading ? 'Connecting to Meta...' : 'Continue with Facebook'}
                    </button>
                  );
                })()}

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setSignupTab('manual')}
                    style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Or enter API credentials manually
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} style={{ overflowY: 'auto', flex: 1 }}>
                <div style={{ padding: '24px' }}>
                  {user?.role === 'admin' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Target Client Account <span style={{ color: 'var(--red, #e53935)' }}>*</span>
                      </label>
                      <select
                        required
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                      >
                        <option value="">-- Select Client Account --</option>
                        {adminUsers.map(client => (
                          <option key={client.id || client._id} value={client.id || client._id}>
                            {client.companyName ? `${client.companyName} (${client.phone || client.email})` : (client.phone || client.email)} — ₹{Number(client.walletBalance || 0).toFixed(2)} Balance
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ margin: 0 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Account Name <span style={{ color: 'var(--red)' }}>*</span></label>
                      <input required type="text" placeholder="e.g. Sales, Support" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.accountName} onChange={e => setFormData({ ...formData, accountName: e.target.value })} />
                    </div>
                    <div style={{ margin: 0 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Display Phone Number <span style={{ color: 'var(--red)' }}>*</span></label>
                      <input required type="text" placeholder="+91 98765 43210" style={{ width: '100%', padding: '10px 12px', border: phoneError ? '1px solid var(--red, #e53935)' : '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box', outline: 'none' }} value={formData.displayPhone} onChange={e => handlePhoneChange(e.target.value)} />
                      {phoneError && (
                        <p style={{ color: 'var(--red, #e53935)', fontSize: '11px', marginTop: '4px', marginBottom: '0', fontWeight: '500' }}>
                          {phoneError}
                        </p>
                      )}
                    </div>
                    <div style={{ margin: 0 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number ID</label>
                      <input type="text" placeholder="Numeric ID from Meta" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.phoneId} onChange={e => setFormData({ ...formData, phoneId: e.target.value.replace(/\D/g, '') })} />
                    </div>
                    <div style={{ margin: 0 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>WhatsApp Business Account ID</label>
                      <input type="text" placeholder="Numeric ID from Meta" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.wabaId} onChange={e => setFormData({ ...formData, wabaId: e.target.value.replace(/\D/g, '') })} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Access Token</label>
                    <input type="password" placeholder="EAAxxxxxxxxx..." style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.token} onChange={e => setFormData({ ...formData, token: e.target.value })} />
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-light)' }}>Permanent token from Meta System User or temporary from API Setup</div>
                  </div>

                  <div style={{ marginTop: '14px', marginBottom: '0' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      Package <span style={{ color: 'var(--red, #e53935)' }}>*</span>
                    </label>
                    <select
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                      value={formData.packageId}
                      onChange={e => setFormData({ ...formData, packageId: e.target.value })}
                    >
                      <option value="">Select Package</option>
                      {packages.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>

                  {(() => {
                    const targetClient = user?.role === 'admin' ? adminUsers.find(u => (u.id || u._id) === selectedClientId) : null;
                    const effectiveWalletBal = user?.role === 'admin' ? (targetClient ? Number(targetClient.walletBalance || 0) : 0) : walletBalance;
                    const isSufficient = effectiveWalletBal >= currentSubFee;

                    if (user?.role === 'admin' && !selectedClientId) {
                      return (
                        <div style={{ marginTop: '16px', background: '#fff8e1', border: '1px solid #ffe082', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#b78103', fontWeight: '600' }}>
                          ⚠️ Please select a target client account above.
                        </div>
                      );
                    }

                    if (!formData.packageId) {
                      return (
                        <div style={{ marginTop: '16px', background: '#fff8e1', border: '1px solid #ffe082', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#b78103', fontWeight: '600' }}>
                          ⚠️ Please select a package above to activate the WhatsApp number.
                        </div>
                      );
                    }

                    return (
                      <div style={{ marginTop: '16px', background: isSufficient ? '#e8f5e9' : '#ffebee', border: `1px solid ${isSufficient ? '#c8e6c9' : '#ffcdd2'}`, padding: '12px', borderRadius: '6px', fontSize: '12px', color: isSufficient ? '#2e7d32' : '#c62828' }}>
                        <strong>{user?.role === 'admin' ? `Client Wallet Balance (${targetClient?.companyName || targetClient?.phone || targetClient?.email}):` : 'Wallet Balance:'} ₹{effectiveWalletBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        <div style={{ marginTop: '4px' }}>
                          {currentSubFee === 0 ? (
                            'No subscription fee is required for the selected package.'
                          ) : isSufficient ? (
                            `A ₹${currentSubFee} subscription fee will be deducted from ${user?.role === 'admin' ? "the client's" : 'your'} Wallet Balance to activate this number for 1 month.`
                          ) : (
                            `Insufficient Wallet Balance. A ₹${currentSubFee} subscription fee is required. ${user?.role === 'admin' ? "Please credit funds to the client's wallet first before adding a number." : 'Please add funds to your Wallet.'}`
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)' }}>Cancel</button>
                  {(() => {
                    const targetClient = user?.role === 'admin' ? adminUsers.find(u => (u.id || u._id) === selectedClientId) : null;
                    const effectiveWalletBal = user?.role === 'admin' ? (targetClient ? Number(targetClient.walletBalance || 0) : 0) : walletBalance;
                    const isSufficient = effectiveWalletBal >= currentSubFee;
                    const isDisabled = !formData.packageId || (user?.role === 'admin' && !selectedClientId) || (effectiveWalletBal < currentSubFee) || !!phoneError;

                    return (
                      <button
                        type="submit"
                        disabled={isDisabled}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isDisabled ? '#9e9e9e' : '#075e54',
                          color: '#fff',
                          fontWeight: '700',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '4px' }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                        Save Number
                      </button>
                    );
                  })()}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Modals */}
      <FundsModal
        isOpen={fundsModalState.isOpen}
        onClose={() => setFundsModalState({ ...fundsModalState, isOpen: false })}
        account={fundsModalState.account}
        isDebit={fundsModalState.isDebit}
        balanceType={fundsModalState.balanceType}
        onSuccess={fetchAccounts}
        isAdmin={user?.role === 'admin'}
      />

      <SendCampaignModal
        isOpen={!!sendModalAccount}
        onClose={() => setSendModalAccount(null)}
        account={sendModalAccount}
      />

      <EditAccountModal
        isOpen={!!editModalAccount}
        onClose={() => setEditModalAccount(null)}
        account={editModalAccount}
        onSuccess={fetchAccounts}
      />

      <AccountHistoryModal
        isOpen={!!acHistoryModalAccount}
        onClose={() => setAcHistoryModalAccount(null)}
        account={acHistoryModalAccount}
        type={acHistoryModalAccount?.isClientWallet ? 'clientWallet' : 'acBalance'}
      />

      <AccountHistoryModal
        isOpen={!!waHistoryModalAccount}
        onClose={() => setWaHistoryModalAccount(null)}
        account={waHistoryModalAccount}
        type="prepaidBalance"
      />

      {/* Upgrade Package Modal */}
      {isUpgradeModalOpen && upgradeAccount && (() => {
        const upgradePackagesList = getUpgradePackages(upgradeAccount.package);
        const selectedPkg = packages.find(p => p.name === selectedUpgradePackage);
        const subFee = selectedPkg ? (selectedPkg.subscriptionPrice || 0) : 0;
        const isSufficient = walletBalance >= subFee;

        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '480px', maxWidth: '95vw', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ Upgrade Package</h3>
                <button onClick={() => setIsUpgradeModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleUpgradeSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>Phone Number</label>
                  <div style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '14px' }}>{upgradeAccount.displayPhone || upgradeAccount.phoneId}</div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>Current Package</label>
                  <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>{upgradeAccount.package || 'Free'}</div>
                </div>

                {upgradePackagesList.length === 0 ? (
                  <div style={{ padding: '16px', background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '6px', color: '#e65100', fontSize: '13px', marginBottom: '20px' }}>
                    This number is already on the highest tier package available. No upgrades can be performed.
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>Select Upgrade Package</label>
                      <select
                        value={selectedUpgradePackage}
                        onChange={e => setSelectedUpgradePackage(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                        required
                      >
                        <option value="">-- Select Package --</option>
                        {upgradePackagesList.map(p => (
                          <option key={p.id || p._id} value={p.name}>
                            {p.name} (Price: ₹{p.subscriptionPrice})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPkg && (
                      <>
                        <div style={{ marginTop: '14px', padding: '12px', background: '#f4f6f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px' }}>
                          <div style={{ marginBottom: '4px' }}>Upgrade Package: <strong>{selectedPkg.name}</strong></div>
                          <div style={{ marginBottom: '4px' }}>Subscription Price: <strong>₹{selectedPkg.subscriptionPrice}</strong></div>
                          <div>Message Price: <strong>₹{selectedPkg.price} per message</strong></div>
                        </div>

                        {user?.role === 'admin' ? (
                          <div style={{ marginTop: '14px', background: '#e8f5e9', border: '1px solid #c8e6c9', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#2e7d32' }}>
                            <strong>Admin Mode:</strong> Upgrades are free for admins.
                          </div>
                        ) : (
                          <div style={{ marginTop: '14px', background: isSufficient ? '#e8f5e9' : '#ffebee', border: `1px solid ${isSufficient ? '#c8e6c9' : '#ffcdd2'}`, padding: '12px', borderRadius: '6px', fontSize: '12px', color: isSufficient ? '#2e7d32' : '#c62828' }}>
                            <strong>Wallet Balance: ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            <div style={{ marginTop: '4px' }}>
                              {isSufficient
                                ? `A ₹${subFee} subscription fee will be deducted from your Wallet Balance to upgrade and reset this number's subscription for 1 month.`
                                : `Insufficient Wallet Balance. A ₹${subFee} upgrade subscription fee is required. Please add funds to your Wallet.`}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button type="button" onClick={() => setIsUpgradeModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)' }}>Cancel</button>
                  {upgradePackagesList.length > 0 && (
                    <button
                      type="submit"
                      disabled={isUpgrading || !selectedUpgradePackage || (!isSufficient && user?.role !== 'admin')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: (isUpgrading || !selectedUpgradePackage || (!isSufficient && user?.role !== 'admin')) ? '#9e9e9e' : 'var(--primary)',
                        color: '#fff',
                        fontWeight: '700',
                        cursor: (isUpgrading || !selectedUpgradePackage || (!isSufficient && user?.role !== 'admin')) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isUpgrading ? 'Upgrading...' : 'Confirm Upgrade'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Child Numbers Modal for Admin */}
      {childModalState.isOpen && childModalState.client && (() => {
        const filteredChildAccounts = (childModalState.client.accounts || []).filter(acc => {
          if (childNumSearch) {
            const searchLower = childNumSearch.toLowerCase();
            const phone = acc.displayPhone || acc.phoneId || '';
            if (!phone.toLowerCase().includes(searchLower)) return false;
          }
          if (childAmountSearch) {
            const balance = acc.whatsappBalance || acc.prepaidBalance || 0;
            if (!matchesBalance(balance, childAmountSearch)) return false;
          }
          if (childPackageFilter) {
            const accPackage = acc.package || acc.packageId || '';
            if (accPackage.toLowerCase() !== childPackageFilter.toLowerCase()) return false;
          }
          if (childAutoRechargeFilter) {
            const isAuto = acc.autoRecharge ? 'yes' : 'no';
            if (isAuto !== childAutoRechargeFilter.toLowerCase()) return false;
          }
          if (childSubStatusFilter) {
            const now = new Date();
            const subActive = acc.subscriptionExpiresAt && new Date(acc.subscriptionExpiresAt) > now;
            if (childSubStatusFilter === 'active' && !subActive) return false;
            if (childSubStatusFilter === 'expired' && subActive) return false;
          }
          return true;
        });

        const childTotalItems = filteredChildAccounts.length;
        const childTotalPages = Math.ceil(childTotalItems / childItemsPerPage);
        const effectiveChildCurrentPage = Math.max(1, Math.min(childCurrentPage, childTotalPages || 1));
        const childIndexOfLastItem = effectiveChildCurrentPage * childItemsPerPage;
        const childIndexOfFirstItem = childIndexOfLastItem - childItemsPerPage;
        const paginatedChildAccounts = filteredChildAccounts.slice(childIndexOfFirstItem, childIndexOfLastItem);

        const closeChildModal = () => {
          setChildModalState({ isOpen: false, client: null });
          setChildNumSearch('');
          setChildAmountSearch('');
          setChildPackageFilter('');
          setChildAutoRechargeFilter('');
          setChildSubStatusFilter('');
          setIsChildFilterOpen(false);
          setChildCurrentPage(1);
        };

        const renderChildPageNumbers = () => {
          const pages = [];
          const maxButtons = 5;

          if (childTotalPages === 0) {
            return (
              <button
                key="cp-empty"
                disabled
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--white)',
                  color: 'var(--text-light)',
                  cursor: 'not-allowed',
                  fontSize: '12px',
                  minWidth: '28px'
                }}
              >
                1
              </button>
            );
          }

          if (childTotalPages <= maxButtons) {
            for (let i = 1; i <= childTotalPages; i++) {
              pages.push(i);
            }
          } else {
            pages.push(1);

            let start = Math.max(2, effectiveChildCurrentPage - 1);
            let end = Math.min(childTotalPages - 1, effectiveChildCurrentPage + 1);

            if (effectiveChildCurrentPage <= 2) {
              end = 4;
            } else if (effectiveChildCurrentPage >= childTotalPages - 1) {
              start = childTotalPages - 3;
            }

            if (start > 2) {
              pages.push('ellipsis1');
            }

            for (let i = start; i <= end; i++) {
              pages.push(i);
            }

            if (end < childTotalPages - 1) {
              pages.push('ellipsis2');
            }

            pages.push(childTotalPages);
          }

          return pages.map((p, idx) => {
            if (p === 'ellipsis1' || p === 'ellipsis2') {
              return (
                <span
                  key={`ellipsis-child-${idx}`}
                  style={{
                    padding: '4px 8px',
                    color: 'var(--text-light)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  ...
                </span>
              );
            }

            const isActive = p === effectiveChildCurrentPage;
            return (
              <button
                key={p}
                onClick={() => setChildCurrentPage(p)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--white)',
                  color: isActive ? 'white' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.2s',
                  minWidth: '28px',
                  textAlign: 'center'
                }}
              >
                {p}
              </button>
            );
          });
        };

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Child Numbers - {childModalState.client.companyName || childModalState.client.email}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Managing WhatsApp accounts for this client</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                  <button
                    onClick={() => openModalForClient(childModalState.client)}
                    style={{ padding: '6px 12px', backgroundColor: 'var(--green-xdark)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    <Plus size={14} /> Add Number
                  </button>
                  {/* Filter Popover Button & Popup inside Modal */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsChildFilterOpen(!isChildFilterOpen); }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isChildFilterOpen || childNumSearch || childAmountSearch || childPackageFilter || childAutoRechargeFilter || childSubStatusFilter ? 'var(--primary-light)' : 'var(--white)',
                        border: `1px solid ${isChildFilterOpen || childNumSearch || childAmountSearch || childPackageFilter || childAutoRechargeFilter || childSubStatusFilter ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: isChildFilterOpen || childNumSearch || childAmountSearch || childPackageFilter || childAutoRechargeFilter || childSubStatusFilter ? 'var(--primary)' : 'var(--text-mid)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}
                      title="Filter child records"
                    >
                      <SlidersHorizontal size={14} />
                      Filter {(childNumSearch || childAmountSearch || childPackageFilter || childAutoRechargeFilter || childSubStatusFilter) ? '(Active)' : ''}
                    </button>

                    {isChildFilterOpen && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '36px',
                          backgroundColor: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                          padding: '16px',
                          zIndex: 1000,
                          width: '280px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>Filter Records</span>
                          <button
                            onClick={() => { setChildNumSearch(''); setChildAmountSearch(''); setChildPackageFilter(''); setChildAutoRechargeFilter(''); setChildSubStatusFilter(''); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: 'var(--primary)', padding: 0 }}
                          >
                            Reset
                          </button>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>Search Child Number</label>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                            <Search size={14} color="var(--text-light)" style={{ marginRight: '6px' }} />
                            <input
                              type="text"
                              placeholder="Search number..."
                              value={childNumSearch}
                              onChange={(e) => setChildNumSearch(e.target.value)}
                              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: 'var(--text)', background: 'transparent' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>WhatsApp Balance Filter</label>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                            <input
                              type="text"
                              placeholder="e.g. 500 or 100-500"
                              value={childAmountSearch}
                              onChange={(e) => setChildAmountSearch(e.target.value)}
                              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: 'var(--text)', background: 'transparent' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>Package Filter</label>
                          <select
                            value={childPackageFilter}
                            onChange={(e) => setChildPackageFilter(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text)', outline: 'none', backgroundColor: 'transparent' }}
                          >
                            <option value="">All Packages</option>
                            {packages.map(p => (
                              <option key={p.id || p._id} value={p.name}>{p.name}</option>
                            ))}
                            <option value="None">None</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>Auto Recharge</label>
                          <select
                            value={childAutoRechargeFilter}
                            onChange={(e) => setChildAutoRechargeFilter(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text)', outline: 'none', backgroundColor: 'transparent' }}
                          >
                            <option value="">All Auto Recharge</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '4px' }}>Subscription Status</label>
                          <select
                            value={childSubStatusFilter}
                            onChange={(e) => setChildSubStatusFilter(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text)', outline: 'none', backgroundColor: 'transparent' }}
                          >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="expired">No Subscription / Expired</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={closeChildModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-light)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Close">✕</button>
                </div>
              </div>

              <div ref={childTableRef} style={{ overflowY: 'auto', padding: '24px' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.04em' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontWeight: '600' }}>SRNO</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600' }}>Number</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600' }}>WhatsappBalance</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600' }}>Whatsapp</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600' }}>Package</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600' }}>Upgrade</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600' }}>Period</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600' }}>Autorecharge</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!childModalState.client.accounts || childModalState.client.accounts.length === 0 ? (
                      <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No WhatsApp accounts added yet for this client.</td></tr>
                    ) : filteredChildAccounts.length === 0 ? (
                      <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No matching WhatsApp accounts found.</td></tr>
                    ) : (
                      paginatedChildAccounts.map((acc, accIdx) => {
                        const now = new Date();
                        const subActive = acc.subscriptionExpiresAt && new Date(acc.subscriptionExpiresAt) > now;
                        const daysLeft = subActive ? Math.ceil((new Date(acc.subscriptionExpiresAt) - now) / (1000 * 60 * 60 * 24)) : 0;
                        return (
                          <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fbfd'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                            <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px' }}>{childIndexOfFirstItem + accIdx + 1}</td>
                            <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '13px' }}>{acc.displayPhone || acc.phoneId}</div>
                              <div style={{ marginTop: '3px' }}>
                                {subActive
                                  ? <span style={{ display: 'inline-block', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '700' }}>{daysLeft}d left</span>
                                  : <span style={{ display: 'inline-block', background: '#fbe9e7', color: '#c62828', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '700' }}>⚠️ No Sub</span>
                                }
                              </div>
                            </td>
                            <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>{Number(acc.whatsappBalance || acc.prepaidBalance || 0).toFixed(2)}</div>
                              <div style={{ fontSize: '11px', display: 'flex', gap: '8px' }}>
                                {subActive
                                  ? <button onClick={() => { setFundsModalState({ isOpen: true, account: acc, isDebit: false, balanceType: 'prepaidBalance' }); }} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Credit</button>
                                  : <span title="Renew subscription first" style={{ fontSize: '11px', color: '#bdbdbd', fontWeight: '600', cursor: 'not-allowed' }}>Credit</span>
                                }
                                <span style={{ color: 'var(--text-light)' }}>/</span>
                                <button onClick={() => { setFundsModalState({ isOpen: true, account: acc, isDebit: true, balanceType: 'prepaidBalance' }); }} style={{ color: '#e53935', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Debit</button>
                              </div>
                            </td>
                            <td style={{ padding: '13px 14px' }}>
                              <button onClick={() => { setSendModalAccount(acc); }} style={{ padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                                <Send size={14} /> Send
                              </button>
                            </td>
                            <td style={{ padding: '13px 14px', fontWeight: '600', fontSize: '13px' }}>{acc.package || acc.packageId || 'None'}</td>
                            <td style={{ padding: '13px 14px' }}>
                              {canUpgradeAccount(acc.package) ? (
                                <button
                                  onClick={() => {
                                    openUpgradeModal(acc);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#e3f2fd',
                                    color: '#0d47a1',
                                    border: '1px solid #bbdefb',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '11px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#bbdefb'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                                >
                                  Upgrade
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#bdbdbd', fontWeight: '600' }}>Highest Tier</span>
                              )}
                            </td>
                            <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {acc.subscriptionExpiresAt ? (() => {
                                const end = new Date(acc.subscriptionExpiresAt);
                                const start = new Date(end);
                                start.setDate(start.getDate() - 30);
                                const formatDt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                return `${formatDt(start)} - ${formatDt(end)}`;
                              })() : '-'}
                            </td>
                            <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px' }}>{acc.autoRecharge ? 'Yes' : 'No'}</td>
                            <td style={{ padding: '16px', position: 'relative', textAlign: 'center' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const id = `modal-${acc.id}`;
                                  if (activeDropdown && activeDropdown.id === id) {
                                    setActiveDropdown(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const openUpward = spaceBelow < 270 && rect.top > 270;
                                    setActiveDropdown({
                                      id,
                                      x: rect.right,
                                      top: rect.bottom + 4,
                                      bottom: window.innerHeight - rect.top + 4,
                                      openUpward
                                    });
                                  }
                                }}
                                style={{ padding: '6px', background: 'none', color: 'var(--text)', border: 'none', cursor: 'pointer' }}
                              >
                                <MoreVertical size={20} />
                              </button>
                              {activeDropdown && activeDropdown.id === `modal-${acc.id}` && (
                                <div
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    position: 'fixed',
                                    right: `${window.innerWidth - activeDropdown.x}px`,
                                    top: activeDropdown.openUpward ? 'auto' : `${activeDropdown.top}px`,
                                    bottom: activeDropdown.openUpward ? `${activeDropdown.bottom}px` : 'auto',
                                    backgroundColor: 'white',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    padding: '6px 0',
                                    zIndex: 99999,
                                    minWidth: '170px',
                                    textAlign: 'left',
                                    maxHeight: 'calc(100vh - 20px)',
                                    overflowY: 'auto'
                                  }}
                                >
                                  <button onClick={() => { setActiveDropdown(null); setEditModalAccount(acc); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><Edit size={14} color="var(--orange)" /> Edit</button>
                                  <button onClick={() => { setActiveDropdown(null); setChildModalState({ isOpen: false, client: null }); navigate(`/dashboard/templates?account=${acc.id}`); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><LayoutTemplate size={14} color="var(--primary)" /> Templates</button>
                                  <button onClick={() => { setActiveDropdown(null); setChildModalState({ isOpen: false, client: null }); navigate('/dashboard/settings'); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><Settings size={14} color="#8e24aa" /> API Settings</button>
                                  <button onClick={() => { setActiveDropdown(null); setWaHistoryModalAccount(acc); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><List size={14} color="var(--text-light)" /> Number Logs</button>
                                  <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                                  <button onClick={() => { setActiveDropdown(null); renewSubscription(acc.id, acc.package); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1565c0', fontWeight: '600' }}><RotateCcw size={14} color="#1565c0" /> Renew Sub</button>
                                  <button onClick={() => { setActiveDropdown(null); cancelSubscription(acc.id); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e65100', fontWeight: '600' }}><XCircle size={14} color="#e65100" /> Cancel Sub</button>
                                  {user?.role === 'admin' && (
                                    <>
                                      <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                                      <button onClick={() => { setActiveDropdown(null); deleteAccount(acc.id); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--red)' }}><Trash2 size={14} /> Delete</button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {/* Child numbers pagination bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0 0',
                  marginTop: '16px',
                  borderTop: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ color: 'var(--text-mid)', fontSize: '13px' }}>
                    Showing <span style={{ fontWeight: '600', color: 'var(--text)' }}>{childTotalItems > 0 ? childIndexOfFirstItem + 1 : 0}</span> to{' '}
                    <span style={{ fontWeight: '600', color: 'var(--text)' }}>{Math.min(childIndexOfLastItem, childTotalItems)}</span> of{' '}
                    <span style={{ fontWeight: '600', color: 'var(--text)' }}>{childTotalItems}</span> numbers
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-mid)', fontSize: '12px' }}>Rows:</span>
                      <select
                        value={childItemsPerPage}
                        onChange={(e) => {
                          setChildItemsPerPage(Number(e.target.value));
                          setChildCurrentPage(1);
                        }}
                        style={{
                          padding: '3px 6px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--white)',
                          color: 'var(--text)',
                          fontSize: '12px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {[5, 10, 20].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        onClick={() => setChildCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={effectiveChildCurrentPage === 1}
                        style={{
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--white)',
                          color: effectiveChildCurrentPage === 1 ? 'var(--text-light)' : 'var(--text)',
                          cursor: effectiveChildCurrentPage === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '28px'
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>

                      {renderChildPageNumbers()}

                      <button
                        onClick={() => setChildCurrentPage(prev => Math.min(prev + 1, childTotalPages))}
                        disabled={effectiveChildCurrentPage === childTotalPages || childTotalPages === 0}
                        style={{
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--white)',
                          color: (effectiveChildCurrentPage === childTotalPages || childTotalPages === 0) ? 'var(--text-light)' : 'var(--text)',
                          cursor: (effectiveChildCurrentPage === childTotalPages || childTotalPages === 0) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '28px'
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default Numbers;
