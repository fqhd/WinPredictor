import ChampionSelector from "@/components/ChampionSelector";
import BaseLayout from "@/components/layouts/BaseLayout";
import { Grid, GridItem, Input } from "@chakra-ui/react";
import { useState } from "react";

export default function Index() {
  const [filter, setFilter] = useState<string>("")
  const [selectedChampions, setSelectedChampions] = useState<string[]>([])

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
          a
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
          />

          <ChampionSelector filter={filter} selectedChampions={selectedChampions} setSelectedChampions={setSelectedChampions} />
        </GridItem>

        <GridItem
          colSpan={2}
          rowSpan={1}
        >
          a
        </GridItem>

      </Grid>
    </BaseLayout>
  )
}