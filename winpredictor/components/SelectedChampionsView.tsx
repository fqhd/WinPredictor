import { Flex, Image, Text, VStack, useToast } from "@chakra-ui/react"
import champions from "../src/champions.json"

type SelectedChampionsViewProps = {
  selectedChampions: string[]
  setSelectedChampions: (champions: string[]) => void
  isRedTeam?: boolean
}

export const lanes = ["top.png", "jungle.png", "mid.png", "bot.png", "support.png"]

export default function SelectedChampionsView({ selectedChampions, isRedTeam, setSelectedChampions }: SelectedChampionsViewProps) {
  const toast = useToast({
    status: "success"
  })

  return (
    <VStack
      gap={3}
    >
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
                toast({
                  description: <Text>Removed <strong>{champion}</strong> from the team builder!</Text>
                })
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