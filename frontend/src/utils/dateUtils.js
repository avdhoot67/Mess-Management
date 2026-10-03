export const formatDate = (dateString) => {
  if (!dateString) return ''

  const [year, month, day] = dateString.split('-')

  return `${day}-${month}-${year}`
}

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
