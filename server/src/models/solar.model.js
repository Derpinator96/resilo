import mongoose from "mongoose";

const solarDataSchema = new mongoose.Schema(
    {
        total_irradiance: { 
            type: Number,
             required: true 
            },   
        direct_normal: { 
            type: Number, 
            required: true 
            },      
        global_horizontal: {
             type: Number,
              required: true
            },  
        air_temperature: { 
            type: Number, 
            required: true 
            },    
        atmosphere: {
             type: Number,
              required: true 
            },         
        year: { 
            type: Number,
             required: true
             },
        month: {
             type: Number,
              required: true
             },
        day: {
             type: Number,
              required: true
             },
        dayofweek: { 
            type: Number,
             required: true 
            },
        hour: { 
            type: Number,
             required: true 
            },
        dayofyear: {
             type: Number,
              required: true
             },
         prediction_MW: { 
            type: Number,
             required: true 
            }
    },
    { 
        timestamps: true 
    }); 

export const SolarData = mongoose.model("SolarData", solarDataSchema);