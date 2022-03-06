import { Application } from "express";
import { instaRoutes } from "./instagram.routes";
import { userRoutes } from "./user.routes";

export default function (app: Application) {
    instaRoutes(app);
    userRoutes(app);
}