import typeError from "../errors/type.error.js";

const sendErrorResponse = (res, statusCode, errorMessage) => {
    res.status(statusCode).send({ status: 'error', error: errorMessage });
};

export default (err, req, res, next) => {
    switch (err.code) {
        case typeError.INVALID_TYPES:
            sendErrorResponse(res, 401, `${err.message}`);
            break;
            
        case typeError.FIELD_VALIDATION_FAILED:
            sendErrorResponse(res, 422, `${err.message}`);
            break;

        case typeError.MISSING_REQUIRED_FIELDS:
            sendErrorResponse(res, 400, `${err.message}`);
            break;

        case typeError.NOT_FOUND:
            sendErrorResponse(res, 404, `${err.message}`);
            break;

        case typeError.DATABASE_ERROR:
            sendErrorResponse(res, 503, `${err.message}`);
            break;
        
        case typeError.CONFLICT_ERROR:
            sendErrorResponse(res, 409, `${err.message}`)
            break;

        default:
            sendErrorResponse(res, 500, `${err}`);
            break;
    }
};