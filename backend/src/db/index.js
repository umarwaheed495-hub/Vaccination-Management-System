import dns from "dns";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Safely set DNS with error catching
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]); // Primary & Secondary Google DNS
} catch (error) {
  console.warn("Failed to set custom DNS servers, using default system DNS.");
}

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
      {
        serverSelectionTimeoutMS: 5000, // 5 second mein timeout ho jaye agar server na mile
        socketTimeoutMS: 45000,          // Close sockets after 45 seconds of inactivity
      }
    );

    console.log(
      `\nMongoDB Connected!! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

export default connectDB;