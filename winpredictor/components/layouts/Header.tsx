import { colors } from "@/styles/app.theme";
import { Flex } from "@chakra-ui/react";

export default function Header() {

    return (
        <Flex
            width="100vw"
            height="5em"
            background="blackAlpha.800"
            borderBottom={`3px solid ${colors.background.blue}`}
            justifyContent={"space-between"}
        >
            
        </Flex>
    )
}