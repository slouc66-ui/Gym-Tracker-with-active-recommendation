# Gym Tracker

A minimalist, Apple-style workout tracker, inspired by apps like Strong. Log exercises, track sets, and see your progress. Runs entirely in the browser with no installation and no backend required.

## Features

- Exercise management: predefined exercises (free weight, machine, cardio) plus the ability to create custom exercises, each with a matching icon
- Set tracking: weight, reps, and warm-up flagging per set
- Automatic calculations: live training volume and estimated one-rep max (1RM, Epley formula) per exercise
- Progression suggestions: when a new personal best is hit, the app automatically suggests the next weight increase
- Rest timer: automatic 3-minute countdown after each set, skippable and can also be started manually
- Cardio mode: cardio exercises track duration instead of weight and reps
- Persistent storage: workouts are saved per day, so each day stays separate and is retained permanently
- Date navigation: move back and forth through past workout days ("Today", "Yesterday", full date)
- Finish workflow: a workout is explicitly saved via "Finish workout" and locked afterward to prevent accidental changes

## Usage

Just open the HTML file in a browser:

```bash
open gym_tracker.html
```

No build process and no dependencies. The file is fully self-contained.

## Tech Stack

- Vanilla JavaScript (no framework, no build step)
- Inline SVG icons in an Apple-style design
- CSS with system-native typography (-apple-system, SF Pro Text)
- Persistence via a simple key-value storage API (per-user, date-based keys)

A React version (`gym_tracker.jsx`) also exists with identical UI and functionality, for projects already built on React.

## Project Structure

```
gym_tracker.html   Standalone vanilla JS version (recommended)
gym_tracker.jsx     React component with identical functionality
README.md
```

## Calculation Logic

Estimated 1RM (Epley formula):

```
1RM = weight x (1 + reps / 30)
```

Training volume:

```
volume = sum of (weight x reps) across all working sets (warm-up sets excluded)
```

Progression suggestion:
Triggered whenever a set reaches a new personal best (more weight, or the same weight with more reps). The suggested increase depends on the exercise category:

| Category    | Step size |
|-------------|-----------|
| Free weight | +2.5 kg   |
| Machine     | +5 kg     |
| Cardio      | none      |

## Roadmap / Future Ideas

- Workout plans/templates (e.g. push/pull/legs)
- Progress charts over time
- Export/import of workout data
- Body weight and body measurement tracking
- Centralized language file instead of separate translated files

## License

Personal hobby project, free to use and adapt.
