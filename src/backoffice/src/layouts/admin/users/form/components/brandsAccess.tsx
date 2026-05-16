import Grid from 'components/uiKit/grid'
import TypeButton, { btn } from 'components/uiKit/inputs/TypeButton'
import React, { useState } from 'react'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'
import { useQuery } from 'react-query'
import brandApi from 'utils/services/api/requests/brand'
import Loading from 'assets/loading'
import { FormContext } from '..'
import { CrudContext } from '../..'

export default function BrandsAccess() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField } = React.useContext(FormContext)
  const [listBrandsNo, setListBrandsNo] = useState<null | Array<btn>>(null)
  const [listBrandsWith, setListBrandsWith] = useState<null | Array<btn>>(null)
  const [selectBrand, setSelectBrand] = useState<btn | null>(null)
  const { isLoading } = useQuery('brands', () => brandApi.getItems(), {
    onSuccess: (row: any) => {
      const newDate = row.content.map((item: any) => {
        return {
          label: (
            <Typography
              translateGroup="typebutton-user"
              translateKey={item.name}
            />
          ),
          value: item.id,
        }
      })

      const loadingBrands = selectedItem?.brands.map((item: any) => {
        return {
          label: (
            <Typography
              translateGroup="typebutton-user"
              translateKey={item.name}
            />
          ),
          value: item.id,
        }
      })
      const filteredNewDate = newDate.filter(
        (item: any) => !loadingBrands.some(
            (loadingItem: any) => loadingItem.value === item.value,
          ),
      )
      setListBrandsNo(filteredNewDate)
      setListBrandsWith(loadingBrands)
    },
  })
  function handlerNext() {
    if (selectBrand) {
      const newItem = listBrandsNo?.find((it) => it.value === selectBrand)
      if (newItem) {
        const newListBrandsWith = listBrandsWith
          ? [...listBrandsWith, newItem]
          : [newItem]
        setListBrandsWith(newListBrandsWith)
        const newListBrandsNo = listBrandsNo
          ? listBrandsNo.filter((item) => item.value !== selectBrand)
          : []
        setListBrandsNo(newListBrandsNo)

        setSelectBrand(null)
        updateField('brands', newListBrandsWith)
      }
    }
  }

  function handlerPrevious() {
    if (selectBrand) {
      const newItem = listBrandsWith?.find((it) => it.value === selectBrand)

      if (newItem) {
        const newListBrandsNo = listBrandsNo
          ? [...listBrandsNo, newItem]
          : [newItem]
        setListBrandsNo(newListBrandsNo)
        const newListBrandsWith = listBrandsWith
          ? listBrandsWith.filter((item) => item.value !== selectBrand)
          : []
        setListBrandsWith(newListBrandsWith)
        setSelectBrand(null)
        updateField('brands', newListBrandsWith)
      }
    }
  }
  if (isLoading) {
    <Grid>
      <Loading />
    </Grid>
  }
  return (
    <Grid wrap="nowrap">
      <Grid width="40%">
        <Grid margin="mb-2" horizontalAlgin="center">
          <Typography translateGroup="header-card" translateKey="No Access" />

          {errors?.noAccess && (
            <Grid>
              <Typography size="xsm">{errors?.noAccess}</Typography>
            </Grid>
          )}
        </Grid>
        <Grid
          style={{
            display: 'block',
            maxHeight: '50vh',
            overflow: 'auto',
          }}
        >
          <TypeButton
            name="noAccess"
            orientation="vertical"
            value={selectBrand}
            onChange={({ target }) => {
              setSelectBrand(target.value)
            }}
            options={listBrandsNo || []}
          />
        </Grid>
      </Grid>
      <Grid gap="0.5rem" width="20%">
        <Grid horizontalAlgin="center">
          <Typography translateGroup="header-card" translateKey="Action" />
        </Grid>
        <Grid verticalAlgin="center" gap="0.5rem" style={{ marginTop: '50%' }}>
          <Grid horizontalAlgin="center">
            <Button
              id="add-item-button"
              type="button"
              color="primary"
              onClick={() => handlerNext()}
            >
              <AiOutlineRight />
            </Button>
          </Grid>
          <Grid horizontalAlgin="center">
            <Button
              id="add-item-button"
              type="button"
              color="primary"
              onClick={() => handlerPrevious()}
            >
              <AiOutlineLeft />
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid width="40%">
        <Grid margin="mb-2" horizontalAlgin="center">
          <Typography translateGroup="header-card" translateKey="With Access" />
          {errors?.withAccess && (
            <Grid>
              <Typography size="xsm">{errors?.withAccess}</Typography>
            </Grid>
          )}
        </Grid>
        <Grid
          style={{
            display: 'block',
            maxHeight: '50vh',
            overflow: 'auto',
          }}
        >
          <TypeButton
            name="withAccess"
            orientation="vertical"
            value={selectBrand}
            onChange={({ target }) => {
              setSelectBrand(target.value)
            }}
            options={listBrandsWith || []}
          />
        </Grid>
      </Grid>
    </Grid>
  )
}
