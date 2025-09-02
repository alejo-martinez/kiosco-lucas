// redis.config.js
import { createClient } from "redis";
import config from "./config.js";

const redisClient = createClient({
    url: config.redisUrl || "redis://localhost:6379", // local por defecto
    socket: {
        reconnectStrategy: retries => Math.min(retries * 50, 500)
    }
});

redisClient.on("error", err => {
    console.error("Redis Client Error", err)
    throw new Error(`Redis error: ${err.message}`);
});
redisClient.on("connect", () => console.log("✅ Redis conectado"));

await redisClient.connect();

export default redisClient;