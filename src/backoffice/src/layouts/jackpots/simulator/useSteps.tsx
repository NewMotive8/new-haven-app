import { useMemo } from 'react'

export type JackpotType = 'CLASSIC' | 'MUST_DROP' | 'MULTI_LEVEL'
export type SimulatorSteps =
  | 'setup'
  | 'model'
  | 'pool'
  | 'seed'
  | 'result'
  | 'schedule'
  | 'poolMultiLevel'
  | 'seedMultiLevel'

export interface StepMappings {
  nextStep: Record<SimulatorSteps, SimulatorSteps>
  previousStep: Record<SimulatorSteps, SimulatorSteps>
}
const sequence: Record<JackpotType, SimulatorSteps[]> = {
  CLASSIC: ['setup', 'model', 'pool', 'seed', 'result'],
  MUST_DROP: ['setup', 'schedule', 'model', 'pool', 'seed', 'result'],
  MULTI_LEVEL: ['setup', 'model', 'poolMultiLevel', 'seedMultiLevel', 'result'],
}

const createMappings = (steps: SimulatorSteps[]) => {
  const nextStep: Partial<Record<SimulatorSteps, SimulatorSteps>> = {}
  const previousStep: Partial<Record<SimulatorSteps, SimulatorSteps>> = {}

  steps.forEach((step, index) => {
    nextStep[step] = steps[index + 1] || step
    previousStep[step] = steps[index - 1] || step
  })

  return { nextStep, previousStep }
}

export function useStep(jackpotType: JackpotType) {
  return useMemo(() => {
    const selectedSequence = sequence[jackpotType]
    return createMappings(selectedSequence)
  }, [jackpotType])
}
