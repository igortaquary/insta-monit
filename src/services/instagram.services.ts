import axios from "axios";
import { ObjectId } from "mongodb";
import { db } from "../database";

//const cookie = ' mid=YO4HwQAEAAFTaPMRH_yVZl9onelD; ig_did=A71F5E06-F150-4E1B-8D1F-664EB8C45587; ig_nrcb=1; csrftoken=QWyJPve9XiOiW3hYdGZKZde8ab0sycAu; ds_user_id=2286335288; sessionid=2286335288%3A7KkYX7W5t4X8Vw%3A14; fbm_124024574287414=base_domain=.instagram.com; shbid="4478\\0542286335288\\0541677953386:01f79e7510d423d18257cc75137f49c51caeb8aae4da828a90ebaf461d1d4482b4336634"; shbts="1646417386\\0542286335288\\0541677953386:01f7a21470e9882365f84f3aa1ece538498d01e8df533ae115abdd2bfd403a724058b9ea"; fbsr_124024574287414=_A2hbs1jlaelWbAFS8qnTrEQ4Zo37NqVeAsps71Nr6Q.eyJ1c2VyX2lkIjoiMTAwMDAxMjMxMjkzNTI0IiwiY29kZSI6IkFRQm1WWVk4RGZCTFJHa1VpTDJKT3JjVy1YLXFKZVZWTkxrbGhzdDg1VHBqa0NzTFlHbFNiOXRaTlVfdnl6NEY1dEo3aVo4b3pqR1VSXy1iY0FyMFhoZzZxRnplT0NHemhMX0ZaQXEyMndwcllnZGtJRVp2VjZTZ0l5RXpKZHBhVTZrX09kSGF3OXVWZ3haa1Z0WGdYVnpuZHNWM1dMLU1GLXhSWlhodHpBQzQwd1JuM3ItWHY1N2ZFM3BUNVBQeG4wdkpMOU1GajFGU2N6aEVGeVpHQUg5TEtzOWVPWFhUR2xhNkdscm1haFVZc1hmcUVaMzhVZmk2WjVGaVpkNklNZ1VDbGdkZ0dLLTVYVHh3R2cxekphTG5Jc3dvRHlCZVpxWDkycVc2bFVuTGJfYXlja3B5RzhpdnZRQ3ZFUG40aGhJMVBXbExTN0NWQ3VHdDJDSUQ1Vnk0dWl1U2pUNnMtSlltQzhmRllqRjZTZyIsIm9hdXRoX3Rva2VuIjoiRUFBQnd6TGl4bmpZQkFLVUVRWkFMOVdES3FEWkNaQUlWd0J0dVhLOTFuUGtiZHhDOVUwcTRyUTVkTXlYVWVaQXhUazNaQlFzNFZ4OWJYRHkxUzRrQXRyZVpCQXlwa0dicktaQUoyMnZtNXFaQ1ZOYVJpek51Um9kN0ZVSnBNU2l3dm1ibVJIQTRuVHdGcWZiSEt0QWh3NHFjZ1VkWXZlSHZJNVFBSFc1VzRiSjU4RDEzc2ROVnh1a0NSMTJZMWhiVDdaQjBaRCIsImFsZ29yaXRobSI6IkhNQUMtU0hBMjU2IiwiaXNzdWVkX2F0IjoxNjQ2NDUyNzEwfQ; rur="NCG\\0542286335288\\0541678023787:01f775ccef780ca6dcf74d76dbd40fd90d01fbf20fe0ab651613e47dbe59ca06da61337a" '

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

const getList = async (type: number, username: string) => {
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
    const userId = await getInstaId(username);
    if (type === 1) {
        console.log('following');
        return await makeNextRequest("", config.following, userId, []);
    } else if (type === 2) {
        console.log('followers');
        return await makeNextRequest("", config.followers, userId, []);
    }
}

export const comapareMutuals = async (username: string) => {
    const followers = await getList(2, username);
    const following = await getList(1, username);

    try {
        if(followers) await saveList(username, followers, "followers");
        if(following) await saveList(username, following, "following");
    } catch (err) {
        console.log(err);
    }

    const notMutualFollowers = following?.filter( (u: string) => !followers?.includes(u) );
    console.log("notMutualFollowers: " + notMutualFollowers?.length)

    const notFollowingBack = followers?.filter( (u: string) => !following?.includes(u) );
    console.log("notFollowingBack: " + notFollowingBack?.length)

    return { notMutualFollowers, notFollowingBack }
}

// Bibliografy:
// https://stackoverflow.com/questions/32407851/instagram-api-how-can-i-retrieve-the-list-of-people-a-user-is-following-on-ins

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