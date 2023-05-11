import BaseLayout from "@/components/layouts/BaseLayout";
import { DarkOverlayImage } from "@/src/utils";
import { Box, Button, Divider, Flex, FlexProps, HStack, Heading, Icon, Image, Text, useClipboard } from "@chakra-ui/react";

import { FaGithub, FaDiscord } from "react-icons/fa"

type ProfileBlockProps = {
    name: string
    banner: string
    avatar: string
    quote: string
    sub: string
    github: string
    discord: string
    isMirrored?: boolean
} & FlexProps

function ProfileBlock({ github, discord, name, banner, avatar, quote, sub, isMirrored, ...props }: ProfileBlockProps) {
    const { value, onCopy } = useClipboard(discord)

    const ProfileImage = () => (
        <Image
            src={`/assets/avatars/${avatar}`}
            alt={`${avatar}`}
            height="300px"
            rounded="full"
        />
    )

    return (
        <Flex
            marginX="auto"
            padding={10}
            marginY={3}
            backgroundImage={DarkOverlayImage(`/assets/banners/${banner}`)}
            backgroundPosition="center center"
            backgroundSize="cover"
            width="80vw"
            rounded="md"
            justifyContent="space-between"
            alignItems="center"
            {...props}
        >
            {!isMirrored && <ProfileImage />}

            <Box marginX={20} fontStyle={"italic"}>
                <Heading fontSize={{
                    lg: "xl",
                    "2xl": "4xl"
                }}
                >
                    {`❝ ${quote} ❞`}
                </Heading>
                <HStack>
                    <Text color="gray.400" fontWeight={"semibold"}>{name} ~ {sub}</Text>

                    <Icon
                        as={FaGithub}
                        cursor="pointer"
                        onClick={() => window.open(github, "_blank")}
                    />
                    <Icon
                        as={FaDiscord}
                        cursor="pointer"
                        onClick={() => {
                            onCopy()
                            alert(`Copied "${value}" to your clipboard!`)
                        }}
                    />
                </HStack>
            </Box>

            {isMirrored && <ProfileImage />}
        </Flex >
    )
}

export default function About() {

    return (
        <BaseLayout title="About">
            <ProfileBlock
                name="Fahd"
                github="https://github.com/fqhd/"
                discord="Fahd 🌈#1823"
                banner="fahd.jpg"
                avatar="fahd.png"
                sub="AI Development"
                quote="Everyone knows jokes are always funnier after they are explained, but what people don't know, is their chances to win a game during champ select."
            />

            <ProfileBlock
                name="Nemika"
                github="https://github.com/Nemika-Haj/"
                discord="Nemika#1787"
                banner="nemika.jpg"
                avatar="nemika.png"
                quote="However, I do."
                backgroundPosition="center top"
                sub="Web Design"
                isMirrored
            />

            <Box
                backgroundImage={DarkOverlayImage("/assets/banners/contributors.jpg", 0.5)}
                backgroundPosition={"center center"}
                width="80vw"
                marginX="auto"
                marginBottom={5}
                padding={5}
                rounded="md"
                cursor="pointer"
                onClick={() => window.open("https://github.com/fqhd/WinPredictor", "_blank")}
            >
                <Heading>
                    {"Contributors 💖"}
                </Heading>
                <Divider />
                <Image
                    marginY={3}
                    src="https://contrib.rocks/image?repo=fqhd/WinPredictor"
                    alt="Contributors"
                />
            </Box>
        </BaseLayout>
    )
}