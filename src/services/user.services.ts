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

export const createUser = async (user: User) => {
    const find = await db().collection("user").findOne({ username: user.username });
    if(find) throw new Error("Already exists a user with this username");
    return db().collection("user").insertOne(user);
}

export const findUser = (username: string) => {
    console.log(username);
    return db().collection("user").findOne({ username: username })
}