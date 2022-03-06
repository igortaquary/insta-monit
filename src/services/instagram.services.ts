import axios from "axios";
import { ObjectId } from "mongodb";
import { db } from "../database";

// Bibliografy:
// https://stackoverflow.com/questions/32407851/instagram-api-how-can-i-retrieve-the-list-of-people-a-user-is-following-on-ins

const cookie = String(process.env.INSTA_API_COOKIE);

const getInstaId = async (username: string) => {
    console.log("getInstaId from " + username);
    const user = await db().collection("user").findOne({ username });
    if(user && user.instaId) {
        return user.instaId
    } else {
        const url = `https://www.instagram.com/${username}/?__a=1`;
        console.log(url);
        const res = await axios.get(url, { headers: { cookie }});
        const id = res.data.graphql.user.id;

        const createOrUpdate = {
            username: username,
            instaId: id,
            createdAt: user?.createdAt || new Date(),
            updatedAt: user?.updatedAt || new Date()
        }
        await db().collection("user").updateOne({ username }, { $set: createOrUpdate }, { upsert: true });

        return id;
    }
}
  
const makeNextRequest = async (nextCurser: string, listConfig: any, userId: any, list: string[]): Promise<string[]> => {
    const params = {
        "id": userId,
        "include_reel": true,
        "fetch_mutual": true,
        "first": 50,
        "after": ""
    };
    if (nextCurser) {
        params.after = nextCurser;
    }
    const requestUrl = `https://www.instagram.com/graphql/query/?query_hash=` + listConfig.hash + `&variables=` + encodeURIComponent(JSON.stringify(params));

    const res = await axios.get(requestUrl, { headers: { cookie }})
    console.log(res.status);

    const userData = res.data.data.user[listConfig.path].edges;
    const userBatch = userData.map((element: any) => element.node.username);
    list.push(...userBatch);

    let curser = "";
    try {
        curser = res.data.data.user[listConfig.path].page_info.end_cursor;
    } catch { }

    if (curser) {
        return await makeNextRequest(curser, listConfig, userId, list);
    } else {
        return list;
    }
}

const getList = async (type: number, instaId: string) => {
    const config = {
        followers: {
            hash: 'c76146de99bb02f6415203be841dd25a',
            path: 'edge_followed_by'
        },
        following: {
            hash: 'd04b0a864b4b54837c0d870b0e77e076',
            path: 'edge_follow'
        }
    };
    
    if (type === 1) {
        console.log('following');
        return await makeNextRequest("", config.following, instaId, []);
    } else if (type === 2) {
        console.log('followers');
        return await makeNextRequest("", config.followers, instaId, []);
    }
}

export const comapareMutuals = async (username: string) => {
    const instaId = await getInstaId(username);
    const followers = await getList(2, instaId);
    const following = await getList(1, instaId);

    try {
        if(followers) await saveList(username, followers, "followers");
        if(following) await saveList(username, following, "following");
    } catch (err) {
        console.log(err);
    }

    const user = await db().collection("user").findOne({ username });

    const notFollowYou = following?.filter( (u: string) => !followers?.includes(u) );
    console.log("notFollowYou: " + notFollowYou?.length)

    const youNotFollow = followers?.filter( (u: string) => !following?.includes(u) );
    console.log("youNotFollow: " + youNotFollow?.length)

    const notMutuals = { notFollowYou, youNotFollow };
    await db().collection("notMutuals").updateOne({ userId: user?._id }, { $set: notMutuals }, { upsert: true });

    return notMutuals
}

const getDiff = (previousList: string[], actualList: string[]) => {
    const oldItems = previousList.filter( u => !actualList.includes(u));
    const newItems = actualList.filter( u => !previousList.includes(u) )

    return { oldItems, newItems }
}

const saveDiff = (user_id: ObjectId, diff: object, diffType: "followers" | "following") => {
    const doc = {
        user_id,
        diffType,
        createdAt: new Date(),
        ...diff
    }
    return db().collection("diff").insertOne(doc);
}

const saveList = async (username: string, list: string[], listType: "followers" | "following") => {
    const user = await db().collection("user").findOne({ username });
    console.log(user);
    if(user) {
        const previousList = user[listType];
        if(previousList) {
            const diff = getDiff(previousList, list);
            console.log(diff);
            if(diff.newItems.length || diff.oldItems.length)
                await saveDiff(user._id, diff, listType);
        }

        const toUpdate: any = { }
        toUpdate[listType] = list,
        toUpdate.updatedAt = new Date()

        await db().collection("user").updateOne({ _id: user._id }, { $set: toUpdate });
    } else {
        console.log("User not found");
        throw new Error("User not found");
    }
}

export const getNotMutuals = async (username: string) => {
    const user = await db().collection("user").findOne({ username });
    return db().collection("notMutuals").findOne({ userId: user?._id })
}