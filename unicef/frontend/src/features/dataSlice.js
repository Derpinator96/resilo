import { createSlice } from '@reduxjs/toolkit';
import chhattisgarhDistricts from '../datas/Districts.js';
import chhattisgarhDistrictsHealthCentres from '../datas/HealthCentres.js';
 
const dataSlice = createSlice({
  name: 'data',
  initialState: {
    districts: chhattisgarhDistricts,
    healthCentres: chhattisgarhDistrictsHealthCentres,
  },
  reducers: {},
});
 
export default dataSlice.reducer;