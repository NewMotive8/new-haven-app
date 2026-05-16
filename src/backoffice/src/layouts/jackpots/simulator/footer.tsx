import Loading from 'assets/loading'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { useRouter } from 'next/router'
import { useContext } from 'react'
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md'
import { SimulatorCrudContext } from '.'

export default function FooterSimulator() {
  const {
    selectedItem,
    steps,
    setSteps,
    previousStep,
    isLoading,
    errors,
    nextStep,
    handleSimulate,
  } = useContext(SimulatorCrudContext)
  const routes = useRouter()
  return (
    <Grid horizontalAlgin="flex-end" verticalAlgin="center" gap="0.5rem">
      <Button
        id="crud-next-tab"
        disabled={steps === 'setup'}
        type="button"
        color="primary"
        onClick={() => setSteps(previousStep[steps])}
      >
        <Grid
          wrap="nowrap"
          gap="0.25rem"
          horizontalAlgin="center"
          verticalAlgin="center"
        >
          <MdNavigateBefore />
          <Typography translateGroup="global" translateKey="back" />
          {isLoading && <Loading size={30} />}
        </Grid>
      </Button>
      <Button
          id="crud-next-tab"
          type="button"
          color="primary"
          disabled={steps === 'result' || !!errors?.count}
          onClick={() => {
            if (steps === 'seed' || steps === 'seedMultiLevel') {
              handleSimulate()
            }
            setSteps(nextStep[steps])
          }}
      >
          <Grid
            wrap="nowrap"
            gap="0.25rem"
            horizontalAlgin="center"
            verticalAlgin="center"
          >
            <Typography translateGroup="global" translateKey="next" />
            <MdNavigateNext />
            {isLoading && <Loading size={30} />}
          </Grid>
      </Button>
      {/* {steps === 'result' ? (
        <Button
          id="crud-next-tab"
          type="button"
          color="primary-full"
          disabled={!!errors?.count}
          onClick={() => {
            localStorage.setItem('simulator', JSON.stringify(selectedItem))
            routes.push('/jackpots')
          }}
        >
          <Grid
            wrap="nowrap"
            gap="0.25rem"
            horizontalAlgin="center"
            verticalAlgin="center"
          >
            <Typography translateGroup="global" translateKey="Add" />
            {isLoading && <Loading size={30} />}
          </Grid>
        </Button>
      ) : (
        <Button
          id="crud-next-tab"
          type="button"
          color="primary"
          disabled={!!errors?.count}
          onClick={() => {
            if (steps === 'seed' || steps === 'seedMultiLevel') {
              handleSimulate()
            }
            setSteps(nextStep[steps])
          }}
        >
          <Grid
            wrap="nowrap"
            gap="0.25rem"
            horizontalAlgin="center"
            verticalAlgin="center"
          >
            <Typography translateGroup="global" translateKey="next" />
            <MdNavigateNext />
            {isLoading && <Loading size={30} />}
          </Grid>
        </Button>
      )} */}
    </Grid>
  )
}
