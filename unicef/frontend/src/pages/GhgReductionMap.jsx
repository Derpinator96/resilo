import React, { useEffect, useState } from "react";
import axios from "axios";
import DistrictMap from "../components/DistrictMap";

const GhgReductionMap = () => {
  const [ghgData, setGhgData] = useState({});
  const [centreData, setCentreData] = useState([]);
  const [totalReduction, setTotalReduction] = useState(0);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch district-wise
      const districtRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v2/centres/ghg-reduction`,
        { withCredentials: true }
      );
      const normalized = {};
      Object.entries(districtRes.data.data).forEach(([d, val]) => {
        normalized[d.toLowerCase().trim()] = val;
      });
      setGhgData(normalized);
      const total = Object.values(normalized).reduce((s, v) => s + v, 0);
      setTotalReduction(total);

      // Fetch centre-wise
      const centreRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v2/centres/centre-ghg-reduction`,
        { withCredentials: true }
      );
      setCentreData(centreRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const maxReduction = Math.max(...Object.values(ghgData), 0.1);
  const getColor = (reduction) => {
    if (!reduction || reduction === 0) return "#e5e7eb";
    const intensity = Math.min(1, reduction / maxReduction);
    const r = Math.round(217 - (217 - 35) * intensity);
    const g = Math.round(240 - (240 - 132) * intensity);
    const b = Math.round(163 - (163 - 67) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const districtColors = {};
  Object.entries(ghgData).forEach(([district, reduction]) => {
    districtColors[district] = getColor(reduction);
  });

  const tableData = Object.entries(ghgData)
    .map(([d, val]) => ({ district: d.charAt(0).toUpperCase() + d.slice(1), reduction: val.toFixed(2) }))
    .sort((a, b) => b.reduction - a.reduction);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header and refresh */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">District‑wise GHG Emission Reduction</h1>
            <p className="text-gray-600 text-sm">Chhattisgarh – based on actual solar generation from audited health centres</p>
          </div>
          <button onClick={fetchData} className="px-5 py-2 bg-[#011425] text-white rounded-lg hover:bg-teal-800 transition">
            ↻ Refresh Data
          </button>
        </div>

        {/* Total reduction */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6">
          <p className="text-sm text-gray-500 uppercase">Total GHG Reduction (State)</p>
          <p className="text-4xl font-bold text-[#011425]">{totalReduction.toFixed(2)}</p>
          <p className="text-sm text-gray-500">metric tonnes CO₂ equivalent</p>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-8">
          <div className="flex justify-center p-4">
            <div className="w-full max-w-2xl">
              <div className="relative" style={{ paddingBottom: "65%" }}>
                <div className="absolute top-0 left-0 w-full h-full">
                  <DistrictMap districtColors={districtColors} onHover={setHoveredDistrict} />
                </div>
              </div>
            </div>
          </div>
          {hoveredDistrict && (
            <div className="p-2 text-center text-sm text-gray-700 border-t border-gray-100 bg-gray-50">
              {hoveredDistrict}: {ghgData[hoveredDistrict.toLowerCase()]?.toFixed(2) || 0} tonnes CO₂
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-sm mb-8">
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ backgroundColor: "#e5e7eb" }}></div><span>No audit data</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ backgroundColor: "#d9f0a3" }}></div><span>Low reduction</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ backgroundColor: "#78c679" }}></div><span>Medium reduction</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded" style={{ backgroundColor: "#238443" }}></div><span>High reduction</span></div>
        </div>

        {/* Formula Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-8">
          <div className="px-4 py-3 bg-[#011425]">
            <h2 className="text-lg font-semibold text-white">Formula Used</h2>
          </div>
          <div className="p-4 space-y-3 text-sm text-gray-700">
            <p><span className="font-semibold">GHG Reduction (tonnes CO₂) =</span> (Actual Solar Generation in kWh) × Emission Factor ÷ 1000</p>
            <p><span className="font-semibold">Where:</span></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Actual Solar Generation:</span> Sum of monthly generation from audited centres (kWh)</li>
              <li><span className="font-medium">Emission Factor:</span> 0.82 kg CO₂ per kWh (Indian grid average)</li>
              <li><span className="font-medium">Division by 1000:</span> Convert kg to metric tonnes</li>
            </ul>
            <div className="p-2 bg-gray-50 rounded">
              <code className="text-xs">Example: 3,830 kWh × 0.82 ÷ 1000 = 3.14 tonnes CO₂</code>
            </div>
          </div>
        </div>

        {/* District-wise Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-8">
          <div className="px-4 py-3 bg-[#011425]">
            <h2 className="text-lg font-semibold text-white">District-wise Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">S.No.</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">District</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">GHG Reduction (tonnes CO₂)</th></tr>
              </thead>
              <tbody>
                {tableData.map((item, idx) => (
                  <tr key={item.district} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2">{idx+1}</td>
                    <td className="px-4 py-2">{item.district}</td>
                    <td className="px-4 py-2">{item.reduction}</td>
                  </tr>
                ))}
                {tableData.length === 0 && <tr><td colSpan="3" className="text-center py-4">No data yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Centre-wise Table (NEW) */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="px-4 py-3 bg-[#011425] ">
            <h2 className="text-lg font-semibold text-white">Centre-wise GHG Reduction</h2>
            <p className="text-xs text-white mt-1">Individual health facilities across Chhattisgarh</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">S.No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Centre Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">District</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">GHG Reduction (tonnes CO₂)</th>
                </tr>
              </thead>
              <tbody>
                {centreData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      No centre data available. Complete audits first.
                    </td>
                  </tr>
                ) : (
                  centreData.map((centre, idx) => (
                    <tr
                      key={centre.centreId}
                      className={
                        idx % 2 === 0
                          ? "bg-white "
                          : "bg-gray-50 "
                      }
                    >
                      <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {centre.centreName.toUpperCase()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {centre.district.charAt(0).toUpperCase() + centre.district.slice(1)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {centre.ghgReductionTonnes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        </div>

        

        <p className="text-xs text-gray-400 text-center mt-6 pb-4">
          * Emission factor: 0.82 kg CO₂/kWh (CEA & IPCC). Use refresh button after new audit.
        </p>
      </div>
    </div>
  );
};

export default GhgReductionMap;