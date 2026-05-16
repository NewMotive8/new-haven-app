import React from "react"
import { FaClock } from "react-icons/fa"
import InputGroup from "components/uiKit/inputs/inputGroup"
import Typography from "components/uiKit/typography"

interface InstantWinEditorProps {
  value?: string | null
  onChange: (newVal: string) => void
  errors?: any
}

export default function InstantWinEditor({
  value,
  onChange,
  errors,
}: InstantWinEditorProps) {
  return (
    <InputGroup
      id="instantWin"
      name="instantWin"
      label="Instant Win Time"
      icon={<FaClock size={16} />}
      inputType="datetime-local"
      value={value ?? ""}
      feedback={errors?.instantWin && <Typography {...errors.instantWin} />}
      status={errors?.instantWin ? "error" : undefined}
      onChange={({ target }) => onChange(target.value)}
    />
  )
}
