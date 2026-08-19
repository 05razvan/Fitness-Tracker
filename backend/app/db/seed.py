from app.db.database import SessionLocal
from app.db.models.exercise import Exercise


EXERCISES = [
    # CHEST
    {
        "name": "Barbell Bench Press",
        "primary_muscle": "Chest",
        "secondary_muscles": "Triceps, Shoulders",
        "movement_pattern": "Horizontal Push",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Incline Barbell Bench Press",
        "primary_muscle": "Chest",
        "secondary_muscles": "Triceps, Shoulders",
        "movement_pattern": "Horizontal Push",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Dumbbell Bench Press",
        "primary_muscle": "Chest",
        "secondary_muscles": "Triceps, Shoulders",
        "movement_pattern": "Horizontal Push",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Incline Dumbbell Press",
        "primary_muscle": "Chest",
        "secondary_muscles": "Triceps, Shoulders",
        "movement_pattern": "Horizontal Push",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Cable Chest Fly",
        "primary_muscle": "Chest",
        "secondary_muscles": "",
        "movement_pattern": "Horizontal Adduction",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Dumbbell Chest Fly",
        "primary_muscle": "Chest",
        "secondary_muscles": "",
        "movement_pattern": "Horizontal Adduction",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Push-Up",
        "primary_muscle": "Chest",
        "secondary_muscles": "Triceps, Shoulders",
        "movement_pattern": "Horizontal Push",
        "equipment": "Bodyweight",
        "exercise_type": "Bodyweight",
        "category": "Compound",
    },

    # BACK
    {
        "name": "Pull-Up",
        "primary_muscle": "Back",
        "secondary_muscles": "Biceps",
        "movement_pattern": "Vertical Pull",
        "equipment": "Bodyweight",
        "exercise_type": "Bodyweight",
        "category": "Compound",
    },
    {
        "name": "Chin-Up",
        "primary_muscle": "Back",
        "secondary_muscles": "Biceps",
        "movement_pattern": "Vertical Pull",
        "equipment": "Bodyweight",
        "exercise_type": "Bodyweight",
        "category": "Compound",
    },
    {
        "name": "Lat Pulldown",
        "primary_muscle": "Back",
        "secondary_muscles": "Biceps",
        "movement_pattern": "Vertical Pull",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Barbell Row",
        "primary_muscle": "Back",
        "secondary_muscles": "Biceps, Rear Delts",
        "movement_pattern": "Horizontal Pull",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Seated Cable Row",
        "primary_muscle": "Back",
        "secondary_muscles": "Biceps",
        "movement_pattern": "Horizontal Pull",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Single-Arm Dumbbell Row",
        "primary_muscle": "Back",
        "secondary_muscles": "Biceps",
        "movement_pattern": "Horizontal Pull",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Straight-Arm Pulldown",
        "primary_muscle": "Back",
        "secondary_muscles": "",
        "movement_pattern": "Shoulder Extension",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },

    # SHOULDERS
    {
        "name": "Barbell Overhead Press",
        "primary_muscle": "Shoulders",
        "secondary_muscles": "Triceps, Upper Chest",
        "movement_pattern": "Vertical Push",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Dumbbell Shoulder Press",
        "primary_muscle": "Shoulders",
        "secondary_muscles": "Triceps",
        "movement_pattern": "Vertical Push",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Dumbbell Lateral Raise",
        "primary_muscle": "Shoulders",
        "secondary_muscles": "",
        "movement_pattern": "Shoulder Abduction",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Cable Lateral Raise",
        "primary_muscle": "Shoulders",
        "secondary_muscles": "",
        "movement_pattern": "Shoulder Abduction",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Rear Delt Fly",
        "primary_muscle": "Shoulders",
        "secondary_muscles": "Upper Back",
        "movement_pattern": "Horizontal Abduction",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Face Pull",
        "primary_muscle": "Shoulders",
        "secondary_muscles": "Upper Back",
        "movement_pattern": "Horizontal Pull",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },

    # BICEPS
    {
        "name": "Barbell Curl",
        "primary_muscle": "Biceps",
        "secondary_muscles": "Forearms",
        "movement_pattern": "Elbow Flexion",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Dumbbell Curl",
        "primary_muscle": "Biceps",
        "secondary_muscles": "Forearms",
        "movement_pattern": "Elbow Flexion",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Hammer Curl",
        "primary_muscle": "Biceps",
        "secondary_muscles": "Brachialis, Forearms",
        "movement_pattern": "Elbow Flexion",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Cable Curl",
        "primary_muscle": "Biceps",
        "secondary_muscles": "Forearms",
        "movement_pattern": "Elbow Flexion",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },

    # TRICEPS
    {
        "name": "Cable Tricep Pushdown",
        "primary_muscle": "Triceps",
        "secondary_muscles": "",
        "movement_pattern": "Elbow Extension",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Overhead Cable Tricep Extension",
        "primary_muscle": "Triceps",
        "secondary_muscles": "",
        "movement_pattern": "Elbow Extension",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Skull Crusher",
        "primary_muscle": "Triceps",
        "secondary_muscles": "",
        "movement_pattern": "Elbow Extension",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Dumbbell Overhead Tricep Extension",
        "primary_muscle": "Triceps",
        "secondary_muscles": "",
        "movement_pattern": "Elbow Extension",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },

    # QUADS
    {
        "name": "Barbell Back Squat",
        "primary_muscle": "Quadriceps",
        "secondary_muscles": "Glutes, Hamstrings",
        "movement_pattern": "Squat",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Front Squat",
        "primary_muscle": "Quadriceps",
        "secondary_muscles": "Glutes, Core",
        "movement_pattern": "Squat",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Leg Press",
        "primary_muscle": "Quadriceps",
        "secondary_muscles": "Glutes, Hamstrings",
        "movement_pattern": "Squat",
        "equipment": "Machine",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Leg Extension",
        "primary_muscle": "Quadriceps",
        "secondary_muscles": "",
        "movement_pattern": "Knee Extension",
        "equipment": "Machine",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },

    # HAMSTRINGS / GLUTES
    {
        "name": "Romanian Deadlift",
        "primary_muscle": "Hamstrings",
        "secondary_muscles": "Glutes, Lower Back",
        "movement_pattern": "Hip Hinge",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Conventional Deadlift",
        "primary_muscle": "Hamstrings",
        "secondary_muscles": "Glutes, Back",
        "movement_pattern": "Hip Hinge",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Leg Curl",
        "primary_muscle": "Hamstrings",
        "secondary_muscles": "",
        "movement_pattern": "Knee Flexion",
        "equipment": "Machine",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Hip Thrust",
        "primary_muscle": "Glutes",
        "secondary_muscles": "Hamstrings",
        "movement_pattern": "Hip Extension",
        "equipment": "Barbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },
    {
        "name": "Bulgarian Split Squat",
        "primary_muscle": "Quadriceps",
        "secondary_muscles": "Glutes, Hamstrings",
        "movement_pattern": "Single-Leg Squat",
        "equipment": "Dumbbell",
        "exercise_type": "Weighted",
        "category": "Compound",
    },

    # CALVES
    {
        "name": "Standing Calf Raise",
        "primary_muscle": "Calves",
        "secondary_muscles": "",
        "movement_pattern": "Ankle Plantar Flexion",
        "equipment": "Machine",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
    {
        "name": "Seated Calf Raise",
        "primary_muscle": "Calves",
        "secondary_muscles": "",
        "movement_pattern": "Ankle Plantar Flexion",
        "equipment": "Machine",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },

    # CORE
    {
        "name": "Plank",
        "primary_muscle": "Core",
        "secondary_muscles": "Shoulders",
        "movement_pattern": "Anti-Extension",
        "equipment": "Bodyweight",
        "exercise_type": "Bodyweight",
        "category": "Isolation",
    },
    {
        "name": "Hanging Leg Raise",
        "primary_muscle": "Core",
        "secondary_muscles": "Hip Flexors",
        "movement_pattern": "Hip Flexion",
        "equipment": "Bodyweight",
        "exercise_type": "Bodyweight",
        "category": "Isolation",
    },
    {
        "name": "Cable Crunch",
        "primary_muscle": "Core",
        "secondary_muscles": "",
        "movement_pattern": "Spinal Flexion",
        "equipment": "Cable",
        "exercise_type": "Weighted",
        "category": "Isolation",
    },
]


def seed_exercises():
    db = SessionLocal()

    try:
        added = 0

        for exercise_data in EXERCISES:
            existing = (
                db.query(Exercise)
                .filter(Exercise.name == exercise_data["name"])
                .first()
            )

            if existing:
                continue

            db.add(Exercise(**exercise_data))
            added += 1

        db.commit()

        print(f"Added {added} exercises.")
        print(f"Exercise library contains {db.query(Exercise).count()} exercises.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_exercises()
