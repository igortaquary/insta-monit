import { NextFunction, Request, Response } from "express";
import * as userService from "../services/user.services"

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const { 
        username
     } = req.body;

    try {
        const newUser = {
            username,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        const created = await userService.createUser(newUser)
        res.json(created);
    } catch (error) {
        next
    }
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    try {
        const find = await userService.findUser(username);
        res.json(find);
    } catch (error) {
        console.log(error);
        next();
    }
}