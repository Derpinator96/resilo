import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import image from '../assets/Background 2.jpeg';

// Added "shadowless lamp" to the list
const loadOptions = [
  "ceiling fan",
  "tube light",
  "led light",
  "iceline refrigerator",
  "deep freezer",
  "Refrigerator",
  "Glassdoor refrigerator",
  "Laboratory refrigerator",
  "servo controlled baby warmer",
  "shadowless lamp",
  "cooler",
  "PC",
  "AC",
  "Printer",
  "CFL"
];

// List of appliances that should be checked as Critical by default
const defaultCriticalLoads = [
  "iceline refrigerator",
  "deep freezer",
  "Refrigerator",
  "Glassdoor refrigerator",
  "Laboratory refrigerator",
  "servo controlled baby warmer",
  "shadowless lamp"
];

function DataEntry() {
  const districts = useSelector((state) => state.data.districts);
  const healthCentres = useSelector((state) => state.data.healthCentres);

  // Initialize loads with default critical statuses
  const initialLoads = loadOptions.map((loadName) => ({
    typeOfLoad: loadName,
    numberOfLoad: "",
    pvConnectedquantity: "", // Matched to your Mongoose model exactly
    ratingOfLoad: "",
    criticalLoad: defaultCriticalLoads.includes(loadName),
    model: "",
    make: "",
    grossVolume: "",
  }));

  const [formData, setFormData] = useState({
    centreName: "",
    district: "",
    latitude: "",
    longitude: "",
    month: "",
    year: new Date().getFullYear().toString(),
    monthlyEnergyConsumption: "",
    pvRating: "",
    noOfPanels: "",
    pvSystemake: "",
    pvVoltage: "",                 
    dateOfInstallation: "",
    batteryCount: "",
    batteryVoltage: "",
    batteryCapacityAh: "",
    batteryManufacturer: "",      
    inverterMake: "",
    inverterRatingKVA: "",          
    inverterVoltage: "",            
    inverterType: "",
    remarks: "",
    loadsConnected: initialLoads, 
    actualsolargeneration: [],
    gridconsumption: [],
    additionalInfo: {
      gridSupply: true,
      gridsupplyQuality: "",
      InvolvementofCREDA: false,
      Supply: "",
      noofBeds: "",
      noofIPDAdmissionperMonth: "",
      noofOPDdaily: "",
      noofdeliveryperMonth: "",
      failureFrequencyofsolarPanels: "",
      frequencyofchangingbatteryWater: "",
      batterybackuptillSunrise: "",
      resolutionTimeforSolarPanelRepairs: "",
      downtimeduringFaults: "",
      panelmaintenanceFrequency: "",
      anyloadtrippingduringtheDay: "",
    },
    file: null,
    siteImage: null,                
    panelImage: null,               
    panelRatingImage: null,        
    batteryImage: null,            
    batteryRatingImage: null,       
    inverterImage: null,           
    inverterRatingImage: null,     
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCentres = formData.district
    ? (healthCentres[formData.district] || [])
    : [];

  //AUTO-GENERATE 12 MONTHS LOGIC
  const generateLast12Months = (year, month) => {
    if (!year || !month) return [];
    const result = [];
    const yyyy = parseInt(year, 10);
    const mm = parseInt(month, 10);
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(yyyy, mm - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result.push({ month: key });
    }
    return result;
  };

  useEffect(() => {
    if (formData.month && formData.year) {
      const monthsTemplate = generateLast12Months(formData.year, formData.month);
      
      setFormData((prev) => {
        const mapExisting = (arr, keyName) => {
          const lookup = {};
          arr.forEach(item => { lookup[item.month] = item[keyName]; });
          return monthsTemplate.map(m => ({
            month: m.month,
            [keyName]: lookup[m.month] || ""
          }));
        };

        return {
          ...prev,
          actualsolargeneration: mapExisting(prev.actualsolargeneration, "generation"),
          gridconsumption: mapExisting(prev.gridconsumption, "consumption")
        };
      });
    }
  }, [formData.month, formData.year]);

  //HANDLERS
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "district") {
      setFormData((prev) => ({ ...prev, district: value, centreName: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAdditionalInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleImageChange = (fieldName) => (e) => {
    setFormData((prev) => ({ ...prev, [fieldName]: e.target.files[0] }));
  };

  const handleLoadChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updatedLoads = [...prev.loadsConnected];
      updatedLoads[index] = {
        ...updatedLoads[index],
        [name]: type === "checkbox" ? checked : value,
      };
      return { ...prev, loadsConnected: updatedLoads };
    });
  };

const handleActualSolarChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.actualsolargeneration];
      updated[index] = { ...updated[index], [name]: value === "" ? "" : value };
      return { ...prev, actualsolargeneration: updated };
    });
  };

  const handleGridConsumptionChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.gridconsumption];
      updated[index] = { ...updated[index], [name]: value === "" ? "" : value };
      return { ...prev, gridconsumption: updated };
    });
  };

  //SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "month") {
        data.append("month", `${formData.year}-${formData.month}`);
      } else if (key === "year") {
        return; 
      } else if (key === "loadsConnected") {
        const activeLoads = value.filter(
          (load) => load.numberOfLoad !== "" && load.numberOfLoad > 0
        );
        data.append(key, JSON.stringify(activeLoads));
      } else if (key === "actualsolargeneration") {
        data.append("actualsolargeneration", JSON.stringify(value));
      } else if (key === "gridconsumption") {
        data.append("gridconsumption", JSON.stringify(value));
      } else if (key === "additionalInfo") {
        Object.entries(value).forEach(([aiKey, aiVal]) => {
          if (aiVal !== "" && aiVal !== null && aiVal !== undefined) {
            data.append(aiKey, aiVal);
          }
        });
      } else if (
        [
          "file",
          "siteImage",
          "panelImage",
          "panelRatingImage",
          "batteryImage",
          "batteryRatingImage",
          "inverterImage",
          "inverterRatingImage",
        ].includes(key)
      ) {
        if (value) data.append(key, value);
      } else if (value !== null && value !== undefined) {
        data.append(key, value);
      }
    });

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v2/centres/data`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert('Submitted successfully');
    } catch (err) {
      console.error("Error:", err);
      const message =
        err.response?.data?.message ||   // ApiError message from backend
        err.message ||                   // network/timeout errors
        'Submission failed. Please try again.';
      alert(message);

    } finally {
      setIsSubmitting(false);
    }
  };

  //STYLES
  const baseInput =
    "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700 no-spinner";
  const smallInput =
    "block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700 no-spinner";
  const fileInputClass =
    "block w-full cursor-pointer rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-900";

  return (
    <div className="relative min-h-screen overflow-hidden px-2 py-8 sm:px-4 lg:px-8">
      <img
        src={image}
        alt="Data Entry Banner"
        className="absolute inset-0 h-full w-full object-cover -z-10"
      />

      {/* Increased max-width to max-w-7xl to utilize screen width and prevent horizontal scrolling */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-md backdrop-blur-sm"
      >
        <div className="bg-[#011425] px-6 py-4 sm:px-8">
          <h1 className="text-2xl font-semibold text-white">
            Centre Data Entry
          </h1>
          <p className="mt-1 text-sm text-white">
            Fill in solar PV and load details for the selected health centre.
          </p>
        </div>

        <div className="space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
          
          {/* Centre Information */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Centre Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Select District</label>
                <select name="district" value={formData.district} onChange={handleChange} required className={baseInput}>
                  <option value=""> Select District </option>
                  {districts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Select Centre</label>
                <select
                  name="centreName"
                  value={formData.centreName}
                  onChange={handleChange}
                  required
                  disabled={!formData.district}
                  className={baseInput + " disabled:cursor-not-allowed disabled:bg-slate-100"}
                >
                  <option value="">
                    {formData.district
                      ? availableCentres.length > 0 ? " Select Centre " : "No centres available for this district"
                      : " Select a district first "}
                  </option>
                  {availableCentres.map((centre) => (
                    <option key={centre} value={centre}>{centre}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Location Details */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Location Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Latitude</label>
                <input type="number" onWheel={(e) => e.preventDefault()} step="any" name="latitude" placeholder="Enter Latitude" value={formData.latitude} onChange={handleChange} required className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Longitude</label>
                <input type="number" onWheel={(e) => e.preventDefault()} step="any" name="longitude" placeholder="Enter Longitude" value={formData.longitude} onChange={handleChange} required className={baseInput} />
              </div>
            </div>
          </section>

          {/* System Specifications */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">System Specifications</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">PV Rating (W per panel)</label>
                <input type="number" onWheel={(e) => e.preventDefault()} name="pvRating" placeholder="Enter PV Rating" value={formData.pvRating} onChange={handleChange} required className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Number of Panels</label>
                <input type="number" onWheel={(e) => e.preventDefault()} name="noOfPanels" placeholder="Enter Number of Panels" value={formData.noOfPanels} onChange={handleChange} required className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">PV System Make / Mfr.</label>
                <input type="text" name="pvSystemake" placeholder="Enter PV System Make" value={formData.pvSystemake} onChange={handleChange} required className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">PV Voltage (V)</label>
                <input type="number" onWheel={(e) => e.preventDefault()} name="pvVoltage" placeholder="Enter PV Voltage" value={formData.pvVoltage} onChange={handleChange} required className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date of Installation</label>
                <input type="date" name="dateOfInstallation" value={formData.dateOfInstallation} onChange={handleChange} required className={baseInput} />
              </div>
            </div>

            {/* Battery Specifications */}
            <section className="mt-6 rounded-lg bg-slate-50 p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Battery Specifications</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Number of Batteries</label>
                  <input type="number" onWheel={(e) => e.preventDefault()} name="batteryCount" value={formData.batteryCount} onChange={handleChange} required className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Voltage (V)</label>
                  <input type="number" onWheel={(e) => e.preventDefault()} name="batteryVoltage" value={formData.batteryVoltage} onChange={handleChange} required className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Capacity (Ah)</label>
                  <input type="number" onWheel={(e) => e.preventDefault()} name="batteryCapacityAh" value={formData.batteryCapacityAh} onChange={handleChange} required className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Manufacturer</label>
                  <input type="text" name="batteryManufacturer" placeholder="Enter Manufacturer" value={formData.batteryManufacturer} onChange={handleChange} required className={baseInput} />
                </div>
              </div>
            </section>

            {/* Inverter Specifications */}
            <section className="mt-6 rounded-lg bg-slate-50 p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Inverter Specifications</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Make</label>
                  <input type="text" name="inverterMake" value={formData.inverterMake} onChange={handleChange} required className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Rating (KVA)</label>
                  <input type="number" onWheel={(e) => e.preventDefault()} step="any" name="inverterRatingKVA" value={formData.inverterRatingKVA} onChange={handleChange} required className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Voltage (V)</label>
                  <input type="number" onWheel={(e) => e.preventDefault()} name="inverterVoltage" value={formData.inverterVoltage} onChange={handleChange} required className={baseInput} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                  <select name="inverterType" value={formData.inverterType} onChange={handleChange} required className={baseInput}>
                    <option value=""> Select Type </option>
                    <option value="off-grid">Off-grid</option>
                    <option value="on-grid">On-grid</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </section>
          </section>

          {/* Energy Details */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Energy Details</h2>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Target Month of Data</label>
                <div className="flex gap-2">
                  <select name="month" value={formData.month} onChange={handleChange} required className={baseInput}>
                    <option value=""> Select Month </option>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                      <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
                    ))}
                  </select>
                  <select name="year" value={formData.year} onChange={handleChange} required className={baseInput}>
                    {Array.from({ length: 5 }, (_, i) => {
                      const y = new Date().getFullYear() - 2 + i;
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
                <p className="mt-1 text-xs text-slate-500">Selecting this automatically generates the past 12 months below.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Energy Consumption (Target Month)</label>
                <input type="number" step="any" name="monthlyEnergyConsumption" placeholder="kWh" value={formData.monthlyEnergyConsumption} onChange={handleChange} required className={baseInput} />
              </div>
            </div>

            {/* Auto-Generated Actual Solar Generation Grid */}
            <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-100">
              <h3 className="mb-3 text-base font-semibold text-slate-900">Actual Solar Generation (Past 12 Months)</h3>
              <p className="mb-4 text-xs text-slate-500">Provide monthly meter readings. Missing months will be filled with the average of provided values.</p>
              {formData.actualsolargeneration.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {formData.actualsolargeneration.map((row, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-600">{row.month}</label>
                      <input type="number" onWheel={(e) => e.preventDefault()} step="any" name="generation" placeholder="kWh" value={row.generation} onChange={(e) => handleActualSolarChange(index, e)} className={smallInput} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">Please select a Target Month above to generate input fields.</p>
              )}
            </div>

            {/* Auto-Generated Grid Consumption Grid */}
            <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-100">
              <h3 className="mb-3 text-base font-semibold text-slate-900">Grid Consumption (Past 12 Months)</h3>
              <p className="mb-4 text-xs text-slate-500">Provide monthly grid consumption. Missing months will be filled with the average.</p>
              {formData.gridconsumption.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {formData.gridconsumption.map((row, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-600">{row.month}</label>
                      <input type="number" onWheel={(e) => e.preventDefault()} step="any" name="consumption" placeholder="kWh" value={row.consumption} onChange={(e) => handleGridConsumptionChange(index, e)} className={smallInput} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">Please select a Target Month above to generate input fields.</p>
              )}
            </div>
          </section>

          {/* Load Details - Matrix */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Load Details Matrix</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    loadsConnected: [
                      ...prev.loadsConnected,
                      {
                        typeOfLoad: "", // Force user to pick from dropdown
                        numberOfLoad: "",
                        pvConnectedquantity: "", // Exact match to centredata.model.js
                        ratingOfLoad: "",
                        criticalLoad: false,
                        model: "",
                        make: "",
                        grossVolume: "",
                      },
                    ],
                  }));
                }}
                className="inline-flex items-center rounded-md border border-teal-700 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
              >
                + Add Load Row
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs uppercase text-slate-700">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Appliance</th>
                    <th className="px-2 py-3 font-semibold text-center">Total Qty</th>
                    <th className="px-2 py-3 font-semibold text-center text-teal-700">On PV Qty</th>
                    <th className="px-2 py-3 font-semibold">Rating (W)</th>
                    <th className="px-2 py-3 font-semibold">Model</th>
                    <th className="px-2 py-3 font-semibold">Make</th>
                    <th className="px-2 py-3 font-semibold">Vol (L)</th>
                    <th className="px-3 py-3 font-semibold text-center">Critical</th>
                    <th className="px-2 py-3 font-semibold text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.loadsConnected.map((load, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-900 capitalize whitespace-nowrap">
                        {/* Only show dropdown for rows added beyond the default loadOptions length */}
                        {index < loadOptions.length ? (
                          load.typeOfLoad
                        ) : (
                          <select
                            name="typeOfLoad"
                            value={load.typeOfLoad}
                            onChange={(e) => {
                              const selectedLoad = e.target.value;
                              // Auto-check critical status based on selection
                              const isCritical = defaultCriticalLoads.includes(selectedLoad);
                              setFormData((prev) => {
                                const updatedLoads = [...prev.loadsConnected];
                                updatedLoads[index] = { 
                                  ...updatedLoads[index], 
                                  typeOfLoad: selectedLoad, 
                                  criticalLoad: isCritical 
                                };
                                return { ...prev, loadsConnected: updatedLoads };
                              });
                            }}
                            className={smallInput}
                          >
                            <option value="">Select Appliance...</option>
                            {loadOptions.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          name="numberOfLoad"
                          value={load.numberOfLoad}
                          onChange={(e) => handleLoadChange(index, e)}
                          className={smallInput + " text-center w-16 mx-auto"}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          name="pvConnectedquantity"
                          value={load.pvConnectedquantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const total = parseInt(load.numberOfLoad) || 0;
                            if (val > total && total > 0) {
                              alert("PV Connected Quantity cannot exceed Total Quantity");
                              return;
                            }
                            handleLoadChange(index, e);
                          }}
                          className={smallInput + " text-center w-16 mx-auto border-teal-200 bg-teal-50/30"}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          name="ratingOfLoad"
                          value={load.ratingOfLoad}
                          onChange={(e) => handleLoadChange(index, e)}
                          className={smallInput + " w-20"}
                          placeholder="W"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" name="model" value={load.model} onChange={(e) => handleLoadChange(index, e)} className={smallInput + " w-24"} placeholder="Model" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" name="make" value={load.make} onChange={(e) => handleLoadChange(index, e)} className={smallInput + " w-24"} placeholder="Make" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" name="grossVolume" value={load.grossVolume} onChange={(e) => handleLoadChange(index, e)} className={smallInput + " w-16"} placeholder="L" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          name="criticalLoad"
                          checked={load.criticalLoad}
                          onChange={(e) => handleLoadChange(index, e)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        {/* Only allow deletion for newly added rows */}
                        {index >= loadOptions.length && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.loadsConnected.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, loadsConnected: updated }));
                            }}
                            className="text-red-500 hover:text-red-700 font-bold px-2"
                            title="Remove Row"
                          >
                            ✕
                          </button>
                        )}
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
                <input type="checkbox" name="gridSupply" checked={formData.additionalInfo.gridSupply} onChange={handleAdditionalInfoChange} className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Involvement of CREDA</label>
                <input type="checkbox" name="InvolvementofCREDA" checked={formData.additionalInfo.InvolvementofCREDA} onChange={handleAdditionalInfoChange} className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Grid Supply Quality</label>
                <input type="text" name="gridsupplyQuality" placeholder="e.g. good, poor" value={formData.additionalInfo.gridsupplyQuality} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Supply Phase</label>
                <select name="Supply" value={formData.additionalInfo.Supply} onChange={handleAdditionalInfoChange} className={baseInput}>
                  <option value="">Select Phase</option>
                  <option value="1 Phase">1 Phase</option>
                  <option value="3 Phase">3 Phase</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">No. of Beds</label>
                <input type="number" onWheel={(e) => e.preventDefault()} name="noofBeds" placeholder="Count" value={formData.additionalInfo.noofBeds} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">IPD Admissions / Month</label>
                <input type="number" onWheel={(e) => e.preventDefault()} name="noofIPDAdmissionperMonth" placeholder="Count" value={formData.additionalInfo.noofIPDAdmissionperMonth} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">OPD Daily</label>
                <input type="number" onWheel={(e) => e.preventDefault()} name="noofOPDdaily" placeholder="Count" value={formData.additionalInfo.noofOPDdaily} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Deliveries / Month</label>
                <input type="number" onWheel={(e) => e.preventDefault()} name="noofdeliveryperMonth" placeholder="Count" value={formData.additionalInfo.noofdeliveryperMonth} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Solar Failure Freq.</label>
                <input type="text" name="failureFrequencyofsolarPanels" placeholder="e.g. monthly" value={formData.additionalInfo.failureFrequencyofsolarPanels} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Battery Water Freq.</label>
                <input type="text" name="frequencyofchangingbatteryWater" placeholder="e.g. bi-monthly" value={formData.additionalInfo.frequencyofchangingbatteryWater} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Backup till Sunrise</label>
                <input type="text" name="batterybackuptillSunrise" placeholder="e.g. yes, no" value={formData.additionalInfo.batterybackuptillSunrise} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Solar Repair Time</label>
                <input type="text" name="resolutionTimeforSolarPanelRepairs" placeholder="e.g. 1-2 days" value={formData.additionalInfo.resolutionTimeforSolarPanelRepairs} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fault Downtime</label>
                <input type="text" name="downtimeduringFaults" placeholder="e.g. 2-3 hours" value={formData.additionalInfo.downtimeduringFaults} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Maintenance Freq.</label>
                <input type="text" name="panelmaintenanceFrequency" placeholder="e.g. monthly" value={formData.additionalInfo.panelmaintenanceFrequency} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Daytime Load Tripping</label>
                <input type="text" name="anyloadtrippingduringtheDay" placeholder="e.g. yes, occasionally" value={formData.additionalInfo.anyloadtrippingduringtheDay} onChange={handleAdditionalInfoChange} className={baseInput} />
              </div>
            </div>
          </section>

          {/* Remarks */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Remarks</h2>
            <textarea name="remarks" placeholder="Enter Remarks" value={formData.remarks} onChange={handleChange} rows={3} className={baseInput} />
          </section>

          {/* Site Photos */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Site Photos</h2>
            <p className="mb-4 text-xs text-slate-500">Upload photos of each component. Optional but recommended.</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Site Image", name: "siteImage" },
                { label: "Solar Panel Image", name: "panelImage" },
                { label: "Panel Rating Nameplate", name: "panelRatingImage" },
                { label: "Battery Image", name: "batteryImage" },
                { label: "Battery Rating Nameplate", name: "batteryRatingImage" },
                { label: "Inverter Image", name: "inverterImage" },
                { label: "Inverter Rating Nameplate", name: "inverterRatingImage" },
              ].map((imgField) => (
                <div key={imgField.name}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{imgField.label}</label>
                  <input type="file" accept="image/*" onChange={handleImageChange(imgField.name)} className={fileInputClass} />
                </div>
              ))}
            </div>
          </section>

          {/* General Upload File */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Upload General File</h2>
            <input type="file" name="uploadFile" onChange={handleFileChange} className={fileInputClass} />
          </section>

          {/* Submit */}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 text-lg rounded-md font-medium text-white shadow-sm transition-colors duration-200 ${
                isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0c1822] hover:bg-teal-800 focus:ring-2 focus:ring-offset-2 focus:ring-teal-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Data'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default DataEntry;