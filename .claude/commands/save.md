# Save Session State for Replay Music Project

Save the current session state to memory so the next session can pick up exactly where we left off.

## Step 1: Gather Current State
Run these commands to get current state:
```bash
cd "/Users/johncox/Downloads/Design Premium Music Organizer 2"
git status
git log --oneline -3
date "+%Y-%m-%d %H:%M %Z"
```

## Step 2: Ask User for Session Summary
Ask the user:
"What did we accomplish this session? (I'll save this for next time)"

## Step 3: Update Memory
Update the "ReplayMusicApp" entity in memory with new observations:
- "Last session: [current date/time]"
- "Last work: [what was done - from user input and git commits]"
- "Session outcome: [result/status]"
- "Next steps: [if any were discussed]"

If there were any new learnings about workflow or issues, also update:
- "ReplayWorkflow" - for process improvements
- "ReplayKnownIssues" - for new bugs/solutions discovered

## Step 4: Commit Any Uncommitted Work
If there are uncommitted changes, ask user if they want to commit before saving.

## Step 5: Confirm Save
Tell the user:
"Session saved! Next time, use `/resume` to pick up where we left off."

Show what was saved to memory.
