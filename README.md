# Gym-Tracker-with-active-recommendation
A React gym workout tracker with set logging, rest timers, and PR suggestions
# Gym Tracker with Active Recommendation

A React-based gym workout tracker that helps you log your sets, rest between exercises, and get smart weight-increase suggestions when you hit a new personal record.

## Features

- **Exercise Library** – Comes with a default list of common free-weight, machine, and cardio exercises, and lets you add your own.
- **Set Logging** – Track weight and reps per set, with a dedicated warm-up toggle so warm-up sets don't count toward your stats.
- **Live Stats** – Each exercise card shows total volume (kg lifted) and estimated 1-Rep-Max (Epley formula) for the current session.
- **Rest Timer** – Start a 3-minute rest timer after any set (automatically or manually), with a live countdown and a skip option.
- **PR Suggestions** – When you beat your previous best (heavier weight, or same weight with more reps), the app flags it and recommends how much to increase the weight next session.
- **Custom Exercises** – Create new exercises on the fly, choosing a category (Free Weight, Machine, Cardio) that determines icon and suggested weight increments.

## Tech Stack

- React (hooks: `useState`, `useEffect`, `useRef`)
- [lucide-react](https://lucide.dev/) for icons
- Inline styles (no external CSS framework)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/slouc66-ui/Gym-Tracker-with-active-recommendation.git
   cd Gym-Tracker-with-active-recommendation
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

## How It Works

- Tap **Add Exercise** to pick from the exercise list or create a new one.
- Add sets with the **+ Set** or **+ Warm-up Set** buttons, then fill in weight and reps.
- Sets are auto-confirmed when you tab out of the input field (`onBlur`), which also starts the rest timer and checks for a new PR.
- Volume and estimated 1RM update live as you log sets.

## License

No license added yet — add one if you plan to share or open-source this project.
