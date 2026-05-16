import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import brandApi from 'utils/services/api/requests/brand'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import EditorGroup from 'components/uiKit/inputs/Editor'
import Loading from 'assets/loading'
import { toastError } from 'utils/functions/notifications'
import { CrudContext } from '../..'
import { FormContext } from '..'

export default function SignatureTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo,
    } = React.useContext(FormContext)
    const [loading, setLoading] = React.useState(false)
    const [state, setState] = React.useState({
        playerId: '',
        eventId: '',
        signature: '',
        signatureVerified: '',
    })

    function generateSignature() {
        setLoading(true)
        brandApi.generateSignature({ brandId: `${selectedItem?.id}`, eventId: state.eventId, playerId: `${state.playerId}` })
            .then((res: any) => {
                setLoading(false)
                setState((current) => ({ ...current, signature: res.data }))
            }).catch(() => {
                setLoading(false)
                toastError('Something went wrong')
            })
    }

    function verifySignature() {
        setLoading(true)
        brandApi.verifySignature({ brandId: `${selectedItem?.id}`, signature: state.signature })
            .then((res: any) => {
                setLoading(false)
                setState((current) => ({ ...current, signatureVerified: res.data }))
            }).catch(() => {
                setLoading(false)
                toastError('Something went wrong')
            })
    }

    function updateState(field: string, value: string) {
        setState((current) => ({ ...current, [field]: value }))
    }

    return (
        <Grid gap="1.5rem">
            <Grid gap="0.5rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 1.25rem)' }}>
                <Grid>
                    <Typography
                        translateGroup="signature-tab"
                        translateKey="Generate-signature"
                        size="md"
                        weight={700}
                        style={{ width: '100%' }}
                    />
                </Grid>
                <Grid>
                    <InputGroup
                        id="playerId"
                        name="playerId"
                        label="playerId"
                        feedback={errors?.playerId}
                        status={errors?.playerId && 'error'}
                        value={state.playerId}
                        onChange={({ target }) => { updateState(target.name, target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-playerId-help', returnDefault: 'nothing' }))}
                    />
                </Grid>
                <Grid>
                    <InputGroup
                        id="eventId"
                        name="eventId"
                        label="eventId"
                        feedback={errors?.eventId}
                        status={errors?.eventId && 'error'}
                        value={selectedItem.eventId}
                        onChange={({ target }) => { updateState(target.name, target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-eventId-help', returnDefault: 'nothing' }))}
                    />
                </Grid>
                <Grid>
                    <Button
                        disabled={loading || !state.playerId || !state.eventId || !selectedItem.id}
                        id="generate-signature-cta"
                        onClick={() => generateSignature()}
                    >
                        {
                            loading && <Loading />
                        }
                        <Typography
                            translateGroup="signature-tab"
                            translateKey="generate-signature"
                        />
                    </Button>
                </Grid>
                <Grid hidden={!state.signature}>
                    <Typography
                        translateGroup="signature-tab"
                        translateKey="generated-signature"
                        style={{ width: '100%' }}
                    />
                    <Typography
                        size="md"
                        weight={600}
                        style={{
                            width: '100%',
                            overflowWrap: 'break-word',
                        }}
                    >
                        {state.signature}
                    </Typography>

                </Grid>
            </Grid>
            <Grid gap="1rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                <Grid>
                    <Typography
                        translateGroup="signature-tab"
                        translateKey="verify-signature"
                        size="md"
                        weight={700}
                        style={{ width: '100%' }}
                    />
                </Grid>
                <Grid>
                    <InputGroup
                        id="signature"
                        name="signature"
                        label="signature"
                        feedback={errors?.signature}
                        status={errors?.signature && 'error'}
                        value={state.signature}
                        onChange={({ target }) => { updateState(target.name, target.value) }}
                        onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-signature-help', returnDefault: 'nothing' }))}
                    />
                </Grid>
                <Grid>
                    <Button
                        disabled={loading || !state.signature || !selectedItem.id}
                        id="verify-signature-cta"
                        onClick={() => verifySignature()}
                    >
                        {
                            loading && <Loading />
                        }
                        <Typography
                            translateGroup="signature-tab"
                            translateKey="verify-signature"
                        />
                    </Button>
                </Grid>
                <Grid hidden={!state.signature}>
                    <Typography
                        translateGroup="signature-tab"
                        translateKey="verified-signature"
                        style={{ width: '100%' }}
                    />
                    <Typography size="md" weight={600}>
                        {state.signatureVerified}
                    </Typography>

                </Grid>

            </Grid>
        </Grid>
    )
}
