import { useContext } from 'react'
import { SimulatorCrudContext } from '../..'
import ClassicForm from './form/classic'
import FrequencyForm from './form/frequency'
import MustDropForm from './form/mustDrop'

export default function ScheduleSteps() {
  const { selectedItem } = useContext(SimulatorCrudContext)
  if (selectedItem.type === 'MUST_DROP') {
    return <MustDropForm />
  }
  if (selectedItem.type === 'FREQUENCY') {
    return <FrequencyForm />
  }
  return <ClassicForm />
}
