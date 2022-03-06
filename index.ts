import "dotenv/config";
import express from "express";
import { initDb } from "./src/database";
import setRoutes from "./src/routes";
import morgan from "morgan";

const app = express();

(async () => {
    await initDb();

    app.use(morgan('combined'))
    app.use(express.json())
    setRoutes(app);
    
    app.listen(8080);
    console.log("\nListening on port 8080");

})().then();

