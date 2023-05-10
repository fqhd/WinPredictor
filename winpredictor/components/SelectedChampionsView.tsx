import { Box, Flex, Heading, Image, Text, VStack, chakra } from "@chakra-ui/react"
import champions from "../src/champions.json"

type SelectedChampionsViewProps = {
  selectedChampions: string[]
  setSelectedChampions: (champions: string[]) => void
  isRedTeam?: boolean
}

export const lanes = ["top.png", "jungle.png", "mid.png", "bot.png", "support.png"]

export default function SelectedChampionsView({ selectedChampions, isRedTeam, setSelectedChampions }: SelectedChampionsViewProps) {
  const team = isRedTeam ? "red" : "blue"

  return (
    <VStack
      gap={3}
    >
      <Box
        backgroundImage={`linear-gradient(rgba(0, 0, 0, 0.6) 100%, rgba(0, 0, 0, 0.6) 0%), url(/assets/banners/${team}_team_show.jpg)`}
        backgroundPosition={"200px"}
        paddingX={10}
        paddingY={5}
        rounded="70px"
        boxShadow="xl"
      >
        <Heading
          textTransform={"uppercase"}
        >
          <chakra.span color={isRedTeam ? "tomato" : "aqua"}>{team}</chakra.span> team
        </Heading>
      </Box>

      {lanes.map((lane, index) => {
        const champion = selectedChampions.at(!isRedTeam ? index : index + 5)
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
            onClick={() => {
              if (champion) {
                setSelectedChampions(selectedChampions.filter(champ => champ != champion))
              }
            }}
          >
            <Image
              draggable={false}
              alt={`${isRedTeam ? "Red" : "Blue"} ${lane} ${champSrc}`}
              src={`/assets/lanes/${lane}`}
              height="40px"
              display={champion ? "none" : "unset"}
            />
          </Flex>
        )
      })}
    </VStack>
  )
}