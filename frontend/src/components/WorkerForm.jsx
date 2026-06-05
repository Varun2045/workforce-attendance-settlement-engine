import React, { useState } from 'react';

const DESIGNATIONS = ['MASON', 'ELECTRICIAN', 'PLUMBER', 'SUPERVISOR', 'HELPER'];

export default function WorkerForm({ sites, onWorkerCreated }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    designation: 'HELPER',
    dailyWageRate: '',
    siteId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { firstName, lastName, phone, designation, dailyWageRate, siteId } = formData;

    if (!firstName || !lastName || !phone || !dailyWageRate || !siteId) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      // Find selected site object to attach to the worker object
      const selectedSite = sites.find((s) => s.id === parseInt(siteId));
      
      const payload = {
        firstName,
        lastName,
        phone,
        role: designation, // Backend maps 'role' in Worker entity
        site: selectedSite,
        dailyWageRate: parseFloat(dailyWageRate),
        isActive: true,
      };

      await onWorkerCreated(payload);

      // Reset Form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        designation: 'HELPER',
        dailyWageRate: '',
        siteId: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register worker. Check unique phone constraint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl max-w-lg w-full">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
        Register New Worker
      </h2>

      {error && (
        <div className="bg-rose-500/15 border border-rose-500/35 text-rose-200 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Daily Wage (INR)</label>
            <input
              type="number"
              name="dailyWageRate"
              value={formData.dailyWageRate}
              onChange={handleChange}
              placeholder="800"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assign Site</label>
          <select
            name="siteId"
            value={formData.siteId}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">Select a Construction Site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.siteName} ({s.location})</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200 mt-2"
        >
          {loading ? 'Registering...' : 'Register Worker'}
        </button>
      </form>
    </div>
  );
}
