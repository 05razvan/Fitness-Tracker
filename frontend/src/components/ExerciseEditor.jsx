import { useState } from 'react'

const initialValues = {
  name: '',
  primary_muscle: '',
  secondary_muscles: '',
  movement_pattern: '',
  equipment: '',
  exercise_type: 'Weighted',
  category: 'Compound',
}

function ExerciseEditor({ initialExercise = null, onSave, onCancel, saving }) {
  const [values, setValues] = useState(
    initialExercise
      ? Object.fromEntries(Object.keys(initialValues).map((key) => [key, initialExercise[key] || initialValues[key]]))
      : initialValues,
  )
  const required = ['name', 'primary_muscle', 'exercise_type', 'category']
  const canSave = required.every((field) => values[field].trim())

  const update = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSave || saving) return
    onSave(Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim() || null]),
    ))
  }

  return (
    <form className="exercise-editor" onSubmit={handleSubmit}>
      <div className="exercise-editor-heading">
        <div><span className="eyebrow">{initialExercise ? 'EDIT EXERCISE' : 'CUSTOM EXERCISE'}</span><h2>{initialExercise ? `Update ${initialExercise.name}` : 'Add to your library'}</h2></div>
        <button type="button" onClick={onCancel} aria-label="Close editor">×</button>
      </div>
      <div className="exercise-editor-grid">
        <label><span>NAME</span><input value={values.name} onChange={(event) => update('name', event.target.value)} maxLength={150} placeholder="Chest-Supported Row" autoFocus /></label>
        <label><span>PRIMARY MUSCLE</span><input value={values.primary_muscle} onChange={(event) => update('primary_muscle', event.target.value)} maxLength={100} placeholder="Back" /></label>
        <label><span>SECONDARY MUSCLES</span><input value={values.secondary_muscles} onChange={(event) => update('secondary_muscles', event.target.value)} maxLength={500} placeholder="Biceps, Rear Delts" /></label>
        <label><span>MOVEMENT PATTERN</span><input value={values.movement_pattern} onChange={(event) => update('movement_pattern', event.target.value)} maxLength={100} placeholder="Horizontal Pull" /></label>
        <label><span>EQUIPMENT</span><input value={values.equipment} onChange={(event) => update('equipment', event.target.value)} maxLength={100} placeholder="Machine" /></label>
        <label><span>EXERCISE TYPE</span><select value={values.exercise_type} onChange={(event) => update('exercise_type', event.target.value)}><option>Weighted</option><option>Bodyweight</option><option>Cardio</option><option>Mobility</option></select></label>
        <label><span>CATEGORY</span><select value={values.category} onChange={(event) => update('category', event.target.value)}><option>Compound</option><option>Isolation</option><option>Conditioning</option><option>Mobility</option></select></label>
      </div>
      <div className="exercise-editor-footer">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="exercise-editor-save" disabled={!canSave || saving}>{saving ? 'Saving...' : initialExercise ? 'Save changes' : 'Create exercise'}</button>
      </div>
    </form>
  )
}

export default ExerciseEditor
