import { GetServerSidePropsContext } from 'next'
import { defaultServerSideProps } from 'utils/functions/serverSide'
import BackofficeLanding from 'components/backofficeLanding/BackofficeLanding'

export default function HomePage() {
   return <BackofficeLanding />
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return defaultServerSideProps(context)
}
