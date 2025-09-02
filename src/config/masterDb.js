import mongoose from "mongoose";
import config from "./config.js";

export const masterConnection = await mongoose.createConnection(
    config.uriMasterDb,
    { dbName: undefined } // viene dentro del URI
);
