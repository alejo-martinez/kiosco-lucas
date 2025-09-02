import dotenv from 'dotenv';

dotenv.config();

export default {
    port: process.env.PORT || 5055,
    databaseURL: process.env.DATABASE_URL,
    secretKey: process.env.SECRET_KEY,
    cookieCode: process.env.COOKIE_CODE,
    jwtSecret: process.env.JWT_SECRET,
    idBarcodeDevice: process.env.ID_BARCODE_DEVICE,
    vendorId: process.env.VENDOR_ID,
    productId: process.env.PRODUCT_ID,
    urlFront: process.env.URL_FRONT,
    uriMasterDb: process.env.URI_MASTER_DB,
    corsOrigins: process.env.CORS_ORIGINS,
    redisUrl: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}`,
    nodeEnv: process.env.NODE_ENV || 'development'
}