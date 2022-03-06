import { Application } from "express";
import { createUser, getUser } from "../controllers/user.controller";

export const userRoutes = (app: Application) => {
    app.post("/user", createUser);
    app.get("/user/:username", getUser)
}