import api from './client'

export const getAttachments = (entityType, entityId) =>
  api.get(`/attachments/${entityType}/${entityId}`)

export const uploadAttachment = (entityType, entityId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/attachments/${entityType}/${entityId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const deleteAttachment = (id) => api.delete(`/attachments/${id}`)

export const downloadAttachment = (storedName, filename) =>
  api.get(`/attachments/file/${storedName}`, { responseType: 'blob' }).then(res => {
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noreferrer'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  })
