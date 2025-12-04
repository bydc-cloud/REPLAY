# Resume Replay Music Project Session

You are resuming work on the Replay Music project after a compact or new session.

## Step 1: Load Full Context from Memory
Search memory for these entities and display their contents:
- "ReplayMusicApp" - Project overview and LAST SESSION info
- "ReplayArchitecture" - Technical implementation details
- "ReplayKnownIssues" - Common problems and solutions
- "ReplayDeployment" - How to deploy
- "ReplayWorkflow" - User preferences and process improvements

## Step 2: Check Current State
Run these commands and summarize:
```bash
cd "/Users/johncox/Downloads/Design Premium Music Organizer 2"
git status
git log --oneline -5
git describe --tags --always
```

## Step 3: Quick Health Check
- Is the app accessible at https://replay-production-9240.up.railway.app ?
- Any uncommitted changes that need attention?

## Step 4: Present Summary to User
Format your response as:

**Last Session:** [date/time from memory]
**What was done:** [summary from memory]
**Outcome:** [result from memory]

**Current Git State:**
- Branch: [branch]
- Recent commits: [list]
- Uncommitted changes: [yes/no + details]

**Known Issues to Watch:**
- [list key issues from ReplayKnownIssues]

**Ready to continue! What would you like to work on?**

---
*Tip: Before ending a session, use `/save` to record progress for next time.*
