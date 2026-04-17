import api from './client'

export const getProfile = () => api.get('/profile')
export const updateProfile = (data) => api.put('/profile', data)
export const changePassword = (data) => api.put('/profile/password', data)
export const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('avatar', file)
  return api.post('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
