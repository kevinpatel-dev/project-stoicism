# 🏛️ Project Stoicism

🔗 **Live App:** [https://project-stoicism.web.app/](https://project-stoicism.web.app/)

Project Stoicism is a full-stack, gamified task manager built to turn your daily disciplines into an RPG experience. Instead of just ticking off boxes, you complete quests, earn XP, maintain streaks, and level up your life.

**Note:** This is my very first project! It is a continuous work in progress and I have a lot more ideas I want to put into this. I'm keeping the scope focused to ensure everything works flawlessly before expanding.

## 🌟 Features

* **Installable Mobile App (PWA):** Project Stoicism isn't just a website; it's a Progressive Web App. Install it directly to your iOS or Android home screen for a native app experience.
* **The Path of the Sage:** A custom math-based progression system. Your XP requirements scale as you level up, and your Hero Title automatically evolves from *Novice* all the way to *Sage*.
* **Hard Mode (Anti-Cheat System):** For those who want true discipline. Toggle Hard Mode to earn 1.5x XP. But beware: if you go 48 hours without completing a quest, your streak resets to zero and you lose 50 XP. 
* **Quest Management:** Create tasks with granular control over Difficulty (base XP) and Priority (bonus XP). Includes a sleek, integrated date picker for optional deadlines.
* **The Hero Dashboard:** A premium, dark-themed UI (Amethyst & Zinc) featuring a responsive gradient XP bar, floating modals, and a unified command center navigation menu.
* **First-Time Onboarding:** A seamless introductory experience that asks for your Hero Name the very first time you enter the arena.
* **Real-time Sync & Security:** Powered by Firebase Firestore, quests update instantly across devices. Full account control allows you to securely reset your progress or permanently delete your account and data.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite
* **Styling:** Tailwind CSS v4 (Custom Amethyst & Zinc theme)
* **Components:** `react-datepicker` for calendar UI, `vite-plugin-pwa` for mobile installation.
* **Backend & Database:** Firebase Firestore
* **Authentication:** Firebase Auth (Email/Password, Google Auth, Anonymous Guest Login)
* **Hosting:** Firebase Hosting

## 🚀 Running the Project Locally

To run Project Stoicism on your own machine:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/kevinpatel-dev/project-stoicism.git](https://github.com/kevinpatel-dev/project-stoicism.git)

2. **Navigate into the directory:**
   ```bash
   cd project-stoicism

3. **Install dependencies:**
   ```bash
   npm install

4. **Set up Firebase:**

You will need to create a Firebase project and add your web config to a firebase.js or .env file in the src directory.

5. **Start the local server:**
   ```bash
   npm run dev

Signing off,

Kevin.