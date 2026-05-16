import Loading from 'assets/loading'
import { textTranslated } from 'components/TextTranslated'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Toggle from 'components/uiKit/inputs/Toggle'
import Typography from 'components/uiKit/typography'
import React, { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useRouter } from 'next/router'
import { toastError, toastSuccess } from 'utils/functions/notifications'
import brandProductsApi, { BrandProductAssignmentI } from 'utils/services/api/requests/brandProducts'
import productsApi, { productsI } from 'utils/services/api/requests/products'
import { CrudContext } from '../..'

type BrandProductRowI = {
  product: productsI
  assignment: BrandProductAssignmentI | null
  assigned: boolean
}

function toArray(data: any): Array<any> {
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.content)) {
    return data.content
  }
  return []
}

export default function ProductsTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const router = useRouter()
  const brandId = selectedItem?.id
  const [actionKey, setActionKey] = React.useState<string | null>(null)

  const {
    data: catalogResponse,
    isLoading: loadingCatalog,
  } = useQuery(
    ['products-catalog-list', brandId],
    () => productsApi.getItems({ page: 0, size: 1000 }),
    { enabled: !!brandId },
  )

  const {
    data: assignments = [],
    isLoading: loadingAssignments,
    refetch,
  } = useQuery(
    ['brand-product-assignments', brandId],
    () => brandProductsApi.listBrandProducts(brandId as number),
    { enabled: !!brandId },
  )

  const rows = useMemo(() => {
    const catalog = toArray(catalogResponse?.content)
    const assignmentMap = new Map<number, BrandProductAssignmentI>()

    assignments.forEach((assignment: BrandProductAssignmentI) => {
      const productId = assignment.productId || assignment.product?.id
      if (productId) {
        assignmentMap.set(productId, assignment)
      }
    })

    return (catalog as Array<productsI>)
      .map((product) => {
        const assignment = assignmentMap.get(product.id) || null
        return {
          product,
          assignment,
          assigned: !!assignment,
        } as BrandProductRowI
      })
      .sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''))
  }, [catalogResponse?.content, assignments])

  async function handleAssignToggle(row: BrandProductRowI) {
    if (!brandId) {
      return
    }
    const key = `assign-${row.product.id}`
    setActionKey(key)
    try {
      if (row.assigned) {
        await brandProductsApi.unassignProductFromBrand(brandId, row.product.id)
      } else {
        await brandProductsApi.assignProductToBrand(brandId, row.product.id, { enabled: true })
      }
      await refetch()
      toastSuccess(textTranslated({ group: 'toast-notifications', key: 'generic-update-success' }))
    } catch (e) {
      toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
    } finally {
      setActionKey(null)
    }
  }

  async function handleEnabledToggle(row: BrandProductRowI, enabled: boolean) {
    if (!brandId || !row.assigned) {
      return
    }
    const key = `enabled-${row.product.id}`
    setActionKey(key)
    try {
      await brandProductsApi.toggleBrandProductEnabled(brandId, row.product.id, enabled)
      await refetch()
      toastSuccess(textTranslated({ group: 'toast-notifications', key: 'generic-update-success' }))
    } catch (e) {
      toastError(textTranslated({ group: 'toast-notifications', key: 'generic-error-message' }))
    } finally {
      setActionKey(null)
    }
  }

  if (loadingCatalog || loadingAssignments) {
    return (
      <Grid padding={['pt-4', 'pb-4']}>
        <Loading />
      </Grid>
    )
  }

  return (
    <Grid gap="0.75rem">
      <Grid horizontalAlgin="space-between" verticalAlgin="center" margin="mb-2">
        <Typography size="md" weight={700}>
          Brand Product Assignments
        </Typography>
        <Button id="go-to-product-catalog" color="secondary" onClick={() => router.push('/root/products')}>
          <Typography>Open Product Catalog</Typography>
        </Button>
      </Grid>

      {!rows.length && (
        <Typography>No products found in catalog. Create a product first, then assign it to this brand.</Typography>
      )}

      {rows.map((row) => {
        const assignBusy = actionKey === `assign-${row.product.id}`
        const enabledBusy = actionKey === `enabled-${row.product.id}`
        const busy = assignBusy || enabledBusy

        return (
          <Grid
            key={`brand-product-${row.product.id}`}
            padding={['p-3']}
            style={{ border: '1px solid var(--card-border)', borderRadius: '4pt' }}
            verticalAlgin="center"
            wrap="nowrap"
            gap="1rem"
          >
            <Grid>
              <Typography weight={700}>{row.product.name || `Product ${row.product.id}`}</Typography>
              <Typography size="sm">{row.product.location || '-'}</Typography>
            </Grid>
            <Grid width="fit-content">
              <Toggle
                id={`assigned-${row.product.id}`}
                name={`assigned-${row.product.id}`}
                label={<Typography size="sm">Assigned</Typography>}
                value={row.assigned}
                onChange={() => handleAssignToggle(row)}
              />
            </Grid>
            <Grid width="fit-content">
              {row.assigned ? (
                <Toggle
                  id={`enabled-${row.product.id}`}
                  name={`enabled-${row.product.id}`}
                  label="enabled"
                  value={!!row.assignment?.enabled}
                  onChange={({ target }) => handleEnabledToggle(row, target.value)}
                />
              ) : (
                <Typography size="sm">Not assigned</Typography>
              )}
            </Grid>
            <Grid width="fit-content" hidden={!busy}>
              <Loading size={25} />
            </Grid>
          </Grid>
        )
      })}
    </Grid>
  )
}
