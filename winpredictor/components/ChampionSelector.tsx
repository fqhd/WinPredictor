import { Box, Flex, Text, useToast } from "@chakra-ui/react";
import champions from "../src/champions.json"
import { FilterChampion } from "@/src/utils";

type ChampionSelectorProps = {
    filter: string
    selectedChampions: string[]
    setSelectedChampions: (champions: string[]) => void
}

export default function ChampionSelector(props: ChampionSelectorProps) {
    const toast = useToast({
        status: "success",
        isClosable: true
    })

    return (
        <Flex
            marginTop={5}
            wrap="wrap"
            gap={3}
            paddingX={0}
            overflowY={"auto"}
            minHeight="400px"
            height="75vh"
            alignContent="start"
        >

            {
                Object.keys(champions)
                    .filter(champion => FilterChampion(props.filter, champion))
                    .map(champion => {
                        // @ts-ignore
                        const champSrc = champions[champion]
                        const classList = ["champion-icon-select"]

                        if (props.selectedChampions.includes(champion)) classList.push("selected")

                        return (
                            <Box
                                backgroundImage={`/assets/champions/${champSrc}`}
                                key={`select-champion-${champion}`}
                                className={classList.join(" ")}
                                cursor="pointer"
                                onClick={() => {
                                    if(props.selectedChampions.includes(champion)) {
                                        props.setSelectedChampions(props.selectedChampions.filter(champ => champ != champion))
                                        toast({
                                            description: <Text>Removed <strong>{champion}</strong> from the team builder!</Text>
                                        })
                                    }
                                    else {
                                        if(props.selectedChampions.length < 10) {
                                            props.setSelectedChampions([...props.selectedChampions, champion])
                                            toast({
                                                description: <Text>Added <strong>{champion}</strong> to the team builder!</Text>
                                            })
                                        }
                                        else {
                                            toast({
                                                status: "warning",
                                                description: "You can only choose 10 champions!"
                                            })
                                        }
                                    }
                                }}
                            />
                        )
                    })
            }

        </Flex>
    )
}