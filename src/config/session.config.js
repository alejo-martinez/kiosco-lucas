// session.config.js
import session from "express-session";
import RedisStore from "connect-redis";
import redisClient from "./redis.config.js";
import config from "./config.js";

const sessionMiddleware = session({
    store: new RedisStore({
        client: redisClient,
        prefix: "sess:" // prefijo de las claves
    }),
    secret: config.secretKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.nodeEnv === "production", // solo https en prod
        httpOnly: true,
        maxAge: 1000 * 60 * 30 // 30 min
    }
});

export default sessionMiddleware;
