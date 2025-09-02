import { createTenant } from "../tenants/registry.js";

const createNewTenant = async (req, res, next) => {
    try {
        const { slug, mongoUri, brand } = req.body;
        if (!slug || !mongoUri || !brand) throw new Error("Faltan datos");
        const newTenant = await createTenant(slug, mongoUri, brand);
        console.log(newTenant);
        return res.status(201).send({ status: 'success', message: 'Nuevo tenant creado!', tenant: newTenant });
    } catch (error) {
        return next(error);
    }
}

export default { createNewTenant };