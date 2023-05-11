import { addGame } from "@/src/database/core";
import { NextApiRequest, NextApiResponse } from "next";

export default async function addGameHandler(req: NextApiRequest, res: NextApiResponse<boolean | string>) {
    if(req.method != "POST") return res.status(405).json("method not allowed")

    const body = JSON.parse(req.body)

    if(
        !body.rank ||
        !body.gameUrl
    ) return res.status(400).json("bad request")

    if(
        !["iron", "bronze", "silver", "gold", "platinum", "diamond", "master", "grandmaster", "challenger"].includes(body.rank)
    ) return res.status(400).json("invalid rank")

    await addGame(body.rank, body.gameUrl)

    return res.status(200).json(true)
}