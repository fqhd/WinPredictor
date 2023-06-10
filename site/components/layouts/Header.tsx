import { BrandAssets } from "@/src/BrandAssets";
import { colors } from "@/styles/app.theme";
import { Box, Flex, HStack, Image, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";

type HeaderLinkProps = {
    children: ReactNode
    to: string
    isActive?: boolean
}

function HeaderLink(props: HeaderLinkProps) {
    const router = useRouter()

    const classList = ["header-link"]

    if(props.isActive) classList.push("active")

    return (
        <Box
            cursor="pointer"
            onClick={() => router.push(props.to)}
            className={classList.join(" ")}
        >
            {props.children}
        </Box>
    )
}

export default function Header() {
    const router = useRouter()
    const [trainedGames, setTrainedGames] = useState<number>(149980)

    useEffect(() => {
        const updateGames = async() => {
            const res = await fetch("/api/getTrainedGames")
            setTrainedGames(149980 + await res.json())
        }

        setInterval(updateGames, 5000)
    })

    return (
        <Flex
            width="100%"
            height="5em"
            p={3}
            background="blackAlpha.800"
            borderBottom={`3px solid ${colors.background.blue}`}
            justifyContent={"space-between"}
            alignItems="center"
            position="sticky"
            top="0"
            zIndex={999}
        >
            <HStack gap={5}>
                <Image
                    alt="WinPredictor-Logo"
                    src={BrandAssets.WP_LOGO_WHITE}
                    cursor="pointer"
                    onClick={() => router.push("/")}
                    height="3.5em"
                />
                <HeaderLink to={"/"} isActive={router.pathname == "/"}>Predict</HeaderLink>
                <HeaderLink to={"/about"} isActive={router.pathname.includes("about")}>About</HeaderLink>
                <HeaderLink to={"/train"} isActive={router.pathname.includes("train")}>Train</HeaderLink>
            </HStack>

            <HStack>
                <Text>Trained on {trainedGames.toLocaleString()} games!</Text>
            </HStack>

        </Flex>
    )
}