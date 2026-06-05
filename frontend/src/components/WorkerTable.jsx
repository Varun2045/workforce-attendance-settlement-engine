import React from 'react';

const DESIGNATION_BADGES = {
  SUPERVISOR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  MASON: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ELECTRICIAN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PLUMBER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  HELPER: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function WorkerTable({ workers, onDeleteWorker }) {
  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
        <h2 className="text-lg font-bold text-white tracking-wide">Active Workforce</h2>
        <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-semibold">
          {workers.length} Workers
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-850">
              <th className="py-3 px-6">ID</th>
              <th className="py-3 px-6">Name</th>
              <th className="py-3 px-6">Phone</th>
              <th className="py-3 px-6">Designation</th>
              <th className="py-3 px-6">Daily Wage</th>
              <th className="py-3 px-6">Assigned Site</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {workers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-500 text-sm">
                  No active workers registered yet. Use the form to add one.
                </td>
              </tr>
            ) : (
              workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-slate-800/35 transition-colors">
                  <td className="py-4 px-6 text-slate-500 text-sm">#{worker.id}</td>
                  <td className="py-4 px-6 text-white font-medium text-sm">
                    {worker.firstName} {worker.lastName}
                  </td>
                  <td className="py-4 px-6 text-slate-300 text-sm">{worker.phone}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${DESIGNATION_BADGES[worker.role] || DESIGNATION_BADGES.HELPER}`}>
                      {worker.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-emerald-400 text-sm font-semibold">
                    ₹{worker.dailyWageRate?.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-slate-300 text-sm">
                    {worker.site ? (
                      <span className="flex flex-col">
                        <span className="font-medium text-slate-200">{worker.site.siteName}</span>
                        <span className="text-xs text-slate-500">{worker.site.location}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-right">
                    <button
                      onClick={() => onDeleteWorker(worker.id)}
                      className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
