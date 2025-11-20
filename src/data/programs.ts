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
  },
  // HYROX TRAINING GUIDES
  {
    id: "hyrox-1",
    title: "Hyrox Introductie: Race Format & Structuur",
    category: "hyrox" as const,
    keyPoints: [
      "8x 1km run + 8 fitness stations = totaal race",
      "Stations: SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, Rowing, Farmers Carry, Sandbag Lunges, Wall Balls",
      "Gemiddelde finishtijd: 1:15-1:45 uur voor beginners",
      "Elite mannen: <1:00 uur, Elite vrouwen: <1:10 uur",
      "Singles, Doubles of Relay formaat beschikbaar"
    ],
    duration: 12
  },
  {
    id: "hyrox-2",
    title: "Hyrox Running Training: Zone 2 & Intervals",
    category: "hyrox" as const,
    keyPoints: [
      "70% training in Zone 2 (conversational pace)",
      "2-3x per week tempo runs: 3-5km @ race pace",
      "Weekly long run: 8-12km steady state",
      "Track intervals: 8x 400m @ 85-90% effort",
      "Running volume: 30-50km per week voor intermediate"
    ],
    duration: 15
  },
  {
    id: "hyrox-3",
    title: "Station Training: SkiErg, Sled & Rowing",
    category: "hyrox" as const,
    keyPoints: [
      "SkiErg (1000m): Focus op explosieve arm drive, target 3:30-4:30",
      "Sled Push (50m): Low position, drive through heels, 30-45s target",
      "Sled Pull (50m): Aggressive hand-over-hand, 45-60s target",
      "Rowing (1000m): 500m splits @ 1:50-2:10, maintain stroke rate 26-30",
      "Train stations 2x per week apart van running"
    ],
    duration: 18
  },
  {
    id: "hyrox-4",
    title: "Station Training: Carries, Lunges & Wall Balls",
    category: "hyrox" as const,
    keyPoints: [
      "Farmers Carry (200m): 2x 24kg (M) / 16kg (V), grip endurance is key",
      "Sandbag Lunges (100m): 20kg (M) / 10kg (V), alternating legs, stay upright",
      "Wall Balls (100 reps): Depth in squat, explode up, target 3-5 min",
      "Burpee Broad Jumps (80m): Efficient transitions, maintain rhythm",
      "Practice transitions tussen stations voor race tempo"
    ],
    duration: 16
  },
  {
    id: "hyrox-5",
    title: "Hyrox Pacing Strategy: Splits & Energy Management",
    category: "hyrox" as const,
    keyPoints: [
      "Start conservatief: eerste 2 runs @ 85-90% capacity",
      "Target consistent run splits binnen 10-15s per km",
      "Stations zijn recovery moments - don't rush",
      "Second half push: runs 5-8 kunnen sneller dan eerste helft",
      "Practice negative splits in training: langzaam starten, snel finishen"
    ],
    duration: 14
  },
  {
    id: "hyrox-6",
    title: "Race Week Prep: Taper & Race Day Plan",
    category: "hyrox" as const,
    keyPoints: [
      "Week voor race: 50% volume reductie, behoud intensiteit",
      "2 dagen voor: alleen light movement & mobility",
      "Race morning: 2-3 uur voor ontbijt (havermout + banaan)",
      "Warming-up: 10 min easy jog + alle stations kort doorlopen",
      "Nutrition: 30-60g carbs per uur via gels/sports drink"
    ],
    duration: 12
  },
  {
    id: "hyrox-7",
    title: "Transition Efficiency: Tijd Winnen Tussen Stations",
    category: "hyrox" as const,
    keyPoints: [
      "Practice walk-in's: direct van run naar station setup",
      "Equipment pre-check: weights, settings, positioning",
      "Breathing recovery tijdens station setup (5-10s)",
      "Minimal rest tussen station finish en volgende run",
      "Train transitions in workouts: run-station-run blocks"
    ],
    duration: 10
  },
  {
    id: "hyrox-8",
    title: "Periodisering: 12-Week Hyrox Training Plan",
    category: "hyrox" as const,
    keyPoints: [
      "Week 1-4 (Base): Volume opbouwen, techniek perfectioneren",
      "Week 5-8 (Build): Intensiteit verhogen, race pace intervals",
      "Week 9-11 (Peak): Simulate workouts, full race rehearsals",
      "Week 12 (Taper): Volume -50%, stay fresh, mental prep",
      "Balance: 60% running, 30% stations, 10% recovery/mobility"
    ],
    duration: 20
  },
  {
    id: "hyrox-9",
    title: "Strength Training Voor Hyrox: Hybrid Athlete",
    category: "hyrox" as const,
    keyPoints: [
      "2x per week full-body strength: squats, deadlifts, overhead press",
      "Focus op power-endurance: 3-4 sets x 10-15 reps",
      "Core stability: planks, dead bugs, pallof press - essentieel voor stations",
      "Grip strength training: farmer walks, dead hangs, plate pinches",
      "Timing: strength op non-running days of 6+ uur na hardlopen"
    ],
    duration: 16
  },
  {
    id: "hyrox-10",
    title: "Recovery & Injury Prevention: Staying Race Ready",
    category: "hyrox" as const,
    keyPoints: [
      "Mobility daily: 15-20 min foam rolling + dynamic stretching",
      "Ice baths post-hard workouts: 10-15 min @ 10-15°C",
      "Active recovery runs: 20-30 min @ easy conversational pace",
      "Sleep priority: 8-9 uur voor optimal recovery",
      "Listen to body: persistent pain = take extra rest day"
    ],
    duration: 12
  }
];
