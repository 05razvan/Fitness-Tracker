import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getWorkouts = async () => {
  const response = await api.get('/workouts/')
  return response.data
}

export const getWorkout = async (id) => {
  const response = await api.get(`/workouts/${id}`)
  return response.data
}

export const getExercises = async (params = {}) => {
  const response = await api.get('/exercises/', { params })
  return response.data
}

export const getExerciseProgression = async (id) => {
  const response = await api.get(`/exercises/${id}/progression`)
  return response.data
}

export const getExercisePlateau = async (id) => {
  const response = await api.get(`/exercises/${id}/plateau`)
  return response.data
}

export const getExerciseRecommendation = async (id) => {
  const response = await api.get(`/recommendations/exercise/${id}`)
  return response.data
}

export const updateWorkoutSet = async (setId, data) => {
  const response = await api.patch(`/workouts/sets/${setId}`, data)
  return response.data
}



export default api
