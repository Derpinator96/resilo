import mongoose, { model } from 'mongoose';

const loadSchema = new mongoose.Schema({
  typeOfLoad: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  numberOfLoad: {
    type: Number,
    required: true,
    min: 0
  },
  ratingOfLoad: {
    type: Number,
    required: true,
    min: 0
  },
  pvConnectedquantity: {
    type: Number,
    default: 0,
    min: 0
  },
  criticalLoad: {
    type: Boolean,
    default: false
  },
  grossVolume: {
    type: Number,
    default: null},
  model: {
    type: String,
    trim: true
  },
  make: {
    type: String,
    trim: true
  }
});

const solarGenerationSchema = new mongoose.Schema({
  month: {
    type: String, // e.g. "2026-03" or "March 2026"
    required: true,
    trim: true
  },
  generation: {
    type: Number, // kWh
    required: true,
    min: 0
  }
}, { _id: false });

const actualsolarGenerationSchema = new mongoose.Schema({
  month: {
    type: String, 
    required: true,
    trim: true
  },
  generation: {
    type: Number, 
    required: true,
    min: 0
  }
}, { _id: false });

const gridConsumptionSchema = new mongoose.Schema({
  month: {
    type: String, 
    required: true,
    trim: true
  },
  consumption: {
    type: Number, 
    required: true,
    min: 0
  }
}, { _id: false });


const batterySchema = new mongoose.Schema({
  count: { type: Number, required: true, min: 1 },   
  voltage: { type: Number, required: true, min: 1 }, 
  capacityAh: { type: Number, required: true, min: 1 },
  Manufacturer: { type: String, required: true, trim: true, lowercase: true }
}, { _id: false });

const inverterSchema = new mongoose.Schema({
  make: { type: String, required: true, trim: true, lowercase: true },
  inverterRatingKVA: { type: Number, required: true, min: 0 },
  voltage: { type: Number, required: true, min: 1 },
  type: { type: String, enum: ["off-grid", "on-grid", "hybrid"], required: true }
}, { _id: false });

const imagesSchema = new mongoose.Schema({
  siteImageUrl: { type: String, required: true, trim: true },
  panelImageUrl: { type: String, required: true, trim: true },
  panelratingImageUrl: { type: String, required: true, trim: true },
  batteryImageUrl: { type: String, required: true, trim: true },
  batteryratingImageUrl: { type: String, required: true, trim: true },
  inverterImageUrl: { type: String, required: true, trim: true },
  inverterRatingImageUrl: { type: String, required: true, trim: true }
}, { _id: false });

const additionalInfoSchema = new mongoose.Schema({
  gridSupply: { type: Boolean, default: true },
  gridsupplyQuality: { type: String, trim: true, lowercase: true },
  InvolvementofCREDA: { type: Boolean, default: false },
  Supply: { type: String, trim: true, lowercase: true, enum: ["1 phase", "3 phase"] },
  noofBeds: { type: Number, min: 0 },
  noofIPDAdmissionperMonth: { type: Number, min: 0 },
  noofOPDdaily: { type: Number, min: 0 },
  noofdeliveryperMonth: { type: Number, min: 0 },
  failureFrequencyofsolarPanels: { type: String, trim: true, lowercase: true },
  frequencyofchangingbatteryWater: { type: String, trim: true, lowercase: true },
  batterybackuptillSunrise: { type: String, trim: true, lowercase: true },
  resolutionTimeforSolarPanelRepairs: { type: String, trim: true, lowercase: true },
  downtimeduringFaults: { type: String, trim: true, lowercase: true },
  panelmaintenanceFrequency: { type: String, trim: true, lowercase: true },
  anyloadtrippingduringtheDay: { type: String, trim: true, lowercase: true }
});

const centreDataSchema = new mongoose.Schema({
    centreName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true},
    district: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    latitude: {
        type: Number,
        required: true, 
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
    },
    month: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    monthlyEnergyConsumption: {
        type: Number,
        required: true,
        min: 0
    },
    pvRating: {
        type: Number,
        required: true,
        min: 0
    },
    noOfPanels: {
        type: Number,
        required: true,
        min: 0
    },
    pvSystemake: {
        type: String,
        required: true,
        lowercase: true,
        trim: true 
    },
    pvVoltage: {
        type: Number,
        required: true,
        min: 1
    },
    dateOfInstallation: {
        type: Date,
        required: true
    },
    battery: batterySchema,
    inverter: inverterSchema,
    loadsConnected: {
        type: [loadSchema],
        default: []
    },
    remarks: {
        type: String,
        trim: true  
    },
    imagefile: {
        type: String,
        trim: true  
    },
    images: imagesSchema,
    solargeneration: {
        type:[solarGenerationSchema],
        default: []
    },
    actualsolargeneration: {
        type:[actualsolarGenerationSchema],
        default: []
    },
    gridconsumption: {
        type:[gridConsumptionSchema],
        default: []
    },
    additionalInfo: additionalInfoSchema
},
{
    timestamps: true,
    collection: 'centredatas'
}); 

export const CentreData = mongoose.model("CentreData", centreDataSchema)