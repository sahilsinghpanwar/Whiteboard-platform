import mongoose from "mongoose";

const connectionDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {});
        console.log("MongoDB connected");
    } catch (error) {
        console.log("Error connecting to MongoDB:", error);
    }
}

export default connectionDB;