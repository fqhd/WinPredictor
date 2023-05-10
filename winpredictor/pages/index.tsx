import ChampionSelector from "@/components/ChampionSelector";
import BaseLayout from "@/components/layouts/BaseLayout";
import { Alert, AlertIcon, Button, Grid, GridItem, Input, InputGroup, InputRightAddon, chakra, ScaleFade, Text, InputLeftAddon } from "@chakra-ui/react";
import { useState } from "react";
import champions from "../src/champions.json"
import { FilterChampion } from "@/src/utils";
import SelectedChampionsView from "@/components/SelectedChampionsView";

export default function Index() {
  const [filter, setFilter] = useState<string>("")
  const [selectedChampions, setSelectedChampions] = useState<string[]>([])

  const [loading, setLoading] = useState<boolean>(false)
  const [prediction, setPrediction] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

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
            <InputLeftAddon
              as={Button}
              background="red"
              _hover={{
                background: "darkred"
              }}
              onClick={() => {
                setSelectedChampions([])
                setPrediction(null)
                setError(null)
              }}
            >
              Clear
            </InputLeftAddon>

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
              value={filter}
              onKeyDown={(e) => {
                if (e.key != "Enter") return

                const champion = Object.keys(champions).filter(champion => FilterChampion(filter, champion)).at(0)
                if (!champion) return

                // @ts-ignore
                setFilter("")

                if (selectedChampions.includes(champion)) {
                  setSelectedChampions(selectedChampions.filter(champ => champ != champion))
                }
                else {
                  if (selectedChampions.length < 10) {
                    setSelectedChampions([...selectedChampions, champion])
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
              onClick={async () => {
                setLoading(true)
                setError(null)
                try {
                  if (selectedChampions.length != 10) return

                  const res = await fetch("/api/predict?champions=" + selectedChampions.map(champ => champ.trim()).join(","))
                  const data = await res.json()

                  if(res.status != 200) {
                    setError(data)
                  }

                  setPrediction(data.prediction)
                } finally {
                  setLoading(false)
                }
              }}
            >
              Predict
            </InputRightAddon>
          </InputGroup>

          {prediction && (
            <ScaleFade in={prediction != null} initialScale={0.4} delay={.2}>
              <Alert status={"success"} marginTop={2}>
                <AlertIcon />
                <Text>
                  The <chakra.span color={prediction > 0.5 ? "aqua" : "tomato"} fontWeight="bold">{prediction > 0.5 ? "BLUE" : "RED"}</chakra.span> team has {
                    prediction > 0.5 ? (prediction * 100).toFixed(2) : ((1 - prediction) * 100).toFixed(2)
                  }% chance to win the game!
                </Text>
              </Alert>
            </ScaleFade>
          )}
          {error && (
            <ScaleFade in={error != null} initialScale={0.4} delay={.2}>
              <Alert status={"error"} marginTop={2}>
                <AlertIcon />
                <Text>
                  <strong>Error:</strong> {error}
                </Text>
              </Alert>
            </ScaleFade>
          )}

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