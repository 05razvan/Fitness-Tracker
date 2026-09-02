import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
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

export const updateWorkout = async (id, data) => {
  const response = await api.patch(`/workouts/${id}`, data)
  return response.data
}

export const completeWorkout = async (id) => {
  const response = await api.patch(`/workouts/${id}/complete`)
  return response.data
}

export const getWorkoutPresets = async () => {
  const response = await api.get('/presets/')
  return response.data
}

export const startWorkoutFromPreset = async (presetId) => {
  const response = await api.post(`/presets/${presetId}/start`)
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

export const addWorkoutSet = async (workoutExerciseId) => {
  const response = await api.post(`/workouts/exercises/${workoutExerciseId}/sets`)
  return response.data
}

export const deleteWorkoutSet = async (setId) => {
  await api.delete(`/workouts/sets/${setId}`)
}

export const addWorkoutExercise = async (workoutId, data) => {
  const response = await api.post(`/workouts/${workoutId}/exercises`, data)
  return response.data
}

export const deleteWorkoutExercise = async (workoutExerciseId) => {
  await api.delete(`/workouts/exercises/${workoutExerciseId}`)
}

export const reorderWorkoutExercises = async (workoutId, orderedExerciseIds) => {
  await api.patch(`/workouts/${workoutId}/exercises/order`, {
    ordered_exercise_ids: orderedExerciseIds,
  })
}

export default api
