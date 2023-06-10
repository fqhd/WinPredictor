import mongoose from "mongoose";

export type GameType = {
    rank: "iron" | "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master" | "grandmaster" | "challenger"
    gameUrl: string
}

const GameSchema = new mongoose.Schema<GameType>({
    rank: String,
    gameUrl: String
})

const GameModel = mongoose.models.Game || mongoose.model("Game", GameSchema)

export default GameModel