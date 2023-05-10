import { useColorMode } from "@chakra-ui/react"
import { useEffect } from "react";

export default function ColorManager() {
    const { setColorMode, colorMode } = useColorMode();

    useEffect(() => {
        if(colorMode == "light") setColorMode("dark")
    })

    return <></>

}