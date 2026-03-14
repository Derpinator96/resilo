import mongoose from "mongoose";

const weatherDataSchema = new mongoose.Schema(
    {
        city: { 
            type: String, 
            required: true 
        },
        weather: { 
            type: String, 
            required: true 
        },
        temperature: { 
            type: Number, 
            required: true 
        },
        minTemp: { 
            type: Number, 
            required: true 
        },  
        maxTemp: { 
            type: Number, 
            required: true 
        },
        pressure: { 
            type: Number, 
            required: true 
        },
        humidity: { 
            type: Number, 
            required: true 
        },
        windSpeed: {
            type: Number, 
            required: true 
        }
    }, 
    { 
        timestamps: true 
    });

export const WeatherData = mongoose.model("WeatherData", weatherDataSchema);