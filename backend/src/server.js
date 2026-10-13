// import dotenv from "dotenv";

import "dotenv/config";
import connectDB from "./db/index.js";
import { log } from "console";
import { app } from "./app.js";
import { startAlertScheduler } from "./utils/alertScheduler.js";


const PORT = process.env.PORT || 8000
// dotenv.config({
//   path: "./.env",
// });
 

connectDB()

.then(() => {

  app.on("error",(error)=>{
    console.log("ERROR: ", error);
    throw error
  })
  app.listen(PORT, () =>{
    console.log(`⚙️  Server is running at port : ${PORT}`);
  })

  // Automatic vaccine-due alerts (12 hours before the due date)
  startAlertScheduler();
})
.catch((err) =>{
    console.log("MongoDB connection failed !!! ",err);
})