import { Discipline, GoalType, DifficultyLevel, MuscleGroup, ForgeEngineWorkout, ForgeEngineExercise, UserJourney } from '../types';
import { EXERCISES } from '../data/exercisesData';
import { sound } from './soundEngine';
import { arnoVoice } from './arnoVoice';

export interface ForgeEngineOptions {
  discipline: Discipline;
  level: DifficultyLevel;
  equipment: string[];
  durationMinutes: number;
  goal: GoalType;
  preferredFocus?: MuscleGroup[];
}

class JourneyStore {
  private journey: UserJourney;
  private currentWorkout: ForgeEngineWorkout | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.journey = this.loadJourney();
    this.ensureTodayWorkout();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private loadJourney(): UserJourney {
    try {
      const saved = localStorage.getItem('forgemuscle_journey');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }

    return {
      discipline: 'hybrid',
      userLevel: 3,
      availableEquipment: ['турнік', 'бруси', 'гантелі', 'власна вага'],
      availableTimeMinutes: 45,
      goal: 'hypertrophy',
      previousActivitySummary: 'Вчора: Підтягування та віджимання (4 сесії, 82 репи)',
      workoutsCompletedCount: 14,
      xp: 1450,
      xpToNextLevel: 550,
      streak: 5,
      todaysWorkout: {
        title: 'Титановий Верх: Потужні Грудні та Широка Спина',
        description: 'Збалансований комплекс базових потягів та жимів для розширення торсу.',
        focus: ['chest', 'back', 'triceps'],
        estimatedMinutes: 40,
        exercises: [
          'Підтягування широким прямим хватом',
          'Класичні віджимання від підлоги',
          'Віджимання на брусах з нахилом вперед',
          'Тяга штанги в нахилі до пояса'
        ],
        isCompleted: false
      },
      recommendedTopic: {
        id: 'acad_technique_1',
        title: 'Анатомія траєкторії ліктів у жимі та підтягуваннях',
        category: 'Техніка & Безпека',
        readTimeMinutes: 4
      },
      progressPercentage: 68
    };
  }

  private save() {
    try {
      localStorage.setItem('forgemuscle_journey', JSON.stringify(this.journey));
    } catch {
      // ignore
    }
    this.notify();
  }

  public getJourney(): UserJourney {
    return this.journey;
  }

  public setDiscipline(disc: Discipline) {
    this.journey.discipline = disc;
    this.currentWorkout = null;
    this.save();
  }

  public updatePreferences(updates: Partial<UserJourney>) {
    this.journey = { ...this.journey, ...updates };
    this.ensureTodayWorkout();
    this.save();
  }

  public completeTodayWorkout(): number {
    if (this.journey.todaysWorkout.isCompleted) return 0;
    this.journey.todaysWorkout.isCompleted = true;
    this.journey.workoutsCompletedCount += 1;
    this.journey.streak += 1;
    const gainedXp = 250;
    this.journey.xp += gainedXp;
    this.journey.xpToNextLevel = Math.max(0, this.journey.xpToNextLevel - gainedXp);
    this.save();
    sound.playLevelUp();
    arnoVoice.speak(`Вітаю з завершенням сьогоднішнього тренування! Стрік збільшено до ${this.journey.streak} днів!`);
    return gainedXp;
  }

  public getCurrentEngineWorkout(): ForgeEngineWorkout {
    if (!this.currentWorkout) {
      this.currentWorkout = this.generateWorkout({
        discipline: this.journey.discipline,
        level: 'intermediate',
        equipment: this.journey.availableEquipment,
        durationMinutes: this.journey.availableTimeMinutes,
        goal: this.journey.goal
      });
    }
    return this.currentWorkout;
  }

  public generateWorkout(opts: ForgeEngineOptions): ForgeEngineWorkout {
    sound.playAnvilHit();

    // Filter relevant exercises from database
    const pool = EXERCISES.filter((ex) => {
      if (opts.discipline !== 'hybrid' && ex.discipline !== opts.discipline) return false;
      return true;
    });

    const targetExercisesCount = opts.durationMinutes <= 20 ? 3 : opts.durationMinutes <= 35 ? 4 : 5;
    const selected: ForgeEngineExercise[] = [];

    // Ensure distinct muscle groups
    const muscleOrder: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'triceps', 'biceps', 'abs'];
    const chosenMuscles = opts.preferredFocus && opts.preferredFocus.length > 0 
      ? opts.preferredFocus 
      : muscleOrder.slice(0, targetExercisesCount);

    chosenMuscles.forEach((muscle, idx) => {
      const match = pool.find((e) => e.muscle === muscle) || pool[idx % pool.length];
      const alternatives = pool.filter((e) => e.muscle === match.muscle && e.id !== match.id).map((e) => e.id);

      const sets = opts.level === 'beginner' ? 3 : opts.level === 'intermediate' ? 4 : 5;
      const repsOrDuration = opts.goal === 'strength' ? '4-6 повторень' : opts.goal === 'endurance' ? '15-20 повторень' : '8-12 повторень';
      const restSeconds = opts.goal === 'strength' ? 120 : opts.goal === 'endurance' ? 45 : 75;

      selected.push({
        exerciseId: match.id,
        name: match.name,
        muscle: match.muscle,
        order: idx + 1,
        sets,
        repsOrDuration,
        restSeconds,
        difficulty: opts.level,
        cue: match.tips || 'Контролюйте опускання (ексцентрику) протягом 2-3 секунд без ривків.',
        alternativeExerciseIds: alternatives
      });
    });

    const goalNames: Record<GoalType, string> = {
      hypertrophy: 'Гіпертрофія та Обʼєм',
      strength: 'Максимальна Сила',
      endurance: 'Мʼязова Витривалість',
      recomp: 'Рекомпозиція та Рельєф'
    };

    const newWorkout: ForgeEngineWorkout = {
      id: `engine_wk_${Date.now()}`,
      title: `Кузня ${opts.discipline === 'calisthenics' ? 'Турніків' : opts.discipline === 'bodybuilding' ? 'Заліза' : 'Титанів'}: ${goalNames[opts.goal]}`,
      discipline: opts.discipline,
      goal: opts.goal,
      durationMinutes: opts.durationMinutes,
      difficulty: opts.level,
      equipment: opts.equipment,
      exercises: selected,
      instructions: 'Виконуйте кожен рух із повним контролем траєкторії. Не допускайте тренувань через гострий біль у суглобах чи звʼязках. Відпочивайте за таймером.'
    };

    this.currentWorkout = newWorkout;
    this.notify();
    arnoVoice.speak(`Нову програму викувано у Forge Engine! ${newWorkout.exercises.length} вправ готові до старту.`);
    return newWorkout;
  }

  public substituteExercise(index: number): ForgeEngineExercise | null {
    if (!this.currentWorkout || !this.currentWorkout.exercises[index]) return null;

    const currentEx = this.currentWorkout.exercises[index];
    const alternates = EXERCISES.filter(
      (e) => e.muscle === currentEx.muscle && e.id !== currentEx.exerciseId
    );

    if (alternates.length === 0) return currentEx;

    const nextOne = alternates[Math.floor(Math.random() * alternates.length)];
    const updated: ForgeEngineExercise = {
      ...currentEx,
      exerciseId: nextOne.id,
      name: nextOne.name,
      cue: nextOne.tips || currentEx.cue
    };

    this.currentWorkout.exercises[index] = updated;
    this.notify();
    sound.playClick();
    return updated;
  }

  private ensureTodayWorkout() {
    // Dynamic refresh if not completed
  }
}

export const journeyStore = new JourneyStore();
