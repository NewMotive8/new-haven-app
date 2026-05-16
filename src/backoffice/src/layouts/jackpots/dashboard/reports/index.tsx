import React, { useRef, useContext, useEffect } from 'react'
import SnapshotReport from './snapshots/snapshotReport'
import { DashboardContext } from '..'

export default function ChartsSection() {
  const { currentJackpot, setCurrentJackpot } = useContext(DashboardContext)
  const containerRef: any = useRef()

  useEffect(() => {
    if (containerRef.current) {
      if (containerRef.current.clientWidth < 360) {
        containerRef.current.style.width = '100%'
      } else {
        containerRef.current.style.width = 'calc(100% - 380px)'
      }
    }
  }, [currentJackpot])

  return (
    <div ref={containerRef}>
      <SnapshotReport
        jackpotId={currentJackpot?.id}
        jackpotName={currentJackpot?.internalName}
      />
    </div>
  )
}