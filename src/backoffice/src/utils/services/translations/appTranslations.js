import defaultT from './default.json'

async function appTranslations() {
  try {
    const response = await fetch('http://localhost:19100/api/v1/internal/translations')
    if (!response.ok) throw new Error('Network response was not ok')
    const data = await response.json()
    return data.length ? data : defaultT
  } catch (error) {
    return defaultT
  }
}

export default appTranslations
