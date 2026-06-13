# Architecture Document

## Section 1 — System Diagram

```mermaid
flowchart TD
    subgraph Physical Layer
        JN[Jetson Nano]
        Sensors[Voltage/Current/Temp Sensors]
        Sensors --> JN
    end
    
    subgraph App/API Layer
        Node[Node.js + Express]
        Mongo[(MongoDB)]
        Clerk[Clerk Auth & Roles]
        
        JN -- "REST / POST Telemetry" --> Node
        Node <--> Mongo
        Node <--> Clerk
    end
    
    subgraph Frontend Layer
        React[React / Vite]
        Routes[Routes:\n/, /dashboard, /solar-forecast,\n/institute/:id, /authority,\n/sanitation, /api-docs]
        
        React -- "VITE_* env / Clerk JWT" --> Node
    end
    
    subgraph AI/ML Layer
        HF[HuggingFace XGBoost]
        OM[Open-Meteo]
        NIM[NVIDIA NIM Llama 3]
        OpenAI[OpenAI GPT-4o Vision]
        
        Node <--> HF
        Node <--> OM
        Node <--> NIM
        Node <--> OpenAI
    end
```

## Section 2 — Database Collections

The MongoDB database is composed of several core collections:
- **Districts**: Master list of regional zones.
- **Institutes**: Facility metadata, including `latitude` and `longitude` fields for GIS mapping, and static specs for the PV installation and batteries.
- **TelemetryReadings**: IoT sensor logs, time-series data with timestamps tracking generated power and infrastructure environment.
- **CentreData**: Extensive audit parameters containing inverter ratings, monthly power consumption, ILR (Ice Lined Refrigerator) count, deep freezer count, and site photos.
- **IncidentReports**: Active and resolved facility failures or anomalies raised either automatically via Telemetry thresholds or manually.
- **AuditLogs**: Historical actions tracked for compliance purposes.

## Section 3 — Sequence Diagram

```mermaid
sequenceDiagram
    participant IoT as IoT Sensor
    participant API as Express API
    participant DB as MongoDB
    participant Dash as Authority Dashboard
    participant NIM as NVIDIA NIM (Llama 3)
    
    IoT->>API: POST /api/telemetry (Anomaly Detected)
    API->>DB: Save TelemetryReadings
    API->>API: Evaluate thresholds
    API->>DB: Save IncidentReports
    
    loop Every 500ms / 10s
        Dash->>API: GET /api/telemetry/latest
        API-->>Dash: Return updated telemetry & incidents
    end
    
    Dash->>API: POST /api/reports/submit (Resolve / Suggest)
    API->>NIM: Request repair suggestion stream
    NIM-->>API: Stream tokens
    API-->>Dash: Present repair suggestion to Admin
```

## Section 4 — State Dashboard Integration

For the Chhattisgarh Unified State Dashboard, Resilo provides the following endpoints to stream compatible compliance and operational data. All endpoints return data in standard `application/json` format.

- **`/api/institutes`**: Returns the standard facility ID (`_id`), human-readable name, facility type, and `latitude` & `longitude` arrays ideal for state-wide GIS plotting.
- **`/api/telemetry/latest`**: Exposes real-time facility infrastructure telemetry. Time values are formatted as strict ISO 8601 timestamps (`timestamp`), making ingestion into state time-series databases trivial.
- **`/api/reports/active`**: Streams active facility faults and alerts matching standard JSON reporting structures, complete with facility correlation IDs.
