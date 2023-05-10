import { BrandAssets } from "@/src/BrandAssets";
import { colors } from "@/styles/app.theme";
import { Box, Flex, HStack, Image } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode } from "react";

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

    return (
        <Flex
            width="100vw"
            height="5em"
            p={3}
            background="blackAlpha.800"
            borderBottom={`3px solid ${colors.background.blue}`}
            justifyContent={"space-between"}
            alignItems="center"
        >
            <HStack gap={5}>
                <Image
                    alt="WinPredictor-Logo"
                    src={BrandAssets.WP_LOGO_WHITE}
                    cursor="pointer"
                    onClick={() => router.push("/")}
                    height="3.5em"
                />
                <HeaderLink to={"/"} isActive={location.pathname == "/"}>Predict</HeaderLink>
                <HeaderLink to={"/about"} isActive={location.pathname.includes("about")}>About</HeaderLink>
            </HStack>

        </Flex>
    )
}