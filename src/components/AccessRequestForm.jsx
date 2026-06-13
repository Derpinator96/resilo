import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Shield, MapPin, Building, Loader2, CheckCircle } from 'lucide-react';


export default function AccessRequestForm() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [institutes, setInstitutes] = useState([]);
  const [selectedRole, setSelectedRole] = useState('staff');
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch districts on mount
  useEffect(() => {
    fetch('/api/districts')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDistricts(data);
          if (data.length > 0) {
            setSelectedDistrict(data[0]);
          }
        } else {
          throw new Error('Data is not an array');
        }
      })
      .catch(err => {
        console.error('Failed to load districts:', err);
        setErrorMessage('Failed to load districts from database.');
      });
  }, []);

  // Fetch centres when selected district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetch(`/api/institutes?district=${encodeURIComponent(selectedDistrict)}`)
        .then(res => {
          if (!res.ok) throw new Error('API Error');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setInstitutes(data);
            if (data.length > 0) {
              setSelectedInstitute(data[0]._id);
            } else {
              setSelectedInstitute('');
            }
          } else {
            throw new Error('Data is not an array');
          }
        })
        .catch(err => {
          console.error('Failed to load facilities:', err);
          setErrorMessage('Failed to load facilities for the selected district.');
        });
    }
  }, [selectedDistrict]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const token = await getToken();
      const res = await fetch('/api/role-requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestedRole: selectedRole,
          requestedInstituteId: selectedInstitute,
          clerkUserEmail: user.primaryEmailAddress?.emailAddress || 'Unknown'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit request');
      } else {
        setStatus('success');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full mb-4">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Request Submitted</h2>
        <p className="text-slate-600">Your access request has been sent to the administrators for review. You will be notified once it is approved.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Request Access Role</h2>
        <p className="text-sm text-slate-500 mt-1">Submit a demand to join a specific facility as Staff or Admin.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Shield size={16} /> Requested Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('staff')}
              className={`p-3 min-h-[44px] text-sm font-bold border-2 rounded-xl transition-all ${selectedRole === 'staff' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              Facility Staff
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-3 min-h-[44px] text-sm font-bold border-2 rounded-xl transition-all ${selectedRole === 'admin' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              Facility Admin
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <MapPin size={16} /> District
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all capitalize"
          >
            {districts.length === 0 ? (
              <option value="">Loading districts...</option>
            ) : (
              districts.map(d => <option key={d} value={d} className="capitalize">{d}</option>)
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Building size={16} /> Facility
          </label>
          <select
            value={selectedInstitute}
            onChange={(e) => setSelectedInstitute(e.target.value)}
            required
            className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all capitalize"
          >
            {institutes.length === 0 ? (
              <option value="">No facilities found in this district</option>
            ) : (
              institutes.map(inst => (
                <option key={inst._id} value={inst._id} className="capitalize">{inst.name}</option>
              ))
            )}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedInstitute}
          className="w-full py-3 px-4 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
