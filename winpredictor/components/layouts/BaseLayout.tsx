import { Flex } from "@chakra-ui/react"
import { ReactNode } from "react"

export type BaseLayoutProps = {
    title?: string
    children?: ReactNode,

}

export default function BaseLayout(props: BaseLayoutProps) {

    return (
        <Flex
            className="main"
            width="100vw"
            minHeight="100vh"
        >
        
        </Flex>
    )

}