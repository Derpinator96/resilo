import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

const loadOptions = [
  "ceiling fan", "tube light", "led light", "iceline refrigerator",
  "deep freezer", "Refrigerator", "Glassdoor refrigerator",
  "Laboratory refrigerator", "servo controlled baby warmer",
  "shadowless lamp", "cooler", "PC", "AC", "Printer", "CFL"
];

const defaultCriticalLoads = [
  "iceline refrigerator", "deep freezer", "Refrigerator",
  "Glassdoor refrigerator", "Laboratory refrigerator",
  "servo controlled baby warmer", "shadowless lamp"
];

const emptyAdditionalInfo = {
  gridSupply: true, gridsupplyQuality: '', InvolvementofCREDA: false,
  Supply: '', noofBeds: '', noofIPDAdmissionperMonth: '',
  noofOPDdaily: '', noofdeliveryperMonth: '',
  failureFrequencyofsolarPanels: '', frequencyofchangingbatteryWater: '',
  batterybackuptillSunrise: '', resolutionTimeforSolarPanelRepairs: '',
  downtimeduringFaults: '', panelmaintenanceFrequency: '',
  anyloadtrippingduringtheDay: '',
};

const blankLoad = (name) => ({
  typeOfLoad: name, numberOfLoad: '', pvConnectedquantity: '',
  ratingOfLoad: '', criticalLoad: defaultCriticalLoads.includes(name),
  model: '', make: '', grossVolume: '',
});

const mergeLoads = (dbLoads = []) => {
  const lookup = {};
  dbLoads.forEach(l => { lookup[l.typeOfLoad?.toLowerCase()] = l; });
  return loadOptions.map(name => {
    const match = lookup[name.toLowerCase()];
    return match
      ? { ...blankLoad(name), ...match, typeOfLoad: name }
      : blankLoad(name);
  });
};

const splitMonth = (raw = '') => {
  const parts = (raw || '').split('-');
  return parts.length === 2
    ? { year: parts[0], month: parts[1] }
    : { year: new Date().getFullYear().toString(), month: '' };
};

const toDateInput = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

const generateLast12Months = (year, month) => {
  if (!year || !month) return [];
  const result = [];
  const yyyy = parseInt(year, 10);
  const mm = parseInt(month, 10);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(yyyy, mm - 1 - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
};

const baseInput =
  'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 no-spinner';
const smallInput =
  'block w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 no-spinner';
const fileInputClass =
  'block w-full cursor-pointer rounded-md border border-dashed border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-rose-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-900';


export default function UpdateCentre() {
  const { getToken } = useAuth();
  const [districts, setDistricts] = useState([]);
  
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [centreList, setCentreList]     = useState([]);
  const [selectedId, setSelectedId]     = useState('');
  const [fetchingList, setFetchingList] = useState(false);
  const [fetchError, setFetchError]     = useState('');

  const [formData, setFormData]     = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/districts')
      .then(res => res.json())
      .then(data => setDistricts(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDistrict) { setCentreList([]); setSelectedId(''); setFormData(null); return; }

    setFetchingList(true);
    setFetchError('');
    setCentreList([]);
    setSelectedId('');
    setFormData(null);

    const fetchCentres = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/centredata/${selectedDistrict}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch centres");
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (json.centres || []);
        setCentreList(list);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setFetchingList(false);
      }
    };
    fetchCentres();
  }, [selectedDistrict, getToken]);

  useEffect(() => {
    if (!selectedId) { setFormData(null); return; }
    const centre = centreList.find((c) => c._id === selectedId);
    if (!centre) return;

    const { year, month } = splitMonth(centre.month);
    const keys = generateLast12Months(year, month);

    const mapArr = (stored, keyName) => {
      const lookup = {};
      (stored || []).forEach(e => { lookup[e.month] = e[keyName]; });
      return keys.map(k => ({ month: k, [keyName]: lookup[k] ?? '' }));
    };

    setFormData({
      _id: centre._id,
      centreName: centre.centreName || centre.name || '',
      district:   centre.district   || '',
      latitude:   centre.latitude || (centre.location?.lat ?? ''),
      longitude:  centre.longitude || (centre.location?.lng ?? ''),
      month,
      year,
      monthlyEnergyConsumption: centre.monthlyEnergyConsumption ?? '',
      pvRating:          centre.pvRating         ?? '',
      noOfPanels:        centre.noOfPanels        ?? '',
      pvSystemake:       centre.pvSystemake       || '',
      pvVoltage:         centre.pvVoltage         ?? '',
      dateOfInstallation: toDateInput(centre.dateOfInstallation),
      batteryCount:        centre.battery?.count        ?? '',
      batteryVoltage:      centre.battery?.voltage       ?? '',
      batteryCapacityAh:   centre.battery?.capacityAh    ?? '',
      batteryManufacturer: centre.battery?.Manufacturer  || '',
      inverterMake:       centre.inverter?.make              || '',
      inverterRatingKVA:  centre.inverter?.inverterRatingKVA ?? '',
      inverterVoltage:    centre.inverter?.voltage           ?? '',
      inverterType:       centre.inverter?.type              || '',
      loadsConnected: mergeLoads(centre.loadsConnected),
      actualsolargeneration: mapArr(centre.actualsolargeneration, 'generation'),
      gridconsumption:       mapArr(centre.gridconsumption,       'consumption'),
      additionalInfo: {
        ...emptyAdditionalInfo,
        ...(centre.additionalInfo || {}),
        gridSupply:          centre.additionalInfo?.gridSupply          ?? true,
        InvolvementofCREDA:  centre.additionalInfo?.InvolvementofCREDA  ?? false,
      },
      remarks: centre.remarks || '',
      file: null, siteImage: null, panelImage: null,
      panelRatingImage: null, batteryImage: null,
      batteryRatingImage: null, inverterImage: null,
      inverterRatingImageUrl: null,
    });
  }, [selectedId, centreList]);

  useEffect(() => {
    if (!formData?.month || !formData?.year) return;
    const keys = generateLast12Months(formData.year, formData.month);
    setFormData(prev => {
      if (!prev) return prev;
      const mapExisting = (arr, keyName) => {
        const lookup = {};
        (arr || []).forEach(item => { lookup[item.month] = item[keyName]; });
        return keys.map(k => ({ month: k, [keyName]: lookup[k] ?? '' }));
      };
      return {
        ...prev,
        actualsolargeneration: mapExisting(prev.actualsolargeneration, 'generation'),
        gridconsumption:       mapExisting(prev.gridconsumption,       'consumption'),
      };
    });
  }, [formData?.month, formData?.year]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdditionalInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleFileChange = (e) =>
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));

  const handleImageChange = (fieldName) => (e) =>
    setFormData(prev => ({ ...prev, [fieldName]: e.target.files[0] }));

  const handleLoadChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = [...prev.loadsConnected];
      updated[index] = { ...updated[index], [name]: type === 'checkbox' ? checked : value };
      return { ...prev, loadsConnected: updated };
    });
  };

  const handleActualSolarChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = [...prev.actualsolargeneration];
      updated[index] = { ...updated[index], [name]: value === '' ? 0 : value };
      return { ...prev, actualsolargeneration: updated };
    });
  };

  const handleGridConsumptionChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = [...prev.gridconsumption];
      updated[index] = { ...updated[index], [name]: value === '' ? 0 : value };
      return { ...prev, gridconsumption: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === '_id') return;
      if (key === 'month') {
        data.append('month', `${formData.year}-${formData.month}`);
      } else if (key === 'year') {
        return;
      } else if (key === 'loadsConnected') {
        const active = value.filter(l => l.numberOfLoad !== '' && Number(l.numberOfLoad) > 0);
        data.append('loadsConnected', JSON.stringify(active));
      } else if (key === 'actualsolargeneration') {
        data.append('actualsolargeneration', JSON.stringify(value));
      } else if (key === 'gridconsumption') {
        data.append('gridconsumption', JSON.stringify(value));
      } else if (key === 'additionalInfo') {
        Object.entries(value).forEach(([aiKey, aiVal]) => {
          if (aiVal !== '' && aiVal !== null && aiVal !== undefined) {
            data.append(aiKey, aiVal);
          }
        });
      } else if ([
        'file', 'siteImage', 'panelImage', 'panelRatingImage',
        'batteryImage', 'batteryRatingImage', 'inverterImage', 'inverterRatingImageUrl',
      ].includes(key)) {
        if (value) data.append(key, value);
      } else if (value !== null && value !== undefined) {
        data.append(key, value);
      }
    });

    try {
      const token = await getToken();
      const res = await fetch(`/api/centredata/update/${formData._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      if (!res.ok) throw new Error("Update failed");
      setMessage({ type: 'success', text: 'Centre data updated successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen pb-10">
      
      {/* Header / Selector */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Update Infrastructure Database</h2>
        <p className="text-sm text-slate-400 mb-6">Select a district and facility to edit telemetry bounds or configuration.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">District</label>
            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className={baseInput}>
              <option value="">-- Select --</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Facility</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={!selectedDistrict || fetchingList} className={baseInput + ' disabled:opacity-50'}>
              <option value="">{fetchingList ? 'Loading...' : '-- Select --'}</option>
              {centreList.map((c) => (
                <option key={c._id} value={c._id}>{c.centreName || c.name}</option>
              ))}
            </select>
            {fetchError && <p className="text-red-400 text-xs mt-1">{fetchError}</p>}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Editor */}
      {formData && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Core Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Name</label>
                <input type="text" name="centreName" value={formData.centreName} onChange={handleChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Latitude</label>
                <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Longitude</label>
                <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">PV Rating (W)</label>
                <input type="number" name="pvRating" value={formData.pvRating} onChange={handleChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">No. Panels</label>
                <input type="number" name="noOfPanels" value={formData.noOfPanels} onChange={handleChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Battery Count</label>
                <input type="number" name="batteryCount" value={formData.batteryCount} onChange={handleChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Inverter KVA</label>
                <input type="number" step="any" name="inverterRatingKVA" value={formData.inverterRatingKVA} onChange={handleChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Install Date</label>
                <input type="date" name="dateOfInstallation" value={formData.dateOfInstallation} onChange={handleChange} className={baseInput} />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
             <h3 className="text-lg font-bold text-white mb-4">Site Assets (Updates)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Site Image',              name: 'siteImage' },
                  { label: 'Solar Panel Image',       name: 'panelImage' },
                  { label: 'Panel Rating Nameplate',  name: 'panelRatingImage' },
                  { label: 'Battery Image',           name: 'batteryImage' },
                  { label: 'Battery Rating Nameplate',name: 'batteryRatingImage' },
                  { label: 'Inverter Image',          name: 'inverterImage' },
                  { label: 'Inverter Rating Nameplate',name: 'inverterRatingImageUrl' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="mb-1 block text-sm font-medium text-slate-300">{f.label}</label>
                    <input type="file" accept="image/*" onChange={handleImageChange(f.name)} className={fileInputClass} />
                  </div>
                ))}
             </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all">
              {isSubmitting ? 'Pushing Updates...' : 'Commit Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
