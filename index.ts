import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { initDb } from "./src/database";
import setRoutes from "./src/routes";
import morgan from "morgan";

const errorHandling = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.name);
    console.error(err.message);
    res.status(500).json(err.message);
}

const app = express();

(async () => {
    await initDb();

    app.use(express.json());
    app.use(morgan("common"));
    app.use(errorHandling)

    setRoutes(app);
    
    app.listen(process.env.PORT || 8080);
    console.log("\nListening on port " + (process.env.PORT || "8080"));

})();
