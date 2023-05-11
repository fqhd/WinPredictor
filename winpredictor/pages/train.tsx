import BaseLayout from "@/components/layouts/BaseLayout";
import { DarkOverlayImage } from "@/src/utils";
import { Box, SimpleGrid, Image, Flex, Text, Input, Button, Alert, AlertIcon } from "@chakra-ui/react";
import { useState } from "react";

import style from "../styles/train.module.scss"

const ranks = {
    "iron": "#3E302E",
    "bronze": "#593D38",
    "silver": "#98A9B5",
    "gold": "#FDECBF",
    "platinum": "#319591",
    "diamond": "#69E7F8",
    "master": "#F3BAF4",
    "grandmaster": "#D55263",
    "challenger": "#AF9067"
}

export default function Train() {
    const [selectedRank, setSelectedRank] = useState<string>("silver")
    const [gameUrl, setGameURL] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)
    const [alert, setAlert] = useState<string | null | boolean>(null)

    return (
        <BaseLayout title="Help us train the AI">
            <SimpleGrid
                columns={2}
                backgroundImage={DarkOverlayImage("/assets/banners/blue_team_show.jpg")}
                backgroundPosition="center center"
                backgroundSize="cover"
                border="2px solid red"
                width="80vw"
                marginX="auto"
                marginY={10}
                padding={5}
                rounded="md"
            >
                <Box>
                    {alert && (
                        <Alert status={"info"}>
                            <AlertIcon />
                            {alert == true ? "Your game was submitted successfully!" : "Error: " + alert}
                        </Alert>
                    )}
                    <Text color={"gray.300"} fontSize="12px" width="80%">
                        {`How does it work? You can submit one of your games and select your rank. Afterwards, we will gather all games submitted by you and other users to train the AI so it can predict the outcome of a game more accurately based on the division. Currently, the game you will submit will train the AI for ${selectedRank.toUpperCase()} games. Please only submit ranked games! Normal / ARAM / RGM games won't be used to train the AI.`}
                    </Text>

                    <Input
                        marginY={4}
                        variant="flushed"
                        background="gray.200"
                        color="gray.900"
                        paddingX="10px"
                        placeholder="Enter your game URL (OP.gg, LeagueOfGraphs.com)..."
                        _placeholder={{
                            color: "blackAlpha.700"
                        }}
                        value={gameUrl}
                        onChange={e => setGameURL(e.target.value)}
                    />

                    <Button
                        isLoading={loading}
                        loadingText={"Please wait..."}
                        onClick={async () => {
                            setLoading(true)
                            setAlert(null)
                            try {
                                const res = await fetch("/api/addGame", {
                                    method: "POST",
                                    body: JSON.stringify({
                                        gameUrl,
                                        rank: selectedRank,
                                    })
                                })

                                const data = await res.json()
                                setAlert(data)
                            } finally {
                                setLoading(false)
                            }
                        }}
                    >
                        Submit Game
                    </Button>
                </Box>

                <Flex
                    wrap="wrap"
                    gap={5}
                    justifyContent="center"
                >
                    {Object.keys(ranks).map(rank => (
                        <Image
                            key={`${rank} rank`}
                            alt={`${rank} rank`}
                            src={`/assets/ranks/emblem-${rank}.png`}
                            height="150px"
                            transition={"200ms ease-in-out"}
                            className={selectedRank == rank ? style.selectedRank : ""}
                            // @ts-ignore
                            filter={selectedRank == rank ? `drop-shadow(0px 0px 15px ${ranks[rank]})` : ""}
                            cursor="pointer"
                            onClick={() => setSelectedRank(rank)}
                            draggable={false}
                        />
                    ))}
                </Flex>
            </SimpleGrid>
        </BaseLayout>
    )
}