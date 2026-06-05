import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('activeWorkforce');
  
  // Worker modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null); // null for new, worker object for edit
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: 'HELPER',
    dailyWageRate: '',
    siteId: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View Worker details modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewWorker, setViewWorker] = useState(null);

  // Quick Site Reassignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignWorker, setAssignWorker] = useState(null);
  const [assignSiteId, setAssignSiteId] = useState('');

  // Site Creation modal (Site Management)
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteFormData, setSiteFormData] = useState({
    siteName: '',
    location: ''
  });
  const [siteFormError, setSiteFormError] = useState('');
  const [siteSubmitting, setSiteSubmitting] = useState(false);

  // Fetch workers and sites from Spring Boot Backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const [workersRes, sitesRes] = await Promise.all([
        axios.get('http://localhost:8080/api/workers'),
        axios.get('http://localhost:8080/api/sites')
      ]);
      setWorkers(workersRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Delete worker handler
  const handleDeleteWorker = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await axios.delete(`http://localhost:8080/api/workers/${id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting worker:", error);
        alert("Failed to delete worker. Make sure your Spring Boot backend has been restarted to load the new delete API methods.");
      }
    }
  };

  // Delete site handler
  const handleDeleteSite = async (id) => {
    if (window.confirm('Are you sure you want to delete this construction site?')) {
      try {
        await axios.delete(`http://localhost:8080/api/sites/${id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting site:", error);
        alert(error.response?.data?.message || "Failed to delete site. Ensure no active workers are assigned to this site before deleting.");
      }
    }
  };

  // Open worker modal for creation
  const handleCreateWorkerClick = () => {
    setSelectedWorker(null);
    setFormData({
      name: '',
      phone: '',
      designation: 'HELPER',
      dailyWageRate: '',
      siteId: ''
    });
    setFormError('');
    setShowModal(true);
  };

  // Open worker modal for editing
  const handleEditWorkerClick = (worker) => {
    setSelectedWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      designation: worker.designation,
      dailyWageRate: worker.dailyWageRate.toString(),
      siteId: worker.site ? worker.site.id.toString() : ''
    });
    setFormError('');
    setShowModal(true);
  };

  // Open view modal
  const handleViewWorkerClick = (worker) => {
    setViewWorker(worker);
    setShowViewModal(true);
  };

  // Open site assignment modal
  const handleAssignSiteClick = (worker) => {
    setAssignWorker(worker);
    setAssignSiteId(worker.site ? worker.site.id.toString() : '');
    setShowAssignModal(true);
  };

  // Submit reassign site form
  const handleAssignSiteSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedSite = assignSiteId ? sites.find(s => s.id === parseInt(assignSiteId)) : null;
      const payload = {
        ...assignWorker,
        site: selectedSite
      };
      await axios.put(`http://localhost:8080/api/workers/${assignWorker.id}`, payload);
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      console.error("Error reassigning site:", error);
      alert("Failed to reassign site.");
    }
  };

  // Submit worker registration/update form handler
  const handleSubmitWorker = async (e) => {
    e.preventDefault();
    setFormError('');
    
    const { name, phone, designation, dailyWageRate, siteId } = formData;
    if (!name || !phone || !dailyWageRate) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const selectedSite = siteId ? sites.find(s => s.id === parseInt(siteId)) : null;
      
      const payload = {
        name,
        phone,
        designation,
        dailyWageRate: parseFloat(dailyWageRate),
        isActive: true,
        site: selectedSite
      };

      if (selectedWorker) {
        // Edit Mode: PUT /api/workers/{id}
        await axios.put(`http://localhost:8080/api/workers/${selectedWorker.id}`, payload);
      } else {
        // Create Mode: POST /api/workers
        await axios.post('http://localhost:8080/api/workers', payload);
      }
      
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving worker:", error);
      setFormError(error.response?.data?.message || 'Failed to save worker. Check phone uniqueness.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create site handler
  const handleSubmitSite = async (e) => {
    e.preventDefault();
    setSiteFormError('');
    if (!siteFormData.siteName || !siteFormData.location) {
      setSiteFormError('All fields are required.');
      return;
    }

    try {
      setSiteSubmitting(true);
      const payload = {
        siteName: siteFormData.siteName,
        location: siteFormData.location,
        isActive: true
      };
      await axios.post('http://localhost:8080/api/sites', payload);
      setSiteFormData({ siteName: '', location: '' });
      setShowSiteModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving site:", error);
      setSiteFormError(error.response?.data?.message || 'Failed to register site. Site Name must be unique.');
    } finally {
      setSiteSubmitting(false);
    }
  };

  // Calculate dynamic stats from backend data
  const totalWorkforce = workers.length;
  const totalWageBill = workers.reduce((acc, curr) => acc + (curr.dailyWageRate || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#0d0f12] text-slate-100 font-sans antialiased">
      
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#13161c] border-r border-[#21262d] flex flex-col px-4 py-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            {/* Blueprint Grid Logo Icon */}
            <svg className="w-5 h-5 text-slate-950 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white leading-none tracking-tight">Workforce</h2>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Manager</span>
          </div>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'text-white bg-[#1c212b] border border-slate-700/35 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-[#161a22]'
            }`}
          >
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('activeWorkforce')} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'activeWorkforce' 
                ? 'text-white bg-[#1c212b] border border-slate-700/35 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-[#161a22]'
            }`}
          >
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-semibold">Active Workforce</span>
          </button>

          <button onClick={handleCreateWorkerClick} className="w-full text-left flex items-center gap-3 text-slate-400 hover:text-white hover:bg-[#161a22] px-4 py-3 rounded-xl transition-all duration-200">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-sm font-medium">Register New</span>
          </button>

          <button 
            onClick={() => setActiveTab('deployments')} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'deployments' 
                ? 'text-white bg-[#1c212b] border border-slate-700/35 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-[#161a22]'
            }`}
          >
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Deployments</span>
          </button>

          <button 
            onClick={() => setActiveTab('siteManagement')} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'siteManagement' 
                ? 'text-white bg-[#1c212b] border border-slate-700/35 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-[#161a22]'
            }`}
          >
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-medium">Site Management</span>
          </button>

          <button 
            onClick={() => setActiveTab('reports')} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'reports' 
                ? 'text-white bg-[#1c212b] border border-slate-700/35 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-[#161a22]'
            }`}
          >
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">Reports</span>
          </button>
        </nav>

        {/* Footer info */}
        <div className="border-t border-[#21262d] pt-4 text-center">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">HRMS v1.0.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 lg:p-10 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        
        {/* Header Title */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white capitalize">
              {activeTab.replace(/([A-Z])/g, ' $1')} Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'activeWorkforce' && 'Real-time breakdown of construction site crew and wage allocations.'}
              {activeTab === 'dashboard' && 'Welcome to the construction workforce supervisor console overview.'}
              {activeTab === 'siteManagement' && 'Register and manage active construction locations.'}
              {activeTab === 'deployments' && 'Deployment logs mapping crew members to operational sites.'}
              {activeTab === 'reports' && 'Workforce metrics, designation ratios, and daily wage budgets.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#161a22] border border-[#21262d] rounded-xl px-3 py-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Connection: <span className="text-emerald-400 font-semibold">Online</span>
          </div>
        </header>

        {/* Dynamic Views */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 flex-1">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Fetching sync database metrics...</p>
          </div>
        ) : (
          <>
            {/* TAB: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-8">
                {/* Stats Row */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 flex items-center gap-5 shadow-lg relative overflow-hidden group">
                    <div className="w-12 h-12 bg-slate-800/50 border border-slate-700/40 rounded-xl flex items-center justify-center text-cyan-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workforce Size</span>
                      <h3 className="text-2xl font-extrabold text-white mt-1">{totalWorkforce} Active Crew</h3>
                    </div>
                  </div>
                  <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 flex items-center gap-5 shadow-lg relative overflow-hidden group">
                    <div className="w-12 h-12 bg-slate-800/50 border border-slate-700/40 rounded-xl flex items-center justify-center text-emerald-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1" /></svg>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Daily Outflow</span>
                      <h3 className="text-2xl font-extrabold text-white mt-1">₹{totalWageBill.toLocaleString('en-IN')}</h3>
                    </div>
                  </div>
                  <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 flex items-center gap-5 shadow-lg relative overflow-hidden group">
                    <div className="w-12 h-12 bg-slate-800/50 border border-slate-700/40 rounded-xl flex items-center justify-center text-amber-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Construction Sites</span>
                      <h3 className="text-2xl font-extrabold text-white mt-1">{sites.length} Active Sites</h3>
                    </div>
                  </div>
                </section>

                {/* Operations Center Card */}
                <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-8 shadow-xl">
                  <h2 className="text-xl font-bold text-white mb-2">Supervisor Operations Center</h2>
                  <p className="text-slate-400 text-sm max-w-2xl mb-6">Manage deployments, review daily shifts, and keep logs for wage payroll audits. Use the left menu navigation to control the entities.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0d0f12]/40 border border-[#21262d] rounded-xl p-5 hover:border-cyan-500/30 transition-all cursor-pointer" onClick={() => setActiveTab('activeWorkforce')}>
                      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        Workforce Registry
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed">Add new workers, change designations, reassign crew to different campuses, or remove old workforce records.</p>
                    </div>
                    <div className="bg-[#0d0f12]/40 border border-[#21262d] rounded-xl p-5 hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => setActiveTab('siteManagement')}>
                      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Site Management
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed">Define physical sites and locations (e.g. Vellore Campus, Chennai Hub) to organize where your builders are deployed.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACTIVE WORKFORCE TABLE */}
            {activeTab === 'activeWorkforce' && (
              <div className="flex flex-col gap-8">
                {/* Stats Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Total Workforce */}
                  <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 flex items-center gap-5 shadow-lg shadow-black/20 hover:border-slate-700 transition-all duration-200 relative overflow-hidden group">
                    <div className="w-12 h-12 bg-slate-800/50 border border-slate-700/40 rounded-xl flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-105 transition-transform duration-200">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Workforce</span>
                      <h3 className="text-2xl font-extrabold text-white mt-1">{totalWorkforce} Active Crew</h3>
                    </div>
                  </div>

                  {/* Card 2: Daily Wage Outflow */}
                  <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-black/20 hover:border-slate-700 transition-all duration-200 relative overflow-hidden group min-h-[105px]">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-800/50 border border-slate-700/40 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-105 transition-transform duration-200">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Daily Wage Outflow</span>
                        <h3 className="text-2xl font-extrabold text-white mt-1">
                          ₹{totalWageBill.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Per Day
                        </h3>
                      </div>
                    </div>
                    {/* Elegant Accent Gradient Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#21262d]">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-r-full" style={{ width: totalWorkforce > 0 ? '60%' : '0%' }}></div>
                    </div>
                  </div>

                  {/* Card 3: Quick Register Action */}
                  <button 
                    onClick={handleCreateWorkerClick} 
                    className="w-full bg-[#161a22]/50 border border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 shadow-lg hover:border-slate-500 hover:bg-[#161a22]/80 transition-all duration-200 cursor-pointer group text-center"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">Quick Register</span>
                    <div className="w-10 h-10 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-slate-500 bg-[#0d0f12]/30 transition-all shadow-md">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                </section>

                {/* Table Card */}
                <section className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white tracking-tight">Active Workforce</h2>
                    <div className="text-xs bg-[#21262d] border border-slate-700/50 rounded-lg px-2.5 py-1 text-slate-300 font-semibold">
                      {workers.length} crew members
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#21262d] text-[#8b949e] text-xs font-semibold uppercase tracking-wider">
                          <th className="pb-3 px-2">ID</th>
                          <th className="pb-3 px-2">Name</th>
                          <th className="pb-3 px-2">Phone</th>
                          <th className="pb-3 px-2">Designation</th>
                          <th className="pb-3 px-2">Daily Wage</th>
                          <th className="pb-3 px-2">Assigned Site</th>
                          <th className="pb-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#21262d]/40">
                        {workers.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-12 text-slate-500 text-sm">
                              No workers found. Register new staff members to get started.
                            </td>
                          </tr>
                        ) : (
                          workers.map(worker => (
                            <tr key={worker.id} className="hover:bg-slate-900/40 transition-colors duration-150 group">
                              {/* ID Column */}
                              <td className="py-4 px-2 font-mono text-xs text-slate-500 font-medium">
                                #W{String(worker.id).padStart(3, '0')}
                              </td>
                              
                              {/* Name Column */}
                              <td className="py-4 px-2">
                                <span className="font-semibold text-white text-sm">{worker.name}</span>
                              </td>
                              
                              {/* Phone Column */}
                              <td className="py-4 px-2 text-sm text-slate-300 font-medium">
                                {worker.phone}
                              </td>
                              
                              {/* Designation Column */}
                              <td className="py-4 px-2 text-sm text-slate-300">
                                <span className="text-xs px-2 py-0.5 font-bold uppercase rounded-md tracking-wide bg-slate-800 text-slate-300 border border-slate-700/60">
                                  {worker.designation}
                                </span>
                              </td>
                              
                              {/* Wage Column */}
                              <td className="py-4 px-2 text-sm font-semibold text-white">
                                ₹{worker.dailyWageRate?.toFixed(2)}
                              </td>
                              
                              {/* Site Column */}
                              <td className="py-4 px-2 text-sm">
                                <span 
                                  onClick={() => handleAssignSiteClick(worker)}
                                  className="text-sky-400 hover:text-sky-300 hover:underline cursor-pointer font-medium transition-colors"
                                >
                                  {worker.site ? worker.site.siteName : 'Unassigned'}
                                </span>
                              </td>
                              
                              {/* Actions Column */}
                              <td className="py-4 px-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* View Action */}
                                  <button 
                                    onClick={() => handleViewWorkerClick(worker)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all" 
                                    title="View details"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  
                                  {/* Edit Action */}
                                  <button 
                                    onClick={() => handleEditWorkerClick(worker)}
                                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" 
                                    title="Edit Profile"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  
                                  {/* Delete Action */}
                                  <button 
                                    onClick={() => handleDeleteWorker(worker.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all" 
                                    title="Delete Worker"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* TAB: DEPLOYMENTS */}
            {activeTab === 'deployments' && (
              <div className="flex flex-col gap-6">
                {sites.map(site => {
                  const siteWorkers = workers.filter(w => w.site && w.site.id === site.id);
                  return (
                    <div key={site.id} className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 shadow-lg">
                      <div className="flex justify-between items-start border-b border-[#21262d] pb-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                            {site.siteName}
                          </h3>
                          <p className="text-slate-400 text-xs mt-0.5">{site.location}</p>
                        </div>
                        <span className="bg-[#21262d] border border-slate-700/50 text-[#8b949e] text-xs font-semibold px-2.5 py-1 rounded-lg">
                          {siteWorkers.length} crew deployed
                        </span>
                      </div>

                      {siteWorkers.length === 0 ? (
                        <p className="text-slate-500 text-xs italic py-2">No workers deployed on this site. Assign workers from the Active Workforce table.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {siteWorkers.map(w => (
                            <div key={w.id} className="bg-[#0d0f12]/50 border border-[#21262d] rounded-xl p-3 flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-white text-sm block">{w.name}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{w.designation}</span>
                              </div>
                              <button 
                                onClick={() => handleAssignSiteClick(w)}
                                className="text-xs text-sky-400 hover:underline"
                              >
                                Reassign
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unassigned Card */}
                {workers.filter(w => !w.site).length > 0 && (
                  <div className="bg-[#161a22] border border-dashed border-slate-700 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-slate-400 mb-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                      Unassigned Workforce ({workers.filter(w => !w.site).length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {workers.filter(w => !w.site).map(w => (
                        <div key={w.id} className="bg-[#0d0f12]/50 border border-[#21262d] rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-white text-sm block">{w.name}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{w.designation}</span>
                          </div>
                          <button 
                            onClick={() => handleAssignSiteClick(w)}
                            className="text-xs text-sky-400 hover:underline"
                          >
                            Assign Site
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SITE MANAGEMENT */}
            {activeTab === 'siteManagement' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Active Construction Sites</h2>
                  <button 
                    onClick={() => setShowSiteModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all hover:opacity-90 flex items-center gap-2 shadow-lg"
                  >
                    <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Register New Site
                  </button>
                </div>

                <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#21262d] text-[#8b949e] text-xs font-semibold uppercase tracking-wider">
                          <th className="pb-3 px-2">ID</th>
                          <th className="pb-3 px-2">Site Name</th>
                          <th className="pb-3 px-2">Location</th>
                          <th className="pb-3 px-2">Active Crew Deployed</th>
                          <th className="pb-3 px-2">Status</th>
                          <th className="pb-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#21262d]/40">
                        {sites.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-12 text-slate-500 text-sm">
                              No construction sites registered. Click "Register New Site" to add one.
                            </td>
                          </tr>
                        ) : (
                          sites.map(site => {
                            const siteWorkersCount = workers.filter(w => w.site && w.site.id === site.id).length;
                            return (
                              <tr key={site.id} className="hover:bg-slate-900/40 transition-colors duration-150">
                                <td className="py-4 px-2 font-mono text-xs text-slate-500 font-medium">
                                  #S{String(site.id).padStart(3, '0')}
                                </td>
                                <td className="py-4 px-2 font-semibold text-white text-sm">
                                  {site.siteName}
                                </td>
                                <td className="py-4 px-2 text-sm text-slate-300 font-medium">
                                  {site.location}
                                </td>
                                <td className="py-4 px-2 text-sm text-slate-300 font-semibold">
                                  {siteWorkersCount} workers
                                </td>
                                <td className="py-4 px-2 text-sm">
                                  <span className="text-xs px-2 py-0.5 font-bold uppercase rounded-md tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    ACTIVE
                                  </span>
                                </td>
                                <td className="py-4 px-2 text-right">
                                  <button 
                                    onClick={() => handleDeleteSite(site.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all" 
                                    title="Delete Site"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REPORTS */}
            {activeTab === 'reports' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cost Distribution per site */}
                <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-6">Daily Cost Outflow per Site</h3>
                  <div className="flex flex-col gap-4">
                    {sites.map(site => {
                      const siteWage = workers.filter(w => w.site && w.site.id === site.id).reduce((sum, w) => sum + (w.dailyWageRate || 0), 0);
                      const maxWage = totalWageBill || 1;
                      const percentage = Math.round((siteWage / maxWage) * 100);
                      return (
                        <div key={site.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{site.siteName}</span>
                            <span className="text-white">₹{siteWage} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-[#0d0f12] h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Designation distribution */}
                <div className="bg-[#161a22] border border-[#21262d] rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-6">Crew Designation Ratios</h3>
                  <div className="flex flex-col gap-4">
                    {['HELPER', 'MASON', 'ELECTRICIAN', 'PLUMBER', 'SUPERVISOR'].map(role => {
                      const count = workers.filter(w => w.designation === role).length;
                      const maxCount = workers.length || 1;
                      const percentage = Math.round((count / maxCount) * 100);
                      return (
                        <div key={role} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{role}</span>
                            <span className="text-white">{count} crew ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-[#0d0f12] h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Glassmorphic Worker Registration / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#161a22] border border-[#21262d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {selectedWorker ? 'Edit Worker Profile' : 'Register New Worker'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 mb-4">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitWorker} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Varun Updated"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#0d0f12] border border-[#21262d] focus:border-slate-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-[#0d0f12] border border-[#21262d] focus:border-slate-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Designation</label>
                  <select 
                    value={formData.designation}
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full bg-[#0d0f12] border border-[#21262d] focus:border-slate-500 rounded-xl px-3 py-2 text-white focus:outline-none transition-colors"
                  >
                    <option value="HELPER">HELPER</option>
                    <option value="MASON">MASON</option>
                    <option value="ELECTRICIAN">ELECTRICIAN</option>
                    <option value="PLUMBER">PLUMBER</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Daily Wage (₹) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 550"
                    value={formData.dailyWageRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyWageRate: e.target.value }))}
                    className="w-full bg-[#0d0f12] border border-[#21262d] focus:border-slate-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Assign Site</label>
                <select 
                  value={formData.siteId}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full bg-[#0d0f12] border border-[#21262d] focus:border-slate-500 rounded-xl px-3 py-2 text-white focus:outline-none transition-colors"
                >
                  <option value="">Select Construction Site</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.siteName} ({s.location})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#21262d] hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  {submitting ? (selectedWorker ? 'Saving...' : 'Registering...') : (selectedWorker ? 'Save Changes' : 'Register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Worker Details Modal */}
      {showViewModal && viewWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161a22] border border-[#21262d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Worker Profile</h2>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0d0f12]/50 border border-[#21262d] p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg">
                  {viewWorker.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">{viewWorker.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">#W{String(viewWorker.id).padStart(3, '0')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0d0f12]/30 border border-[#21262d]/50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Designation</span>
                  <span className="text-white font-semibold text-sm block mt-1">{viewWorker.designation}</span>
                </div>
                <div className="bg-[#0d0f12]/30 border border-[#21262d]/50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Daily Wage</span>
                  <span className="text-emerald-400 font-bold text-sm block mt-1">₹{viewWorker.dailyWageRate?.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#0d0f12]/30 border border-[#21262d]/50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Contact Phone</span>
                <span className="text-white font-semibold text-sm block mt-1">{viewWorker.phone}</span>
              </div>

              <div className="bg-[#0d0f12]/30 border border-[#21262d]/50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Assigned site</span>
                <span className="text-sky-400 font-semibold text-sm block mt-1">
                  {viewWorker.site ? `${viewWorker.site.siteName} (${viewWorker.site.location})` : 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-semibold transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Site Assignment Modal */}
      {showAssignModal && assignWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161a22] border border-[#21262d] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Assign Site</h2>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Reassign construction crew member <strong className="text-white">{assignWorker.name}</strong> to a different site.
            </p>

            <form onSubmit={handleAssignSiteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Select Campus Site</label>
                <select 
                  value={assignSiteId}
                  onChange={(e) => setAssignSiteId(e.target.value)}
                  className="w-full bg-[#0d0f12] border border-[#21262d] focus:border-slate-500 rounded-xl px-3 py-2 text-white focus:outline-none transition-colors"
                >
                  <option value="">Unassign / Leave Unassigned</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.siteName} ({s.location})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-[#21262d] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all hover:opacity-90"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Creation Modal */}
      {showSiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161a22] border border-[#21262d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Register New Construction Site</h2>
              <button 
                onClick={() => setShowSiteModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {siteFormError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 mb-4">
                {siteFormError}
              </div>
            )}

            <form onSubmit={handleSubmitSite} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Site Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Vellore Campus"
                  value={siteFormData.siteName}
                  onChange={(e) => setSiteFormData(prev => ({ ...prev, siteName: e.target.value }))}
                  className="w-full bg-[#0d0f12] border border-[#21262d] focus:border-slate-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Location Address *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Block-D, Katpadi"
                  value={siteFormData.location}
                  onChange={(e) => setSiteFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-[#0d0f12] border border-[#21262d] focus:border-slate-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button"
                  onClick={() => setShowSiteModal(false)}
                  className="px-4 py-2 border border-[#21262d] hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={siteSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  {siteSubmitting ? 'Registering...' : 'Register Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
