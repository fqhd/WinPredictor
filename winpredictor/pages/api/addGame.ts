import RateLimitManager from "@/src/RateLimitManager";
import { addGame, getGameByURL } from "@/src/database/core";
import { NextApiRequest, NextApiResponse } from "next";

const rateLimiter = new RateLimitManager(20, 60)

export default async function addGameHandler(req: NextApiRequest, res: NextApiResponse<boolean | string>) {
    if(req.method != "POST") return res.status(405).json("method not allowed")

    const body = JSON.parse(req.body)

    if(
        !body.rank ||
        !body.gameUrl
    ) return res.status(400).json("rank or game url missing")

    if(
        !["iron", "bronze", "silver", "gold", "platinum", "diamond", "master", "grandmaster", "challenger"].includes(body.rank)
    ) return res.status(400).json("invalid rank")

    if(!rateLimiter.addUse()) {
        return res.status(429).json(`too many requests, try again in ${rateLimiter.getTimeDifference().toFixed(1)}s`)
    }

    if(await getGameByURL(body.gameUrl)) return res.status(403).json("game already submitted")

    await addGame(body.rank, body.gameUrl)

    return res.status(200).json(true)
}