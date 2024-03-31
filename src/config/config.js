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
    productId: process.env.PRODUCT_ID
}