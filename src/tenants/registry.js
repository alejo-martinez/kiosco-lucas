// src/tenants/registry.js
import { masterConnection } from "../config/masterDb.js";
import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
    slug: { type: String, unique: true },
    mongoUri: String,
    brand: Object
}, { collection: "tenants" });

const Tenant = masterConnection.model("Tenant", tenantSchema);

const cache = new Map(); // slug -> { mongoUri, brand }

export const getTenantConfig = async (slug) => {
    if (cache.has(slug)) return cache.get(slug);
    const t = await Tenant.findOne({ slug }).lean();

    if (!t) return null;
    cache.set(slug, { mongoUri: t.mongoUri, brand: t.brand || {} });
    return cache.get(slug);
}

export const createTenant = async (slug, mongoUri, brand) => {
    try {
        if (!slug || !mongoUri || !brand) throw new Error("Missing data");
        const request = await Tenant.create({ slug, mongoUri, brand });
        return request;
    } catch (error) {
        return error;
    }
}
