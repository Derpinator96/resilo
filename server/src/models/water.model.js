import mongoose from "mongoose";

const waterDataSchema = new mongoose.Schema(
    {
        pH: { 
            type: Number, 
            required: true 
        },
        hardness: { 
            type: Number,
            required: true 
        },
        solids: { 
            type: Number,
            required: true 
        },
        chloramines: { 
            type: Number,
            required: true 
        },
        sulfate: { 
            type: Number,
            required: true
        },
        conductivity: { 
            type: Number,
            required: true 
        },
        organic_carbon: {
            type: Number,
            required: true 
        },
        trihalomethanes: {
            type: Number,
            required: true 
        },
        turbidity: { 
            type: Number,
            required: true
        },
        prediction: {
            type: Number, 
            required: true
        },
        label: {
            type: String, 
            required: true
        } 
    },
    { timestamps: true });

export const WaterData = mongoose.model("WaterData", waterDataSchema);