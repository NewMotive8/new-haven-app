import Card from 'components/cards/card'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import BrandContext from 'context/brand'
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { jackpotsI } from 'utils/services/api/requests/jackpots'
import {
  JackpotI,
  defaultJackpot,
} from 'utils/services/api/requests/jackpots/types'
import { buildJackpotSimulationBet } from 'utils/services/api/requests/simulator'
import FooterSimulator from './footer'
import { PublicSteps } from './stages'
import { usePoolForm } from './steps/pool/usePool'
import { useSeedForm } from './steps/seed/useSeed'
import { JackpotType, SimulatorSteps, useStep } from './useSteps'
import { validateStep } from './validator'

interface rageSimulatorProps {
  wager: number
  iterations: number
}
const initialRageSimulator: rageSimulatorProps = {
  wager: 10,
  iterations: 1000000,
}
interface SimulatorContextInterface {
  selectedItem: jackpotsI | any
  setSelectedItem: Dispatch<SetStateAction<jackpotsI | null>>
  steps: SimulatorSteps
  setSteps: Dispatch<SetStateAction<SimulatorSteps>>
  nextStep: any
  previousStep: any
  isLoading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  updateField: Function
  currentInfo: ReactNode
  setCurrentInfo: Dispatch<SetStateAction<ReactNode>>
  errors: any
  setErrors: Dispatch<SetStateAction<any>>
  rageSimulator: rageSimulatorProps
  setRageSimulator: Dispatch<SetStateAction<rageSimulatorProps>>
  updateContributionFrequency: Function
  updateWinFrequency: Function
  individualContributionSetup: boolean
  setIndividualContributionSetup: Dispatch<SetStateAction<boolean>>
  simulatorResponse: any
  setSimulatorResponse: Dispatch<SetStateAction<any>>
  handleSimulate: Function
}
export const SimulatorCrudContext = createContext<SimulatorContextInterface>({
  selectedItem: null,
  setSelectedItem: () => {},
  steps: 'setup',
  setSteps: () => {},
  nextStep: (step: any) => step,
  previousStep: (step: any) => step,
  isLoading: false,
  setLoading: () => {},
  updateField: () => {},
  currentInfo: '',
  setCurrentInfo: () => {},
  errors: {},
  setErrors: () => {},
  rageSimulator: initialRageSimulator,
  setRageSimulator: () => {},
  updateContributionFrequency: () => {},
  updateWinFrequency: () => {},
  individualContributionSetup: false,
  setIndividualContributionSetup: () => {},
  simulatorResponse: null,
  setSimulatorResponse: () => {},
  handleSimulate: () => {},
})

export default function SimulatorLayout() {
  const [selectedItem, setSelectedItem] = useState<jackpotsI | null>(
    defaultJackpot,
  )
  const [isLoading, setLoading] = useState<boolean>(false)
  const [steps, setSteps] = useState<SimulatorSteps>('setup')
  const [currentInfo, setCurrentInfo] = useState<ReactNode>('')
  const [simulatorResponse, setSimulatorResponse] = useState<any>(null)
  const [errors, setErrors] = useState<any>({ count: 0 })
  const [rageSimulator, setRageSimulator] = useState<rageSimulatorProps>(initialRageSimulator)
  const { nextStep, previousStep } = useStep(
    (selectedItem?.type || 'CLASSIC') as JackpotType,
  )
  const { currentBrand } = useContext(BrandContext)
  function areFrequenciesEqual({
    winFrequency,
    contributionFrequency,
  }: JackpotI): boolean {
    if (
      !winFrequency
      || !contributionFrequency
      || !winFrequency.frequency
      || !contributionFrequency.frequency
    ) {
      return false
    }

    const frequencyCheck = winFrequency.frequency === contributionFrequency.frequency
    const dayCheck = winFrequency.day === contributionFrequency.day
    const startTimeOfDayCheck = winFrequency.startTimeOfDay === contributionFrequency.startTimeOfDay
    const endTimeOfDayCheck = winFrequency.endTimeOfDay === contributionFrequency.endTimeOfDay

    return (
      frequencyCheck && dayCheck && startTimeOfDayCheck && endTimeOfDayCheck
    )
  }
  const [individualContributionSetup, setIndividualContributionSetup] = useState(selectedItem?.id ? !areFrequenciesEqual(selectedItem) : false)
  useEffect(() => {
    if (currentBrand) {
      setSelectedItem((current: any) => {
        return { ...current, brand: currentBrand, type: 'CLASSIC' }
      })
    }
  }, [currentBrand])
  const { addPool } = usePoolForm(selectedItem, setSelectedItem)
  const { addSeed } = useSeedForm(selectedItem, setSelectedItem)
  useEffect(() => {
    if (!selectedItem?.pools || selectedItem?.pools?.length <= 0) {
      addPool()
      addSeed()
    }
  }, [])

  function updateField(fieldName: keyof jackpotsI, value: any) {
    setSelectedItem((current: any) => ({ ...current, [fieldName]: value }))
    setErrors((err: any) => ({ ...err, [fieldName]: '' }))
  }
  function updateContributionFrequency(field: string, value: any) {
    setSelectedItem((current: any) => ({
      ...current,
      contributionFrequency: {
        ...current.contributionFrequency,
        day:
          field === 'frequency' && value === 'DAILY'
            ? 0
            : current.contributionFrequency.day,
        [field]: value,
      },
    }))
    setErrors((err: any) => ({
      ...err,
      [`contributionFrequency-${field}`]: '',
    }))
  }
  function updateWinFrequency(field: string, value: any) {
    setSelectedItem((current: any) => ({
      ...current,
      winFrequency: {
        ...current.winFrequency,
        day:
          field === 'frequency' && value === 'DAILY'
            ? 0
            : current.winFrequency.day,
        [field]: value,
      },
    }))
    setErrors((err: any) => ({ ...err, [`winFrequency-${field}`]: '' }))
    if (!individualContributionSetup) {
      updateContributionFrequency(field, value)
    }
  }
  function handleSimulate() {
    setLoading(true)
    if (selectedItem) {
      buildJackpotSimulationBet({
        data: selectedItem,
        query: {
          iterations: rageSimulator.iterations,
          wager: rageSimulator.wager,
        },
      })
        .then((res) => {
          setLoading(false)
          setSimulatorResponse(res.data)
        })
        .catch((err) => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }
  useEffect(() => {
    setErrors(validateStep(steps, selectedItem))
  }, [selectedItem, steps])

  return (
    <SimulatorCrudContext.Provider
      value={{
        selectedItem,
        setSelectedItem,
        steps,
        setSteps,
        nextStep,
        previousStep,
        isLoading,
        setLoading,
        updateField,
        currentInfo,
        setCurrentInfo,
        errors,
        setErrors,
        rageSimulator,
        setRageSimulator,
        updateContributionFrequency,
        updateWinFrequency,
        individualContributionSetup,
        setIndividualContributionSetup,
        simulatorResponse,
        setSimulatorResponse,
        handleSimulate,
      }}
    >
      <Card color="secondary">
        <Grid>
          <Typography
            translateGroup="simulator"
            translateKey="simulator-form"
            size="lg"
            weight={700}
            style={{ width: '100%', textAlign: 'center' }}
          />
          <Typography
            translateGroup="sub-simulator"
            translateKey={steps}
            size="md"
            style={{ width: '100%', textAlign: 'center' }}
          />
        </Grid>
        <Grid>
          {PublicSteps[steps]}
          {currentInfo && (
            <Card
              color="info"
              responsiveWidth={{
                sm: 100,
                lg: '300px',
                xl: '400px',
                xxl: '450px',
              }}
              animateOnScroll
              animation="flip-left"
            >
              {currentInfo}
            </Card>
          )}
        </Grid>

        <FooterSimulator />
      </Card>
    </SimulatorCrudContext.Provider>
  )
}
