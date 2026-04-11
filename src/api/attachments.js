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
