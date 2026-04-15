const normalizeFieldLabel = (field) => {
  if (!field || field === 'non_field_errors' || field === 'detail') {
    return ''
  }

  return field.replaceAll('_', ' ')
}

const collectMessages = (value, field = '') => {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    const label = normalizeFieldLabel(field)
    return [label ? `${label}: ${value}` : value]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectMessages(item, field))
  }

  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nestedValue]) => collectMessages(nestedValue, key))
  }

  return []
}

export default function formatApiError(error, fallback = 'Erreur lors de la sauvegarde.') {
  const messages = collectMessages(error?.response?.data).filter(Boolean)

  if (messages.length > 0) {
    return messages.join(' ')
  }

  return fallback
}
