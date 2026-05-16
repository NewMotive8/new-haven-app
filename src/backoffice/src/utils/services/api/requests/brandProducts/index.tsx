import { api } from '../..'
import urls from '../../urls'
import { productsI } from '../products'

export interface BrandProductAssignmentI {
  brandId: number
  productId: number
  enabled: boolean
  product?: productsI | null
  [key: string]: any
}

interface UpsertPayloadI {
  enabled: boolean
  [key: string]: any
}

function getArrayPayload(data: any): Array<any> {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.content)) {
    return data.content
  }

  return []
}

async function listBrandProducts(brandId: number) {
  const url = urls.brandProducts.list.replace('{{brandId}}', `${brandId}`)
  return api.get(url).then((res) => getArrayPayload(res.data) as Array<BrandProductAssignmentI>)
}

async function assignProductToBrand(brandId: number, productId: number, payload: UpsertPayloadI) {
  const url = urls.brandProducts.upsert
    .replace('{{brandId}}', `${brandId}`)
    .replace('{{productId}}', `${productId}`)
  return api.put(url, payload).then((res) => res.data)
}

async function unassignProductFromBrand(brandId: number, productId: number) {
  const url = urls.brandProducts.delete
    .replace('{{brandId}}', `${brandId}`)
    .replace('{{productId}}', `${productId}`)
  return api.delete(url).then((res) => res.data)
}

async function toggleBrandProductEnabled(brandId: number, productId: number, enabled: boolean) {
  return assignProductToBrand(brandId, productId, { enabled })
}

const brandProductsApi = {
  listBrandProducts,
  assignProductToBrand,
  unassignProductFromBrand,
  toggleBrandProductEnabled,
}

export default brandProductsApi
