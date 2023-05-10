import ChampionSelector from "@/components/ChampionSelector";
import BaseLayout from "@/components/layouts/BaseLayout";
import { Box, Flex, Grid, GridItem, Image, Input, Text, VStack, useToast } from "@chakra-ui/react";
import { useState } from "react";
import champions from "../src/champions.json"
import { FilterChampion } from "@/src/utils";

const lanes = ["top.png", "jungle.png", "mid.png", "bot.png", "support.png"]

export default function Index() {
  const [filter, setFilter] = useState<string>("")
  const [selectedChampions, setSelectedChampions] = useState<string[]>([])

  const toast = useToast({
    status: "success",
    isClosable: true
  })

  return (
    <BaseLayout>
      <Grid
        templateColumns={"repeat(10, 1fr)"}
        templateRows={"repeat(1, 1f)"}
        gap={5}
        padding={5}
      >

        <GridItem
          colSpan={2}
          rowSpan={1}
        >
          <VStack
            gap={3}
          >
            {lanes.map((lane, index) => {
              const champion = selectedChampions.at(index)
              // @ts-ignore
              const champSrc = champions[champion || ""]

              return (
                <Flex
                  key={`${lane}-${champion}-blue`}
                  background="gray.700"
                  rounded="full"
                  boxSize="70px"
                  justifyContent="center"
                  alignItems="center"
                  userSelect={"none"}
                  className="champion-icon-select"
                  cursor="pointer"
                  backgroundImage={champion ? `/assets/champions/${champSrc}` : "unset"}
                  backgroundSize={"contain"}
                >
                  <Image
                    draggable={false}
                    alt={`Blue ${lane} ${champSrc}`}
                    src={`/assets/lanes/${lane}`}
                    height="40px"
                    display={champion ? "none" : "unset"}
                  />
                </Flex>
              )
            })}
          </VStack>
        </GridItem>

        <GridItem
          colSpan={6}
          rowSpan={1}
          background="gray.700"
          padding={5}
        >
          <Input
            variant="flushed"
            background="gray.200"
            color="gray.900"
            paddingX="10px"
            placeholder="Search for champions..."
            _placeholder={{
              color: "blackAlpha.700"
            }}
            onChange={e => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key != "Enter") return

              const champion = Object.keys(champions).filter(champion => FilterChampion(filter, champion)).at(0)
              if (!champion) return

              if (selectedChampions.includes(champion)) {
                setSelectedChampions(selectedChampions.filter(champ => champ != champion))
                toast({
                  description: <Text>Removed <strong>{champion}</strong> from the team builder!</Text>
                })
              }
              else {
                if (selectedChampions.length < 10) {
                  setSelectedChampions([...selectedChampions, champion])
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

          <ChampionSelector filter={filter} selectedChampions={selectedChampions} setSelectedChampions={setSelectedChampions} />
        </GridItem>

        <GridItem
          colSpan={2}
          rowSpan={1}
        >
          <VStack
            gap={3}
          >
            {lanes.map((lane, index) => {
              const champion = selectedChampions.at(index+5)
              // @ts-ignore
              const champSrc = champions[champion || ""]

              return (
                <Flex
                  key={`${lane}-${champion}-blue`}
                  background="gray.700"
                  rounded="full"
                  boxSize="70px"
                  justifyContent="center"
                  alignItems="center"
                  userSelect={"none"}
                  className="champion-icon-select"
                  cursor="pointer"
                  backgroundImage={champion ? `/assets/champions/${champSrc}` : "unset"}
                  backgroundSize={"contain"}
                >
                  <Image
                    draggable={false}
                    alt={`Blue ${lane} ${champSrc}`}
                    src={`/assets/lanes/${lane}`}
                    height="40px"
                    display={champion ? "none" : "unset"}
                  />
                </Flex>
              )
            })}
          </VStack>
        </GridItem>

      </Grid>
    </BaseLayout>
  )
}