import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }     from "../utils/ApiError.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { CentreData }   from "../models/centredata.model.js";
import axios            from "axios";

// ─── Solar Forecast ───────────────────────────────────────────────────────────
export const getSolarForecast = asyncHandler(async (req, res) => {
    const { centreName, district } = req.query;

    if (!centreName || !district)
        throw new ApiError(400, "centreName and district are required");

    const centre = await CentreData.findOne({
        centreName: { $regex: new RegExp(`^${centreName.trim()}$`, "i") },
        district:   { $regex: new RegExp(`^${district.trim()}$`, "i") }
    }).select("latitude longitude pvRating noOfPanels centreName district");

    if (!centre) throw new ApiError(404, "Centre not found");

    const hfResp = await axios.post(
        `${process.env.HF_SPACE_URL}/predict`,
        {
            latitude:   centre.latitude,
            longitude:  centre.longitude,
            pvRating:   centre.pvRating,
            noOfPanels: centre.noOfPanels
        },
        { timeout: 30000 }
    );

    return res.status(200).json(
        new ApiResponse(200, {
            centre: {
                name:     centre.centreName,
                district: centre.district
            },
            forecast: hfResp.data
        }, "Solar forecast fetched successfully")
    );
});

// ─── Delivery Equipment ───────────────────────────────────────────────────────
export const getDeliveryEquipment = asyncHandler(async (req, res) => {
    const { centreName, district } = req.query;

    if (!centreName || !district)
        throw new ApiError(400, "centreName and district are required");

    const centre = await CentreData.findOne({
        centreName: { $regex: new RegExp(`^${centreName.trim()}$`, "i") },
        district:   { $regex: new RegExp(`^${district.trim()}$`, "i") }
    }).select("centreName district loadsConnected");

    if (!centre) throw new ApiError(404, "Centre not found");

    const loads = centre.loadsConnected || [];

    const shadowlessLamp = loads.find(l =>
        l.typeOfLoad?.toLowerCase().includes("shadowless") ||
        l.typeOfLoad?.toLowerCase().includes("shadow less") ||
        l.typeOfLoad?.toLowerCase().includes("ot light") ||
        l.typeOfLoad?.toLowerCase().includes("operation theatre lamp")
    );

    const babyWarmer = loads.find(l =>
        l.typeOfLoad?.toLowerCase().includes("baby warmer") ||
        l.typeOfLoad?.toLowerCase().includes("infant warmer") ||
        l.typeOfLoad?.toLowerCase().includes("radiant warmer")
    );

    return res.status(200).json(
        new ApiResponse(200, {
            centre: {
                name:     centre.centreName,
                district: centre.district
            },
            equipment: {
                shadowlessLamp: shadowlessLamp ? {
                    typeOfLoad:       shadowlessLamp.typeOfLoad,
                    ratingOfLoad:     shadowlessLamp.ratingOfLoad,
                    numberOfLoad:     shadowlessLamp.numberOfLoad,
                    hoursPerDelivery: 2
                } : null,
                babyWarmer: babyWarmer ? {
                    typeOfLoad:       babyWarmer.typeOfLoad,
                    ratingOfLoad:     babyWarmer.ratingOfLoad,
                    numberOfLoad:     babyWarmer.numberOfLoad,
                    hoursPerDelivery: 6
                } : null
            },
            allLoads: loads.map(l => ({
                typeOfLoad:   l.typeOfLoad,
                ratingOfLoad: l.ratingOfLoad,
                numberOfLoad: l.numberOfLoad,
                criticalLoad: l.criticalLoad
            }))
        }, "Equipment data fetched successfully")
    );
});