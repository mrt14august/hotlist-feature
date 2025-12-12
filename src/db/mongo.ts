import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27018/mylist-ott";

    await mongoose.connect(mongoUri, {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 50 : 20,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      family: 4,
      // Enable compression
      compressors: 'zlib',
      zlibCompressionLevel: 6,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
    throw error;
  }
};

export default mongoose;
