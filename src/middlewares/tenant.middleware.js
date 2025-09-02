import { getTenantConnection } from "../tenants/connManager.js";
import { getTenantConfig } from "../tenants/registry.js";

const extractSlugFromHost = (host) => {
    // soporta: kiosco1-tuapp.vercel.app  -> "kiosco1"
    //          kiosco1.midominio.com     -> "kiosco1"
    if (!host) return null;
    const h = host.toLowerCase();

    // Caso vercel: kiosco1-tuapp.vercel.app
    if (h.includes("-") && h.endsWith(".vercel.app")) {
        return h.split(".")[0].split("-")[0];
    }

    // Caso subdominio normal: kiosco1.midominio.com
    return h.split(".")[0];
}

export const tenantMiddleware = async (req, res, next) => {
    try {
        const fromHeader = req.headers["x-tenant-id"];
        const fromHost = extractSlugFromHost(req.headers.host);
        const slug = fromHeader || fromHost;

        if (!slug) return res.status(400).json({ error: "Missing tenant id" });

        const cfg = await getTenantConfig(slug);
        if (!cfg) return res.status(404).json({ error: "Tenant not found" });

        req.tenant = { slug, brand: cfg.brand || {} };
        req.db = await getTenantConnection(slug);
        next();
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}
