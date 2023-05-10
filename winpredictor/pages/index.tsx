import ChampionSelector from "@/components/ChampionSelector";
import BaseLayout from "@/components/layouts/BaseLayout";
import { Button, Grid, GridItem, Input, InputGroup, InputRightAddon, InputRightElement, Text, useToast } from "@chakra-ui/react";
import { useState } from "react";
import champions from "../src/champions.json"
import { FilterChampion } from "@/src/utils";
import SelectedChampionsView from "@/components/SelectedChampionsView";

export default function Index() {
  const [filter, setFilter] = useState<string>("")
  const [selectedChampions, setSelectedChampions] = useState<string[]>([])

  const [loading, setLoading] = useState<boolean>(false)
  const [prediction, setPrediction] = useState<number | null>(null)

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
          <SelectedChampionsView selectedChampions={selectedChampions} setSelectedChampions={setSelectedChampions} />
        </GridItem>

        <GridItem
          colSpan={6}
          rowSpan={1}
          // background="gray.700"
          backgroundImage="linear-gradient(rgba(0, 0, 0, 0.8) 100%, rgba(0, 0, 0, 0.8) 0%), url(/assets/banners/select.jpg)"
          backgroundPosition={"center center"}
          padding={5}
        >
          <InputGroup>
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

            <InputRightAddon
              as={Button}
              background="green"
              _hover={{
                background: "darkgreen"
              }}
              isLoading={loading}
              onClick={async() => {
                setLoading(true)
                try {
                  
                } finally {
                  setLoading(false)
                }
              }}
            >
              Predict
            </InputRightAddon>
          </InputGroup>

          <ChampionSelector filter={filter} selectedChampions={selectedChampions} setSelectedChampions={setSelectedChampions} />
        </GridItem>

        <GridItem
          colSpan={2}
          rowSpan={1}
        >
          <SelectedChampionsView selectedChampions={selectedChampions} setSelectedChampions={setSelectedChampions} isRedTeam />
        </GridItem>
      </Grid>
    </BaseLayout>
  )
}