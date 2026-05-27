import { asyncHandler }          from "../utils/asyncHandler.js";
import { ApiError }              from "../utils/ApiError.js";
import { ApiResponse }           from "../utils/ApiResponse.js";
import { CentreData }            from "../models/centredata.model.js";
import { uploadToCloudinary, uploadRawToCloudinary } from "../utils/cloudinary.js";
import fs                        from "fs";
import axios                     from "axios";

const getLast12MonthKeys = (targetMonth) => {
  const [yyyy, mm] = targetMonth.split("-").map(Number);
  const keys = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(yyyy, mm - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
  }
  return keys; // oldest → newest, 12 entries
};

const fillMissingWithAverage = (provided, monthKeys, valueField) => {
  const lookup = {};
  for (const entry of provided) {
    if (entry.month && entry[valueField] !== "" && entry[valueField] != null) {
      lookup[entry.month] = Number(entry[valueField]);
    }
  }

  const providedValues = Object.values(lookup).filter((v) => !isNaN(v) && v >= 0);
  const avg = providedValues.length > 0
      ? providedValues.reduce((s, v) => s + v, 0) / providedValues.length
      : 0;

  return monthKeys.map((key) => ({
    month: key,
    [valueField]: (lookup[key] !== undefined && !isNaN(lookup[key])) 
      ? lookup[key] 
      : Math.round(avg * 100) / 100,
  }));
};

const fetchIdealSolarGeneration = async (
  latitude,
  longitude,
  pvRatingW,    // individual panel watts, e.g. 315
  noOfPanels,   // e.g. 30
  targetMonth,  // "YYYY-MM"
  dateOfInstallation
) => {
  const totalKwp = (pvRatingW * noOfPanels) / 1000;  // e.g. 9.45 kWp

  const monthKeys = getLast12MonthKeys(targetMonth);
  const startDate = `${monthKeys[0]}-01`;
  const [ey, em]  = monthKeys[11].split("-").map(Number);
  const lastDay   = new Date(ey, em, 0).getDate();
  const endDate   = `${monthKeys[11]}-${String(lastDay).padStart(2, "0")}`;

  const response = await axios.get(
    "https://archive-api.open-meteo.com/v1/archive",
    {
      params: {
        latitude,
        longitude,
        start_date: startDate,
        end_date:   endDate,
        daily:      "shortwave_radiation_sum",
        timezone:   "Asia/Kolkata",
      },
      timeout: 15000,
    }
  );

  const { time, shortwave_radiation_sum } = response.data.daily;

  // Aggregate daily MJ/m² → monthly MJ/m²
  const monthlyMJ = {};
  time.forEach((dateStr, i) => {
    const key = dateStr.slice(0, 7);
    monthlyMJ[key] = (monthlyMJ[key] ?? 0) + (shortwave_radiation_sum[i] ?? 0);
  });

  const performanceRatio = 0.75;
  const deratingfactor = 0.88;
  const SoilingFactor =  0.92;
  const mismatchFactor   = 0.97;

  const installDate = dateOfInstallation ? new Date(dateOfInstallation) : null;
  const now = new Date();
  const years = installDate
    ? Math.max(0, now.getFullYear() - installDate.getFullYear())
    : 5;

  const degradationFactor = 1 - (0.007 * years);

  const effectiveefficiency = performanceRatio * deratingfactor * SoilingFactor * mismatchFactor * degradationFactor;


  return monthKeys.map((key) => {
    const irr_kWh  = (monthlyMJ[key] ?? 0) / 3.6;          // MJ → kWh/m²
    const generation = irr_kWh * totalKwp * effectiveefficiency;
    return {
      month:      key,
      generation: Math.round(generation * 100) / 100,
    };
  });
};

const uploadFile = async (file) => {
  if (!file?.path) return "";
  try {
    return await uploadToCloudinary(file.path);
  } catch (err) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new ApiError(500, `File upload failed: ${err.message}`);
  }
};

const uploadMainFile = async (file) => {
  if (!file?.path) return "";
  try {
    return await uploadRawToCloudinary(file.path);
  } catch (err) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new ApiError(500, `Reference file upload failed: ${err.message}`);
  }
};

const parseJsonArray = (raw, fieldName) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed;
  } catch {
    throw new ApiError(400, `${fieldName} must be a valid JSON array string`);
  }
};

const addCentreData = asyncHandler(async (req, res) => {
  const {
    centreName, district, latitude, longitude, month,
    monthlyEnergyConsumption,

    pvRating, noOfPanels, pvSystemake, pvVoltage, dateOfInstallation,

    batteryCount, batteryVoltage, batteryCapacityAh, batteryManufacturer,

    inverterMake, inverterRatingKVA, inverterVoltage, inverterType,

    gridSupply, gridsupplyQuality, InvolvementofCREDA, Supply,
    noofBeds, noofIPDAdmissionperMonth, noofOPDdaily, noofdeliveryperMonth,
    failureFrequencyofsolarPanels, frequencyofchangingbatteryWater,
    batterybackuptillSunrise, resolutionTimeforSolarPanelRepairs,
    downtimeduringFaults, panelmaintenanceFrequency, anyloadtrippingduringtheDay,

    loadsConnected,       // [{ typeOfLoad, numberOfLoad, ratingOfLoad, pvConnected, criticalLoad, model, grossVolume }]
    actualsolargeneration, // [{ month: "YYYY-MM", generation: Number }] — optional, ≤12 entries
    gridconsumption,       // [{ month: "YYYY-MM", consumption: Number }] — optional, ≤12 entries

    remarks,
  } = req.body;

  const required = {
    centreName, district, latitude, longitude, month,
    monthlyEnergyConsumption,
    pvRating, noOfPanels, pvSystemake, pvVoltage, dateOfInstallation,
    batteryCount, batteryVoltage, batteryCapacityAh, batteryManufacturer,
    inverterMake, inverterRatingKVA, inverterVoltage, inverterType,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => v === undefined || v === null || String(v).trim() === "")
    .map(([k]) => k);

  if (missing.length) {
    Object.values(req.files || {}).flat().forEach((f) => {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    });
    throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
  }

  //Upload all photos in parallel
  const files = req.files || {};
  const [
    mainFileUrl,
    siteImageUrl,
    panelImageUrl,
    panelRatingImageUrl,
    batteryImageUrl,
    batteryRatingImageUrl,
    inverterImageUrl,
    inverterRatingImageUrl,
  ] = await Promise.all([
    uploadMainFile(files.file?.[0]),
    uploadFile(files.siteImage?.[0]),
    uploadFile(files.panelImage?.[0]),
    uploadFile(files.panelRatingImage?.[0]),
    uploadFile(files.batteryImage?.[0]),
    uploadFile(files.batteryRatingImage?.[0]),
    uploadFile(files.inverterImage?.[0]),
    uploadFile(files.inverterRatingImage?.[0]),
  ]);

  //Parse array fields
  const parsedLoads       = parseJsonArray(loadsConnected,        "loadsConnected");
  const rawActualSolar    = parseJsonArray(actualsolargeneration,  "actualsolargeneration");
  const rawGridConsump    = parseJsonArray(gridconsumption,        "gridconsumption");

  //Build 12-month key list 
  const monthKeys = getLast12MonthKeys(month.trim().toLowerCase());

  //Fill missing months with average
  // actualSolarGeneration: field is "generation"
  const filledActualSolar = fillMissingWithAverage(
    rawActualSolar,
    monthKeys,
    "generation"
  );

  // gridConsumption: field is "consumption"
  const filledGridConsumption = fillMissingWithAverage(
    rawGridConsump,
    monthKeys,
    "consumption"
  );

  let idealSolarGeneration = [];
  try {
    idealSolarGeneration = await fetchIdealSolarGeneration(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(pvRating),    // individual panel watts, e.g. 315
      parseInt(noOfPanels, 10),
      month.trim(),
      dateOfInstallation
    );
  } catch (err) {
    console.error("open-meteo fetch failed (non-fatal):", err.message);
    idealSolarGeneration = monthKeys.map((k) => ({ month: k, generation: 0 }));
  }

  const centreData = await CentreData.create({
    centreName:               centreName.trim().toLowerCase(),
    district:                 district.trim().toLowerCase(),
    latitude:                 parseFloat(latitude),
    longitude:                parseFloat(longitude),
    month:                    month.trim().toLowerCase(),
    monthlyEnergyConsumption: parseFloat(monthlyEnergyConsumption),

    // Solar panel
    pvRating:          parseFloat(pvRating),      // stored as TOTAL kW
    noOfPanels:        parseInt(noOfPanels, 10),
    pvSystemake:       pvSystemake.trim().toLowerCase(),  // = manufacturer (same field)
    pvVoltage:         parseFloat(pvVoltage),
    dateOfInstallation: new Date(dateOfInstallation),

    // Battery
    battery: {
      count:        parseInt(batteryCount, 10),
      voltage:      parseFloat(batteryVoltage),
      capacityAh:   parseInt(batteryCapacityAh, 10),
      Manufacturer: batteryManufacturer.trim().toLowerCase(),
    },

    // Inverter
    inverter: {
      make:     inverterMake.trim().toLowerCase(),
      inverterRatingKVA: parseFloat(inverterRatingKVA),
      voltage:  parseFloat(inverterVoltage),
      type:     inverterType.trim().toLowerCase(),
    },

    // Loads
    loadsConnected: parsedLoads,

    // Images
    imagefile: mainFileUrl,
    images: {
      siteImageUrl,
      panelImageUrl,
      panelratingImageUrl:    panelRatingImageUrl,
      batteryImageUrl,
      batteryratingImageUrl:  batteryRatingImageUrl,
      inverterImageUrl,
      inverterRatingImageUrl,
    },

    // Energy data
    solargeneration:      idealSolarGeneration,   // ideal from open-meteo
    actualsolargeneration: filledActualSolar,       // user-provided + avg-filled
    gridconsumption:       filledGridConsumption,   // user-provided + avg-filled

    // Additional info
    additionalInfo: {
      gridSupply:                         gridSupply === "true" || gridSupply === true,
      gridsupplyQuality:                  (gridsupplyQuality  || "").trim().toLowerCase(),
      InvolvementofCREDA:                 InvolvementofCREDA === "true" || InvolvementofCREDA === true,
      Supply:                             Supply || undefined,
      noofBeds:                           noofBeds                    ? parseInt(noofBeds, 10)                    : undefined,
      noofIPDAdmissionperMonth:           noofIPDAdmissionperMonth    ? parseInt(noofIPDAdmissionperMonth, 10)    : undefined,
      noofOPDdaily:                       noofOPDdaily                ? parseInt(noofOPDdaily, 10)                : undefined,
      noofdeliveryperMonth:               noofdeliveryperMonth        ? parseInt(noofdeliveryperMonth, 10)        : undefined,
      failureFrequencyofsolarPanels:      (failureFrequencyofsolarPanels     || "").trim().toLowerCase(),
      frequencyofchangingbatteryWater:    (frequencyofchangingbatteryWater   || "").trim().toLowerCase(),
      batterybackuptillSunrise:           (batterybackuptillSunrise           || "").trim().toLowerCase(),
      resolutionTimeforSolarPanelRepairs: (resolutionTimeforSolarPanelRepairs || "").trim().toLowerCase(),
      downtimeduringFaults:               (downtimeduringFaults               || "").trim().toLowerCase(),
      panelmaintenanceFrequency:          (panelmaintenanceFrequency          || "").trim().toLowerCase(),
      anyloadtrippingduringtheDay:        (anyloadtrippingduringtheDay        || "").trim().toLowerCase(),
    },

    remarks: (remarks || "").trim(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, centreData, "Centre data added successfully"));
});

const getCentreDataByDistrict = asyncHandler(async (req, res) => {
  const { district } = req.params;

  if (!district?.trim()) {
    throw new ApiError(400, "District parameter is required");
  }

  const centres = await CentreData.find({
    district: district.trim().toLowerCase(),
  }).sort({ createdAt: -1 });

  if (!centres.length) {
    throw new ApiError(404, `No centre data found for district: ${district}`);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: centres.length, centres },
        `Centres in district '${district}' fetched successfully`
      )
    );
});

const updateSolarGeneration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const centre = await CentreData.findById(id);
  if (!centre) throw new ApiError(404, "Centre not found");

  let idealSolarGeneration;
  try {
    idealSolarGeneration = await fetchIdealSolarGeneration(
      centre.latitude,
      centre.longitude,
      centre.pvRating,     // individual panel watts
      centre.noOfPanels,
      centre.month
    );
  } catch (err) {
    throw new ApiError(502, `Solar API error: ${err.message}`);
  }

  centre.solargeneration = idealSolarGeneration;
  await centre.save({ validateModifiedOnly: true });

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        centreId:        centre._id,
        centreName:      centre.centreName,
        solargeneration: centre.solargeneration,
      }, "Ideal solar generation updated successfully")
    );
});
const updateCentreData = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const centre = await CentreData.findById(id);

  if (!centre) {
    throw new ApiError(404, "Centre data not found");
  }

  const files = req.files || {};

  // Upload new files if provided
  const [
    mainFileUrl,
    siteImageUrl,
    panelImageUrl,
    panelRatingImageUrl,
    batteryImageUrl,
    batteryRatingImageUrl,
    inverterImageUrl,
    inverterRatingImageUrl,
  ] = await Promise.all([
    files.file?.[0] ? uploadMainFile(files.file[0]) : null,
    files.siteImage?.[0] ? uploadFile(files.siteImage[0]) : null,
    files.panelImage?.[0] ? uploadFile(files.panelImage[0]) : null,
    files.panelRatingImage?.[0] ? uploadFile(files.panelRatingImage[0]) : null,
    files.batteryImage?.[0] ? uploadFile(files.batteryImage[0]) : null,
    files.batteryRatingImage?.[0] ? uploadFile(files.batteryRatingImage[0]) : null,
    files.inverterImage?.[0] ? uploadFile(files.inverterImage[0]) : null,
    files.inverterRatingImage?.[0] ? uploadFile(files.inverterRatingImage[0]) : null,
  ]);

  // Parse arrays if sent
  const parsedLoads = req.body.loadsConnected
    ? parseJsonArray(req.body.loadsConnected, "loadsConnected")
    : centre.loadsConnected;

  const parsedActualSolar = req.body.actualsolargeneration
    ? parseJsonArray(req.body.actualsolargeneration, "actualsolargeneration")
    : centre.actualsolargeneration;

  const parsedGridConsumption = req.body.gridconsumption
    ? parseJsonArray(req.body.gridconsumption, "gridconsumption")
    : centre.gridconsumption;

  // Basic fields
  centre.centreName = req.body.centreName
    ? req.body.centreName.trim().toLowerCase()
    : centre.centreName;

  centre.district = req.body.district
    ? req.body.district.trim().toLowerCase()
    : centre.district;

  centre.latitude = req.body.latitude
    ? parseFloat(req.body.latitude)
    : centre.latitude;

  centre.longitude = req.body.longitude
    ? parseFloat(req.body.longitude)
    : centre.longitude;

  centre.month = req.body.month
    ? req.body.month.trim()
    : centre.month;

  centre.monthlyEnergyConsumption = req.body.monthlyEnergyConsumption
    ? parseFloat(req.body.monthlyEnergyConsumption)
    : centre.monthlyEnergyConsumption;

  // Solar panel
  centre.pvRating = req.body.pvRating
    ? parseFloat(req.body.pvRating)
    : centre.pvRating;

  centre.noOfPanels = req.body.noOfPanels
    ? parseInt(req.body.noOfPanels, 10)
    : centre.noOfPanels;

  centre.pvSystemake = req.body.pvSystemake
    ? req.body.pvSystemake.trim().toLowerCase()
    : centre.pvSystemake;

  centre.pvVoltage = req.body.pvVoltage
    ? parseFloat(req.body.pvVoltage)
    : centre.pvVoltage;

  centre.dateOfInstallation = req.body.dateOfInstallation
    ? new Date(req.body.dateOfInstallation)
    : centre.dateOfInstallation;

  // Battery
  centre.battery.count = req.body.batteryCount
    ? parseInt(req.body.batteryCount, 10)
    : centre.battery.count;

  centre.battery.voltage = req.body.batteryVoltage
    ? parseFloat(req.body.batteryVoltage)
    : centre.battery.voltage;

  centre.battery.capacityAh = req.body.batteryCapacityAh
    ? parseInt(req.body.batteryCapacityAh, 10)
    : centre.battery.capacityAh;

  centre.battery.Manufacturer = req.body.batteryManufacturer
    ? req.body.batteryManufacturer.trim().toLowerCase()
    : centre.battery.Manufacturer;

  // Inverter
  centre.inverter.make = req.body.inverterMake
    ? req.body.inverterMake.trim().toLowerCase()
    : centre.inverter.make;

  centre.inverter.inverterRatingKVA = req.body.inverterRatingKVA
    ? parseFloat(req.body.inverterRatingKVA)
    : centre.inverter.inverterRatingKVA;

  centre.inverter.voltage = req.body.inverterVoltage
    ? parseFloat(req.body.inverterVoltage)
    : centre.inverter.voltage;

  centre.inverter.type = req.body.inverterType
    ? req.body.inverterType.trim().toLowerCase()
    : centre.inverter.type;

  // Loads
  centre.loadsConnected = parsedLoads;

  // Images
  if (mainFileUrl) centre.imagefile = mainFileUrl;

  if (siteImageUrl) {
    centre.images.siteImageUrl = siteImageUrl;
  }

  if (panelImageUrl) {
    centre.images.panelImageUrl = panelImageUrl;
  }

  if (panelRatingImageUrl) {
    centre.images.panelratingImageUrl = panelRatingImageUrl;
  }

  if (batteryImageUrl) {
    centre.images.batteryImageUrl = batteryImageUrl;
  }

  if (batteryRatingImageUrl) {
    centre.images.batteryratingImageUrl = batteryRatingImageUrl;
  }

  if (inverterImageUrl) {
    centre.images.inverterImageUrl = inverterImageUrl;
  }

  if (inverterRatingImageUrl) {
    centre.images.inverterRatingImageUrl = inverterRatingImageUrl;
  }

  // Energy Data
  centre.actualsolargeneration = parsedActualSolar;
  centre.gridconsumption = parsedGridConsumption;

  // Remarks
  centre.remarks = req.body.remarks
    ? req.body.remarks.trim()
    : centre.remarks;

  // Additional Info
  centre.additionalInfo = {
    ...centre.additionalInfo,

    gridSupply:
      req.body.gridSupply !== undefined
        ? req.body.gridSupply === "true" || req.body.gridSupply === true
        : centre.additionalInfo.gridSupply,

    gridsupplyQuality:
      req.body.gridsupplyQuality || centre.additionalInfo.gridsupplyQuality,

    InvolvementofCREDA:
      req.body.InvolvementofCREDA !== undefined
        ? req.body.InvolvementofCREDA === "true" ||
          req.body.InvolvementofCREDA === true
        : centre.additionalInfo.InvolvementofCREDA,

    Supply:
      req.body.Supply || centre.additionalInfo.Supply,

    noofBeds:
      req.body.noofBeds
        ? parseInt(req.body.noofBeds, 10)
        : centre.additionalInfo.noofBeds,

    noofIPDAdmissionperMonth:
      req.body.noofIPDAdmissionperMonth
        ? parseInt(req.body.noofIPDAdmissionperMonth, 10)
        : centre.additionalInfo.noofIPDAdmissionperMonth,

    noofOPDdaily:
      req.body.noofOPDdaily
        ? parseInt(req.body.noofOPDdaily, 10)
        : centre.additionalInfo.noofOPDdaily,

    noofdeliveryperMonth:
      req.body.noofdeliveryperMonth
        ? parseInt(req.body.noofdeliveryperMonth, 10)
        : centre.additionalInfo.noofdeliveryperMonth,
  };

  await centre.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      centre,
      "Centre data updated successfully"
    )
  );
});

// Add this function to centredata.controller.js

const getGhgReductionByDistrict = asyncHandler(async (req, res) => {
  // Emission factor: 0.82 kg CO₂ per kWh (Indian grid average)
  const EMISSION_FACTOR_KG_PER_KWH = 0.82;

  const pipeline = [
    // Unwind the actualsolargeneration array to get each monthly record
    { $unwind: "$solargeneration" },
    // Group by district, summing the generation values
    {
      $group: {
        _id: "$district",
        totalGenerationKwh: { $sum: "$solargeneration.generation" }
      }
    },
    // Convert kWh → kg CO₂ → metric tonnes
    {
      $project: {
        district: "$_id",
        ghgReductionTonnes: {
          $round: [
            {
              $divide: [
                { $multiply: ["$totalGenerationKwh", EMISSION_FACTOR_KG_PER_KWH] },
                1000
              ]
            },
            2
          ]
        }
      }
    }
  ];

  const results = await CentreData.aggregate(pipeline);

  // Format as { districtName: tonnes }
  const reductionMap = {};
  results.forEach(r => {
    reductionMap[r.district] = r.ghgReductionTonnes;
  });

  return res.status(200).json(
    new ApiResponse(200, reductionMap, "GHG reduction data fetched")
  );
});

const getCentreWiseGhgReduction = asyncHandler(async (req, res) => {
  const EMISSION_FACTOR_KG_PER_KWH = 0.82;

  const pipeline = [
    { $unwind: "$solargeneration" },
    {
      $group: {
        _id: {
          centreId: "$_id",
          centreName: "$centreName",
          district: "$district"
        },
        totalGenerationKwh: { $sum: "$solargeneration.generation" }
      }
    },
    {
      $project: {
        centreId: "$_id.centreId",
        centreName: "$_id.centreName",
        district: "$_id.district",
        ghgReductionTonnes: {
          $round: [
            {
              $divide: [
                { $multiply: ["$totalGenerationKwh", EMISSION_FACTOR_KG_PER_KWH] },
                1000
              ]
            },
            2
          ]
        }
      }
    },
    { $sort: { district: 1, centreName: 1 } }
  ];

  const results = await CentreData.aggregate(pipeline);
  return res.status(200).json(new ApiResponse(200, results, "Centre-wise GHG reduction data"));
});

// 1. Summary stats for ImpactSection
const getAuditSummary = asyncHandler(async (req, res) => {
  const totalFacilities = await CentreData.countDocuments();
  const auditedDistricts = await CentreData.distinct('district');
  const TOTAL_DISTRICTS_IN_STATE = 33;
  return res.status(200).json(
    new ApiResponse(200, {
      totalFacilities,
      auditedDistricts: auditedDistricts.length,
      pendingAudits: 40 - totalFacilities,
      totalDistricts: TOTAL_DISTRICTS_IN_STATE
    }, "Audit summary fetched")
  );
});

// 2. Get list of districts that have audit data (for map coloring)
const getAuditedDistricts = asyncHandler(async (req, res) => {
  const districts = await CentreData.distinct('district');
  return res.status(200).json(new ApiResponse(200, districts, "Audited districts"));
});

export { 
  addCentreData,
  getCentreDataByDistrict,
  updateSolarGeneration,
  updateCentreData,
  getGhgReductionByDistrict,
  getCentreWiseGhgReduction,
  getAuditSummary,
  getAuditedDistricts
};