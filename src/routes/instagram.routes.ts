import { Application } from "express";
import { listNoMutuals } from "../controllers/instagram.controller";

export const instaRoutes = (app: Application) => {
    app.get("/instagram/not_mutuals/:username", listNoMutuals);
}