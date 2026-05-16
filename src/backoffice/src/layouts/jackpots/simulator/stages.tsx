import ModelSteps from './steps/model'
import FormPoolMulti from './steps/pool/form/multiple'
import FormPool from './steps/pool/form/simple'
import ResultSteps from './steps/result'
import ScheduleSteps from './steps/schedule'
import FormSeedMulti from './steps/seed/form/multiple'
import FormSeed from './steps/seed/form/simple'
import SetupSteps from './steps/setup'

export const PublicSteps = {
  setup: <SetupSteps />,
  model: <ModelSteps />,
  pool: <FormPool />,
  seed: <FormSeed />,
  schedule: <ScheduleSteps />,
  result: <ResultSteps />,
  poolMultiLevel: <FormPoolMulti />,
  seedMultiLevel: <FormSeedMulti />,
}
