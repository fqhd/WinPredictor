import { Box, Flex } from "@chakra-ui/react"
import Head from "next/head"
import { ReactNode } from "react"
import Header from "./Header"

export type BaseLayoutProps = {
    title?: string
    children?: ReactNode,

}

export default function BaseLayout(props: BaseLayoutProps) {

    return (
        <Flex
            className="main"
            width="calc(100vw - 5px)"
            minHeight="100vh"
            direction="column"
            position="relative"
        >
            <Head>
                {props.title && <title>{props.title} - LoL WinPredictor</title>}
            </Head>

            <Header />

            <Flex
                direction="column"
                width="100%"
                position="relative"
                minHeight="calc(100vh - 5em)"
                wrap="wrap"
            >
                {props.children}
            </Flex>
        </Flex>
    )

}