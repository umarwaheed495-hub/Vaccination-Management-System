import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { errorHandler } from "./middlewares/error.middleware.js"


// Routes Import (Grouped together)
import doctorRouter from "./routes/doctor.routes.js";
import clinicRouter from "./routes/clinic.routes.js";
import vaccinationRouter from "./routes/vaccination.routes.js";
import patientRouter from "./routes/patient.routes.js"; 
import vaccineBrandRouter from "./routes/vaccineBrand.routes.js"; 

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// 2. Routes Declaration
app.use("/api/v1/doctors", doctorRouter)
app.use("/api/v1/clinics", clinicRouter);
app.use("/api/v1/vaccinations", vaccinationRouter);
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/vaccine-brands", vaccineBrandRouter); 

// 3. Centralized Error Handler (Hamesha end mein aayega)
app.use(errorHandler)

export { app }