import mongoose from "mongoose";
import { getTenantConfig } from "./registry.js";

const connCache = new Map(); // slug -> mongoose.Connection

export const getTenantConnection = async (slug) => {
    if (!slug) throw new Error("Missing tenant slug");

    if (connCache.has(slug)) return connCache.get(slug);

    const cfg = await getTenantConfig(slug);

    if (!cfg) throw Object.assign(new Error("Tenant not found"), { status: 404 });

    const conn = await mongoose.createConnection(cfg.mongoUri, {
        maxPoolSize: 5
    });

    connCache.set(slug, conn);
    return conn;
}
