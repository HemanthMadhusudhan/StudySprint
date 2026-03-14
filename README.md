<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1uXk7kSlwHEInnkgXAHLk3nE2UXdOeLKJ

## Run Locally

**Prerequisites:** Node.js 16+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

3. Create a `.env` file in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Then add your API key:
   ```env
   VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

**Note:** The `.env` file is never committed to version control (see `.gitignore`). Use the Settings modal in the app as an alternative way to set your API key at runtime.
