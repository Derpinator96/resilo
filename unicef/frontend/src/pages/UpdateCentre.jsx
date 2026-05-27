import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import image from '../assets/Background 2.jpeg';
import toast from 'react-hot-toast';

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

// Build a blank load row
const blankLoad = (name) => ({
  typeOfLoad: name, numberOfLoad: '', pvConnectedquantity: '',
  ratingOfLoad: '', criticalLoad: defaultCriticalLoads.includes(name),
  model: '', make: '', grossVolume: '',
});

// Merge DB loads into loadOptions template (keep all default rows, overlay DB values)
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

// Split stored "YYYY-MM" month string back to { year, month }
const splitMonth = (raw = '') => {
  const parts = (raw || '').split('-');
  return parts.length === 2
    ? { year: parts[0], month: parts[1] }
    : { year: new Date().getFullYear().toString(), month: '' };
};

// Convert a date value to YYYY-MM-DD string for <input type="date">
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

// Styles (matches DataEntry.jsx)
const baseInput =
  'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700 no-spinner';
const smallInput =
  'block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700 no-spinner';
const fileInputClass =
  'block w-full cursor-pointer rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-900';

// Component 
export default function UpdateCentre() {
  const districts = useSelector((state) => state.data.districts);

  // Step-1 state: pick a centre to edit
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [centreList, setCentreList]     = useState([]);   // centres in district
  const [selectedId, setSelectedId]     = useState('');   // chosen centre _id
  const [fetchingList, setFetchingList] = useState(false);
  const [fetchError, setFetchError]     = useState('');

  // Step-2 state: edit form
  const [formData, setFormData]     = useState(null);   // null = not loaded yet
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch centres when district changes 
  useEffect(() => {
    if (!selectedDistrict) { setCentreList([]); setSelectedId(''); setFormData(null); return; }

    setFetchingList(true);
    setFetchError('');
    setCentreList([]);
    setSelectedId('');
    setFormData(null);

    const token =
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken');

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/v2/centres/${selectedDistrict}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        const data = res.data?.data;
        const list = Array.isArray(data) ? data : data?.centres ?? [];
        setCentreList(list);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message;
        setFetchError(msg);
      })
      .finally(() => setFetchingList(false));
  }, [selectedDistrict]);

  // Pre-fill form when a centre is chosen 
  useEffect(() => {
    if (!selectedId) { setFormData(null); return; }

    const centre = centreList.find((c) => c._id === selectedId);
    if (!centre) return;

    const { year, month } = splitMonth(centre.month);

    // Build 12 month keys from stored month
    const keys = generateLast12Months(year, month);

    const mapArr = (stored, keyName) => {
      const lookup = {};
      (stored || []).forEach(e => { lookup[e.month] = e[keyName]; });
      return keys.map(k => ({ month: k, [keyName]: lookup[k] ?? '' }));
    };

    setFormData({
      _id: centre._id,
      centreName: centre.centreName || '',
      district:   centre.district   || '',
      latitude:   centre.latitude   ?? '',
      longitude:  centre.longitude  ?? '',
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

      // Files — always null initially (user uploads replacements optionally)
      file: null, siteImage: null, panelImage: null,
      panelRatingImage: null, batteryImage: null,
      batteryRatingImage: null, inverterImage: null,
      inverterRatingImageUrl: null,
    });
  }, [selectedId, centreList]);

  // Regenerate month arrays when month/year changes 
  useEffect(() => {
    if (!formData?.month || !formData?.year) return;
    const keys = generateLast12Months(formData.year, formData.month);

    setFormData(prev => {
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
  }, [formData?.month, formData?.year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers 
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

  // Submit 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

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

    const token =
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken');

    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v2/centres/update/${formData._id}`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success('Centre data updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      const msg = err.response?.data?.message || 'Update failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-2 py-8 sm:px-4 lg:px-8">
      <img
        src={image}
        alt="Update Centre"
        className="absolute inset-0 h-full w-full object-cover -z-10"
      />

      {/* Step 1: District + Centre selector  */}
      <div className="mx-auto max-w-7xl mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-md backdrop-blur-sm">
        <div className="bg-[#011425] px-6 py-4 sm:px-8">
          <h1 className="text-2xl font-semibold text-white">Update Centre Data</h1>
          <p className="mt-1 text-sm text-white">
            Select a district and centre to load its existing data for editing.
          </p>
        </div>

        <div className="p-6 grid gap-4 md:grid-cols-2">
          {/* District */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Select District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className={baseInput}
            >
              <option value=""> Select District </option>
              {districts.map((d) => (
                <option key={d} value={d.toLowerCase()}>{d}</option>
              ))}
            </select>
          </div>

          {/* Centre */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Select Centre
            </label>
            {fetchingList ? (
              <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-500">
                <svg className="h-4 w-4 animate-spin text-teal-700" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading centres…
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={!selectedDistrict || centreList.length === 0}
                className={baseInput + ' disabled:cursor-not-allowed disabled:bg-slate-100'}
              >
                <option value="">
                  {!selectedDistrict
                    ? ' Select a district first '
                    : centreList.length === 0
                    ? fetchError || 'No centres found'
                    : ' Select Centre '}
                </option>
                {centreList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.centreName} ({c.month})
                  </option>
                ))}
              </select>
            )}
            {fetchError && !fetchingList && (
              <p className="mt-1 text-xs text-red-600">{fetchError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Edit Form (shown only after a centre is selected) */}
      {formData && (
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-md backdrop-blur-sm"
        >
          {/* Header */}
          <div className="bg-teal-800 px-6 py-4 sm:px-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white capitalize">
                Editing: {formData.centreName}
              </h2>
            </div>
            <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-medium text-white">
              Edit Mode
            </span>
          </div>

          <div className="space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* Centre Information */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Centre Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Centre Name</label>
                  <input
                    type="text" name="centreName" value={formData.centreName}
                    onChange={handleChange} className={baseInput}
                    placeholder="Centre name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">District</label>
                  <input
                    type="text" name="district" value={formData.district}
                    onChange={handleChange} className={baseInput}
                    placeholder="District"
                  />
                </div>
              </div>
            </section>

            {/* Location Details */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Location Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Latitude</label>
                  <input
                    type="number" step="any" name="latitude" value={formData.latitude}
                    onChange={handleChange} className={baseInput}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Longitude</label>
                  <input
                    type="number" step="any" name="longitude" value={formData.longitude}
                    onChange={handleChange} className={baseInput}
                  />
                </div>
              </div>
            </section>

            {/* System Specifications */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">System Specifications</h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">PV Rating (W per panel)</label>
                  <input type="number" name="pvRating" value={formData.pvRating} onChange={handleChange} className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Number of Panels</label>
                  <input type="number" name="noOfPanels" value={formData.noOfPanels} onChange={handleChange} className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">PV System Make / Mfr.</label>
                  <input type="text" name="pvSystemake" value={formData.pvSystemake} onChange={handleChange} className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">PV Voltage (V)</label>
                  <input type="number" name="pvVoltage" value={formData.pvVoltage} onChange={handleChange} className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Date of Installation</label>
                  <input type="date" name="dateOfInstallation" value={formData.dateOfInstallation} onChange={handleChange} className={baseInput} />
                </div>
              </div>

              {/* Battery */}
              <section className="mt-6 rounded-lg bg-slate-50 p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Battery Specifications</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Number of Batteries</label>
                    <input type="number" name="batteryCount" value={formData.batteryCount} onChange={handleChange} className={baseInput} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Voltage (V)</label>
                    <input type="number" name="batteryVoltage" value={formData.batteryVoltage} onChange={handleChange} className={baseInput} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Capacity (Ah)</label>
                    <input type="number" name="batteryCapacityAh" value={formData.batteryCapacityAh} onChange={handleChange} className={baseInput} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Manufacturer</label>
                    <input type="text" name="batteryManufacturer" value={formData.batteryManufacturer} onChange={handleChange} className={baseInput} />
                  </div>
                </div>
              </section>

              {/* Inverter */}
              <section className="mt-6 rounded-lg bg-slate-50 p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Inverter Specifications</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Make</label>
                    <input type="text" name="inverterMake" value={formData.inverterMake} onChange={handleChange} className={baseInput} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Rating (KVA)</label>
                    <input type="number" step="any" name="inverterRatingKVA" value={formData.inverterRatingKVA} onChange={handleChange} className={baseInput} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Voltage (V)</label>
                    <input type="number" name="inverterVoltage" value={formData.inverterVoltage} onChange={handleChange} className={baseInput} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                    <select name="inverterType" value={formData.inverterType} onChange={handleChange} className={baseInput}>
                      <option value="">Select Type</option>
                      <option value="off-grid">Off-grid</option>
                      <option value="on-grid">On-grid</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </section>
            </section>

            {/* Energy Details  */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                Energy Details
              </h2>

              <div className="grid gap-6 md:grid-cols-2 mb-6">
                {/* Month / Year */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Target Month of Data</label>
                  <div className="flex gap-2">
                    <select name="month" value={formData.month} onChange={handleChange} className={baseInput}>
                      <option value="">Month</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                        <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                      ))}
                    </select>
                    <select name="year" value={formData.year} onChange={handleChange} className={baseInput}>
                      {Array.from({ length: 5 }, (_, i) => {
                        const y = new Date().getFullYear() - 2 + i;
                        return <option key={y} value={y}>{y}</option>;
                      })}
                    </select>
                  </div>
                </div>
                {/* Monthly Energy Consumption */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Monthly Energy Consumption (kWh)
                  </label>
                  <input
                    type="number" step="any" name="monthlyEnergyConsumption"
                    value={formData.monthlyEnergyConsumption}
                    onChange={handleChange} className={baseInput}
                  />
                </div>
              </div>

              {/* Actual Solar Generation */}
              {formData.actualsolargeneration.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">
                    Actual Solar Generation (kWh)
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {formData.actualsolargeneration.map((entry, i) => (
                      <div key={entry.month} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <label className="mb-1 block text-xs font-medium text-slate-600">{entry.month}</label>
                        <input
                          type="number" step="any" name="generation"
                          value={entry.generation}
                          onChange={(e) => handleActualSolarChange(i, e)}
                          className={smallInput}
                          placeholder="kWh"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid Consumption */}
              {formData.gridconsumption.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">
                    Grid Consumption (kWh)
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {formData.gridconsumption.map((entry, i) => (
                      <div key={entry.month} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <label className="mb-1 block text-xs font-medium text-slate-600">{entry.month}</label>
                        <input
                          type="number" step="any" name="consumption"
                          value={entry.consumption}
                          onChange={(e) => handleGridConsumptionChange(i, e)}
                          className={smallInput}
                          placeholder="kWh"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Loads Connected */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Loads Connected</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-225 border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#011425] text-white text-xs">
                      {['Load Type','Total Qty','PV Connected','Rating (W)','Model','Make','Volume (L)','Critical'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.loadsConnected.map((load, index) => (
                      <tr key={load.typeOfLoad} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-3 py-2 font-medium text-slate-700 capitalize whitespace-nowrap">
                          {load.typeOfLoad}
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" name="numberOfLoad" value={load.numberOfLoad}
                            onChange={(e) => handleLoadChange(index, e)}
                            className={smallInput + ' text-center w-16 mx-auto'} placeholder="0" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" name="pvConnectedquantity" value={load.pvConnectedquantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              const total = parseInt(load.numberOfLoad) || 0;
                              if (val > total && total > 0) {
                                toast.error('PV Connected Quantity cannot exceed Total Quantity');
                                return;
                              }
                              handleLoadChange(index, e);
                            }}
                            className={smallInput + ' text-center w-16 mx-auto border-teal-200 bg-teal-50/30'}
                            placeholder="0" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" name="ratingOfLoad" value={load.ratingOfLoad}
                            onChange={(e) => handleLoadChange(index, e)}
                            className={smallInput + ' w-20'} placeholder="W" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" name="model" value={load.model}
                            onChange={(e) => handleLoadChange(index, e)}
                            className={smallInput + ' w-24'} placeholder="Model" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" name="make" value={load.make}
                            onChange={(e) => handleLoadChange(index, e)}
                            className={smallInput + ' w-24'} placeholder="Make" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" name="grossVolume" value={load.grossVolume}
                            onChange={(e) => handleLoadChange(index, e)}
                            className={smallInput + ' w-16'} placeholder="L" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" name="criticalLoad" checked={!!load.criticalLoad}
                            onChange={(e) => handleLoadChange(index, e)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Additional Information */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Additional Information</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700">Grid Supply Available</label>
                  <input type="checkbox" name="gridSupply"
                    checked={!!formData.additionalInfo.gridSupply}
                    onChange={handleAdditionalInfoChange}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700">Involvement of CREDA</label>
                  <input type="checkbox" name="InvolvementofCREDA"
                    checked={!!formData.additionalInfo.InvolvementofCREDA}
                    onChange={handleAdditionalInfoChange}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700" />
                </div>

                {[
                  { label: 'Grid Supply Quality', name: 'gridsupplyQuality', placeholder: 'e.g. good, poor' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
                    <input type="text" name={f.name} placeholder={f.placeholder}
                      value={formData.additionalInfo[f.name] || ''}
                      onChange={handleAdditionalInfoChange} className={baseInput} />
                  </div>
                ))}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Supply Phase</label>
                  <select name="Supply" value={formData.additionalInfo.Supply || ''} onChange={handleAdditionalInfoChange} className={baseInput}>
                    <option value="">Select Phase</option>
                    <option value="1 Phase">1 Phase</option>
                    <option value="3 Phase">3 Phase</option>
                  </select>
                </div>

                {[
                  { label: 'No. of Beds',              name: 'noofBeds',                       type: 'number', ph: 'Count' },
                  { label: 'IPD Admissions / Month',   name: 'noofIPDAdmissionperMonth',       type: 'number', ph: 'Count' },
                  { label: 'OPD Daily',                name: 'noofOPDdaily',                   type: 'number', ph: 'Count' },
                  { label: 'Deliveries / Month',       name: 'noofdeliveryperMonth',           type: 'number', ph: 'Count' },
                  { label: 'Solar Failure Freq.',      name: 'failureFrequencyofsolarPanels',  type: 'text',   ph: 'e.g. monthly' },
                  { label: 'Battery Water Freq.',      name: 'frequencyofchangingbatteryWater',type: 'text',   ph: 'e.g. bi-monthly' },
                  { label: 'Backup till Sunrise',      name: 'batterybackuptillSunrise',       type: 'text',   ph: 'yes / no' },
                  { label: 'Solar Repair Time',        name: 'resolutionTimeforSolarPanelRepairs', type: 'text', ph: 'e.g. 1-2 days' },
                  { label: 'Fault Downtime',           name: 'downtimeduringFaults',           type: 'text',   ph: 'e.g. 2-3 hours' },
                  { label: 'Maintenance Freq.',        name: 'panelmaintenanceFrequency',      type: 'text',   ph: 'e.g. monthly' },
                  { label: 'Daytime Load Tripping',    name: 'anyloadtrippingduringtheDay',    type: 'text',   ph: 'yes / occasionally' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
                    <input type={f.type} name={f.name} placeholder={f.ph}
                      value={formData.additionalInfo[f.name] ?? ''}
                      onChange={handleAdditionalInfoChange} className={baseInput} />
                  </div>
                ))}
              </div>
            </section>

            {/* Remarks */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Remarks</h2>
              <textarea name="remarks" placeholder="Enter remarks"
                value={formData.remarks} onChange={handleChange}
                rows={3} className={baseInput} />
            </section>

            {/* Site Photos (optional replacements) */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Site Photos</h2>
              <p className="mb-4 text-xs text-slate-500">
                Upload a new image only if you want to replace the existing one. Leave blank to keep current.
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
                    <input type="file" accept="image/*" onChange={handleImageChange(f.name)} className={fileInputClass} />
                  </div>
                ))}
              </div>
            </section>

            {/* General File  */}
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Upload General File</h2>
              <p className="mb-3 text-xs text-slate-500">Leave blank to keep existing file.</p>
              <input type="file" onChange={handleFileChange} className={fileInputClass} />
            </section>

            {/* Submit */}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 text-lg rounded-md font-medium text-white shadow-sm transition-colors duration-200 ${
                  isSubmitting
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-[#0c1822] hover:bg-teal-800 focus:ring-2 focus:ring-offset-2 focus:ring-teal-700'
                }`}
              >
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

          </div>
        </form>
      )}

      {/* Empty state  */}
      {!formData && !fetchingList && selectedDistrict && centreList.length > 0 && (
        <div className="mx-auto max-w-7xl rounded-xl border border-dashed border-slate-300 bg-white/70 p-12 text-center backdrop-blur-sm">
          <p className="text-slate-500 text-sm">Select a centre above to load its data.</p>
        </div>
      )}
    </div>
  );
}