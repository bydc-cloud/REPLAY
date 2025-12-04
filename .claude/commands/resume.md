# Resume Replay Music Project

You are resuming work on the Replay Music project. Do the following:

1. **Load project memory** - Search memory for "ReplayMusicApp" to get full project context including architecture, known issues, and deployment info.

2. **Check current state**:
   - Run `git status` to see any uncommitted changes
   - Run `git log --oneline -5` to see recent commits
   - Check if current version matches stable tag `v1.0-stable`

3. **Verify deployment status**:
   - The app is deployed on Railway at https://replay-production-9240.up.railway.app
   - Check Railway logs briefly if needed: `railway logs` (from project directory)

4. **Summarize for user**:
   - Current git state
   - What was last worked on
   - Any known issues from memory
   - Ask what they want to work on next

**Key files to know:**
- `server.js` - Full-stack backend (API + serves frontend)
- `src/contexts/MusicLibraryContext.tsx` - Track management, audio fetching
- `src/contexts/AudioPlayerContext.tsx` - Playback, lyrics sync
- `src/components/LyricsVisualizer.tsx` - Lyrics display

**Deploy command:** `npm run build && railway up`
