import { getTenantConnection } from "../tenants/connManager.js";
import { getTenantConfig } from "../tenants/registry.js";

const extractSlugFromHost = (host) => {
    if (!host) return null;

    // eliminar protocolo si lo tiene
    let h = host.toLowerCase().replace(/^https?:\/\//, "");

    // quitar ruta si existe
    h = h.split("/")[0];

    // caso vercel: kiosco-test.vercel.app -> kiosco-test
    if (h.endsWith(".vercel.app")) {
        return h.replace(".vercel.app", "");
    }

    // caso subdominio normal: kiosco-lucas-front.midominio.com -> kiosco-lucas-front
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
