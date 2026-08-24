import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AppLayout from './layouts/AppLayout'

import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import Exercises from './pages/Exercises'
import Progress from './pages/Progress'
import WorkoutSession from './pages/WorkoutSession'
import ExerciseDetail from './pages/ExerciseDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/:id" element={<WorkoutSession />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/exercises/:exerciseId" element={<ExerciseDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App