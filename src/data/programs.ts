import { Program } from "@/types/training";

export const programs: Program[] = [
  {
    id: "strength-muscle",
    name: "Strength & Muscle",
    description: "Build strength and muscle mass with progressive overload training",
    icon: "Dumbbell",
    weeks: [
      {
        id: "sm-week-1",
        weekNumber: 1,
        name: "Foundation Week",
        workouts: [
          {
            id: "sm-w1-d1",
            dayNumber: 1,
            name: "Upper Push",
            duration: 75,
            warmUp: [
              { id: "wu1", name: "Dynamic Shoulder Circles", sets: 2, reps: "10 each direction" },
              { id: "wu2", name: "Band Pull-Aparts", sets: 2, reps: "15" },
              { id: "wu3", name: "Push-up Prep", sets: 2, reps: "10" }
            ],
            mainLifts: [
              { id: "ml1", name: "Barbell Bench Press", sets: 4, reps: "6-8", rpe: 8 },
              { id: "ml2", name: "Overhead Press", sets: 4, reps: "8-10", rpe: 7 }
            ],
            accessories: [
              { id: "acc1", name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
              { id: "acc2", name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15" },
              { id: "acc3", name: "Tricep Pushdowns", sets: 3, reps: "12-15" }
            ],
            conditioning: [
              { id: "con1", name: "Bike Sprint Intervals", time: "10 min", notes: "20s on / 40s off" }
            ]
          },
          {
            id: "sm-w1-d2",
            dayNumber: 2,
            name: "Lower Body",
            duration: 75,
            warmUp: [
              { id: "wu1", name: "Leg Swings", sets: 2, reps: "10 each leg" },
              { id: "wu2", name: "Goblet Squat", sets: 2, reps: "10" },
              { id: "wu3", name: "Hip Circles", sets: 2, reps: "10 each direction" }
            ],
            mainLifts: [
              { id: "ml1", name: "Back Squat", sets: 4, reps: "6-8", rpe: 8 },
              { id: "ml2", name: "Romanian Deadlift", sets: 4, reps: "8-10", rpe: 7 }
            ],
            accessories: [
              { id: "acc1", name: "Bulgarian Split Squat", sets: 3, reps: "10 each leg" },
              { id: "acc2", name: "Leg Curl", sets: 3, reps: "12-15" },
              { id: "acc3", name: "Calf Raises", sets: 3, reps: "15-20" }
            ],
            conditioning: [
              { id: "con1", name: "Sled Push", sets: 4, distance: "20m", notes: "Heavy" }
            ]
          },
          {
            id: "sm-w1-d3",
            dayNumber: 3,
            name: "Upper Pull",
            duration: 75,
            warmUp: [
              { id: "wu1", name: "Band Dislocations", sets: 2, reps: "15" },
              { id: "wu2", name: "Scapular Pull-ups", sets: 2, reps: "10" },
              { id: "wu3", name: "Dead Hangs", sets: 2, time: "20s" }
            ],
            mainLifts: [
              { id: "ml1", name: "Barbell Row", sets: 4, reps: "6-8", rpe: 8 },
              { id: "ml2", name: "Weighted Pull-ups", sets: 4, reps: "6-8", rpe: 8 }
            ],
            accessories: [
              { id: "acc1", name: "Single Arm Dumbbell Row", sets: 3, reps: "10-12 each" },
              { id: "acc2", name: "Face Pulls", sets: 3, reps: "15-20" },
              { id: "acc3", name: "Hammer Curls", sets: 3, reps: "12-15" }
            ],
            conditioning: [
              { id: "con1", name: "Assault Bike", time: "8 min", notes: "Moderate pace" }
            ]
          },
          {
            id: "sm-w1-d4",
            dayNumber: 4,
            name: "Full Body Power",
            duration: 60,
            warmUp: [
              { id: "wu1", name: "Jump Rope", time: "3 min" },
              { id: "wu2", name: "Box Jumps", sets: 2, reps: "5" },
              { id: "wu3", name: "Medicine Ball Slams", sets: 2, reps: "8" }
            ],
            mainLifts: [
              { id: "ml1", name: "Power Clean", sets: 5, reps: "3", rpe: 7 },
              { id: "ml2", name: "Front Squat", sets: 4, reps: "5", rpe: 8 }
            ],
            accessories: [
              { id: "acc1", name: "Dumbbell Push Press", sets: 3, reps: "8-10" },
              { id: "acc2", name: "Box Jumps", sets: 3, reps: "8" }
            ],
            conditioning: [
              { id: "con1", name: "EMOM 10 min", notes: "5 Burpees + 10 Kettlebell Swings" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "hyrox-conditioning",
    name: "Hyrox & Conditioning",
    description: "Race-specific training for Hyrox events and overall conditioning",
    icon: "Zap",
    weeks: [
      {
        id: "hc-week-1",
        weekNumber: 1,
        name: "Base Building",
        workouts: [
          {
            id: "hc-w1-d1",
            dayNumber: 1,
            name: "Running Foundation",
            duration: 60,
            warmUp: [
              { id: "wu1", name: "Dynamic Stretching", time: "5 min" },
              { id: "wu2", name: "Easy Jog", time: "5 min" }
            ],
            mainLifts: [
              { id: "ml1", name: "Tempo Run", time: "30 min", notes: "Zone 2-3 heart rate" }
            ],
            accessories: [],
            conditioning: [
              { id: "con1", name: "Sled Push", sets: 4, distance: "50m", notes: "Moderate pace" },
              { id: "con2", name: "Wall Balls", sets: 4, reps: "20" }
            ]
          },
          {
            id: "hc-w1-d2",
            dayNumber: 2,
            name: "Strength Station Focus",
            duration: 75,
            warmUp: [
              { id: "wu1", name: "Rowing Machine", time: "5 min", notes: "Easy pace" },
              { id: "wu2", name: "Dynamic Movement Prep", time: "5 min" }
            ],
            mainLifts: [
              { id: "ml1", name: "SkiErg", sets: 5, time: "2 min", notes: "Hard effort, 2 min rest" },
              { id: "ml2", name: "Sled Pull", sets: 5, distance: "50m" }
            ],
            accessories: [
              { id: "acc1", name: "Burpee Broad Jumps", sets: 4, reps: "10" },
              { id: "acc2", name: "Sandbag Lunges", sets: 3, distance: "40m" }
            ],
            conditioning: [
              { id: "con1", name: "Row Intervals", sets: 6, time: "1 min", notes: "Hard, 1 min rest" }
            ]
          },
          {
            id: "hc-w1-d3",
            dayNumber: 3,
            name: "Race Simulation",
            duration: 90,
            warmUp: [
              { id: "wu1", name: "Light Jog", time: "10 min" },
              { id: "wu2", name: "Station-specific Warm-up", time: "5 min" }
            ],
            mainLifts: [
              { id: "ml1", name: "Run 1km", notes: "Race pace" },
              { id: "ml2", name: "SkiErg", distance: "1000m" },
              { id: "ml3", name: "Run 1km", notes: "Race pace" },
              { id: "ml4", name: "Sled Push", distance: "50m x 2" }
            ],
            accessories: [],
            conditioning: [
              { id: "con1", name: "Cool Down Jog", time: "10 min" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "run-engine",
    name: "Run & Engine",
    description: "Build your aerobic engine and running performance",
    icon: "Activity",
    weeks: [
      {
        id: "re-week-1",
        weekNumber: 1,
        name: "Aerobic Base",
        workouts: [
          {
            id: "re-w1-d1",
            dayNumber: 1,
            name: "Long Slow Distance",
            duration: 60,
            warmUp: [
              { id: "wu1", name: "Walking", time: "5 min" },
              { id: "wu2", name: "Dynamic Leg Swings", sets: 2, reps: "10 each leg" }
            ],
            mainLifts: [
              { id: "ml1", name: "Easy Run", time: "45 min", notes: "Zone 2, conversational pace" }
            ],
            accessories: [],
            conditioning: [
              { id: "con1", name: "Core Circuit", time: "10 min", notes: "Planks, side planks, dead bugs" }
            ]
          },
          {
            id: "re-w1-d2",
            dayNumber: 2,
            name: "Interval Training",
            duration: 60,
            warmUp: [
              { id: "wu1", name: "Easy Jog", time: "10 min" },
              { id: "wu2", name: "Strides", sets: 4, distance: "100m" }
            ],
            mainLifts: [
              { id: "ml1", name: "400m Repeats", sets: 8, notes: "Hard effort, 90s rest between" }
            ],
            accessories: [],
            conditioning: [
              { id: "con1", name: "Cool Down Jog", time: "10 min" }
            ]
          },
          {
            id: "re-w1-d3",
            dayNumber: 3,
            name: "Tempo Run",
            duration: 50,
            warmUp: [
              { id: "wu1", name: "Easy Jog", time: "10 min" },
              { id: "wu2", name: "Dynamic Stretching", time: "5 min" }
            ],
            mainLifts: [
              { id: "ml1", name: "Tempo Run", time: "20 min", notes: "Comfortably hard, Zone 3-4" }
            ],
            accessories: [],
            conditioning: [
              { id: "con1", name: "Easy Jog", time: "10 min" },
              { id: "con2", name: "Stretching", time: "5 min" }
            ]
          },
          {
            id: "re-w1-d4",
            dayNumber: 4,
            name: "Recovery & Mobility",
            duration: 45,
            warmUp: [
              { id: "wu1", name: "Walking", time: "10 min" }
            ],
            mainLifts: [
              { id: "ml1", name: "Easy Run", time: "20 min", notes: "Very easy, Zone 1-2" }
            ],
            accessories: [
              { id: "acc1", name: "Yoga Flow", time: "15 min" }
            ],
            conditioning: []
          }
        ]
      }
    ]
  }
];

export const educationModules = [
  {
    id: "sleep-1",
    title: "Sleep Basics: Recovery Fundamentals",
    category: "sleep" as const,
    keyPoints: [
      "Aim for 7-9 hours of quality sleep per night",
      "Maintain consistent sleep and wake times",
      "Create a dark, cool sleeping environment",
      "Limit screen time 1 hour before bed",
      "Consider magnesium supplementation"
    ],
    duration: 8
  },
  {
    id: "stress-1",
    title: "Managing Training Stress",
    category: "stress" as const,
    keyPoints: [
      "Recognize signs of overtraining",
      "Practice daily breathing exercises",
      "Schedule deload weeks every 4-6 weeks",
      "Balance high-intensity and low-intensity training",
      "Track your recovery metrics"
    ],
    duration: 10
  },
  {
    id: "training-1",
    title: "Progressive Overload Principles",
    category: "training" as const,
    keyPoints: [
      "Gradually increase volume, intensity, or frequency",
      "Track your lifts and progress consistently",
      "Focus on form before adding weight",
      "Use RPE to manage training intensity",
      "Plan deload weeks for recovery"
    ],
    duration: 12
  },
  {
    id: "nutrition-1",
    title: "Nutrition for Performance",
    category: "nutrition" as const,
    keyPoints: [
      "Prioritize protein: 1.6-2.2g per kg bodyweight",
      "Time carbs around training sessions",
      "Stay hydrated: 3-4 liters of water daily",
      "Don't fear healthy fats",
      "Eat whole foods 80% of the time"
    ],
    duration: 15
  },
  {
    id: "mindset-1",
    title: "Building Discipline & Consistency",
    category: "mindset" as const,
    keyPoints: [
      "Motivation gets you started, discipline keeps you going",
      "Focus on process, not just outcomes",
      "Build identity-based habits",
      "Embrace discomfort as growth",
      "Celebrate small wins daily"
    ],
    duration: 10
  },
  {
    id: "mindset-2",
    title: "Goal Setting & Vision",
    category: "mindset" as const,
    keyPoints: [
      "Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)",
      "Break big goals into weekly milestones",
      "Visualize success daily",
      "Review and adjust goals monthly",
      "Share your goals for accountability"
    ],
    duration: 8
  }
];
