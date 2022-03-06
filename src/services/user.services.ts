import { ObjectId } from "mongodb";
import { db } from "../database";

interface User {
    _id?: ObjectId,
    username: string,
    instaId?: number,
    followers?: string[],
    following?: string[],
    createdAt?: Date,
    updatedAt?: Date,
}

export const createUser = (user: User) => {
    return db().collection("user").insertOne(user);
}

export const findUser = (username: string) => {
    console.log(username);
    return db().collection("user").findOne({ username: username })
}