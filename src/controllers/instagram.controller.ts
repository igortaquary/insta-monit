import { NextFunction, Request, Response } from "express";
import { comapareMutuals } from "../services/instagram.services";

export const listNoMutuals = async (req: Request, res: Response, next: NextFunction ) => {
    const { username } = req.params;

    try {
        const data = await comapareMutuals(username);
        res.json(data);
    } catch (error) {
        next()
    }
}