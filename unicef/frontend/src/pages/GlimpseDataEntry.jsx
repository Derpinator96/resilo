import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import divisions from '../datas/Divisions.js';
import chhattisgarhDistrictsHealthCentres from '../datas/HealthCentres';

export default function GlimpseDataEntry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    division: '',
    district: '',
    facilityName: '',
    facilityType: '',
    latitude: '',
    longitude: '',
    surveyDate: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableHealthCentres, setAvailableHealthCentres] = useState([]);

  // Update districts when division changes
  useEffect(() => {
    if (formData.division && divisions[formData.division]) {
      setAvailableDistricts(divisions[formData.division]);
      setFormData(prev => ({ ...prev, district: '', facilityName: '' }));
      setAvailableHealthCentres([]);
    } else {
      setAvailableDistricts([]);
      setAvailableHealthCentres([]);
    }
  }, [formData.division]);

  // Update health centres when district changes
  useEffect(() => {
    if (formData.district && chhattisgarhDistrictsHealthCentres[formData.district]) {
      const centres = chhattisgarhDistrictsHealthCentres[formData.district];
      setAvailableHealthCentres(centres);
      setFormData(prev => ({ ...prev, facilityName: '' }));
    } else {
      setAvailableHealthCentres([]);
    }
  }, [formData.district]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDivisionChange = (e) => {
    const division = e.target.value;
    setFormData(prev => ({ ...prev, division, district: '', facilityName: '' }));
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setFormData(prev => ({ ...prev, district, facilityName: '' }));
  };

  const handleFacilityChange = (e) => {
    const facilityName = e.target.value;
    setFormData(prev => ({ ...prev, facilityName }));
    // Auto-detect facility type from name
    if (facilityName.toLowerCase().includes('phc')) {
      setFormData(prev => ({ ...prev, facilityType: 'PHC' }));
    } else if (facilityName.toLowerCase().includes('chc')) {
      setFormData(prev => ({ ...prev, facilityType: 'CHC' }));
    } else if (facilityName.toLowerCase().includes('ch')) {
      setFormData(prev => ({ ...prev, facilityType: 'CH' }));
    } else if (facilityName.toLowerCase().includes('uhpc')) {
      setFormData(prev => ({ ...prev, facilityType: 'UPHC' }));
    }
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error('Please select an image');
      return;
    }
    if (!formData.division || !formData.district || !formData.facilityName) {
      toast.error('Division, District and Health Centre are required');
      return;
    }

    const data = new FormData();
    data.append('image', imageFile);
    data.append('division', formData.division);
    data.append('district', formData.district);
    data.append('facilityName', formData.facilityName);
    data.append('facilityType', formData.facilityType);
    if (formData.latitude) data.append('latitude', formData.latitude);
    if (formData.longitude) data.append('longitude', formData.longitude);
    if (formData.surveyDate) data.append('surveyDate', formData.surveyDate);

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/glimpses/upload`,
        data,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      if (response.data.success) {
        toast.success('Glimpse uploaded successfully!');
        navigate('/glimpses');
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <h1 className="text-2xl font-bold text-[#011425] mb-2">Upload New Glimpse</h1>
            <p className="text-gray-500 mb-6">Add a facility photo with location details</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Division Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleDivisionChange}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30"
                >
                  <option value="">Select Division</option>
                  {Object.keys(divisions).map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              {/* District Dropdown (enabled only if division selected) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleDistrictChange}
                  required
                  disabled={!formData.division}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select District</option>
                  {availableDistricts.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* Health Centre Dropdown (enabled only if district selected) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Centre *</label>
                <select
                  name="facilityName"
                  value={formData.facilityName}
                  onChange={handleFacilityChange}
                  required
                  disabled={!formData.district}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Health Centre</option>
                  {availableHealthCentres.map(centre => (
                    <option key={centre} value={centre}>{centre}</option>
                  ))}
                </select>
              </div>

              {/* Facility Type (auto-filled, but can be overridden) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facility Type (PHC/CHC/DH)</label>
                <input
                  type="text"
                  name="facilityType"
                  value={formData.facilityType}
                  onChange={handleChange}
                  placeholder="e.g., PHC, CHC, DH"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30"
                />
              </div>

              {/* Latitude & Longitude */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g., 21.1100"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g., 81.5200"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30"
                  />
                </div>
              </div>

              {/* Survey Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Survey Date</label>
                <input
                  type="date"
                  name="surveyDate"
                  value={formData.surveyDate}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#011425] text-white py-2.5 rounded-lg font-medium hover:bg-[#1f4959] transition disabled:opacity-60 text-sm"
                >
                  {loading ? 'Uploading...' : 'Upload Glimpse'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/glimpses')}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}