import { NextFunction, Request, Response } from "express";
import { comapareMutuals, getNotMutuals } from "../services/instagram.services";

export const listNoMutuals = async (req: Request, res: Response, next: NextFunction ) => {
    const { username } = req.params;

    try {
        const oldComparedMutuals = await getNotMutuals(username);
        if(oldComparedMutuals) {
            res.json(oldComparedMutuals);
        } else {
            const data = await comapareMutuals(username);
            res.json(data);
        }
    } catch (error) {
        next(error);
    }
}