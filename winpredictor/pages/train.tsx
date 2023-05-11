import BaseLayout from "@/components/layouts/BaseLayout";
import { DarkOverlayImage } from "@/src/utils";
import { Box, SimpleGrid } from "@chakra-ui/react";

export default function Train() {

    return (
        <BaseLayout title="Help us train the AI">
            <SimpleGrid
                columns={2}
                backgroundImage={DarkOverlayImage("/assets/banners/blue_team_show.jpg")}
                backgroundPosition="center center"
                border="2px solid red"
                width="80vw"
                marginX="auto"
                marginY={10}
                padding={5}
                rounded="md"
            >
                A
            </SimpleGrid>
        </BaseLayout>
    )
}