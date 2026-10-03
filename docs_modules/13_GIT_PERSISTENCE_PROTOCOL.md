# Module 13 — Git Persistence & Session Sync Protocol
> New module, October 2026. Written after a real incident (3 Oct 2026) in which a build session
> concluded Block 0's graph "never existed / was fictional" and rebuilt it in parallel — when in
> fact the original Block 0 work was real, committed, and pushed to the working branch all along.
> The session's local checkout had simply never fetched it. No work was fabricated and nothing was
> lost, but two parallel lineages of the same block had to be reconciled by hand.
> Load this at the START of every build session, before trusting any local `git` output.

---

## The One-Sentence Rule

**"Done" means pushed to `origin` and re-fetchable by a fresh session — not a commit you made locally, not a hash in a report, not a ticked box in a file.** A commit that isn't on `origin` does not exist as far as the next session is concerned.

---

## What Actually Went Wrong (the incident this file exists to prevent)

Plain account, so the mechanism is unmistakable:

1. An earlier session built Block 0 correctly — Corridor E graph, `get_eta`, `paho-mqtt` dep, a real Mosquitto smoke test — committed it (`fa3c144` and others), and **pushed it to the working branch** `claude/funny-knuth-w6dibj`. It marked Block 0 complete in the milestone file. **All of this was true.**
2. It never merged that branch to `main`. `main` stayed at a commit from before Block 0.
3. A later build session started from a local checkout that had **never fetched** those branch commits. Its local `git log --all` genuinely showed no graph — because *its local copy* didn't have it.
4. That session reasonably (but wrongly) concluded the graph "never existed," and rebuilt it in parallel (`31f58ab`), plus other fixes — all committed **locally, never pushed**.
5. Result: two valid, divergent lineages of the same Block 0, neither aware of the other, discovered only when a cross-session audit ran `git fetch` and saw the branch jump forward by 5 commits.

**Root cause: a sync/persistence gap, NOT dishonesty.** No session fabricated output. The records were accurate *against the branch they lived on*. The failure was (a) a session trusting its local checkout without fetching first, and (b) earlier reports/records never stating *which branch* the work lived on, so "it's committed" read as "it's in the repo on main" when it meant "it's on a feature branch not yet fetched/merged."

---

## The Protocol

### 1. Session start — fetch before you trust anything
The **first action** of every build session, before reading local `git log` or concluding anything about repo state:
```
git fetch origin --prune
git branch --show-current
git log --oneline origin/<working-branch> -10
```
Then reconcile against the milestone file: for every commit hash the milestone file claims as "done," confirm it exists on origin:
```
git cat-file -t <hash>              # expect: commit
git branch -a --contains <hash>     # expect: the working branch on origin
```
If a claimed commit is **absent from origin**, do not assume the work is lost and do not rebuild blindly — first check whether it's on a branch you haven't fetched, or only ever existed locally in a prior session. Stop and flag to Samy with the raw output. (This single step would have prevented the entire incident.)

### 2. Session end — push before you close the chat
Before ending any session that made commits:
```
git push origin <working-branch>
```
Confirm the push output shows the `-> <working-branch>` line. **An unpushed commit is invisible to the next session.** If you cannot push, say so explicitly in your final report and tell Samy the work is local-only and at risk — never let a session close on silent local-only commits.

### 3. One environment per branch at a time
The incident happened because two containers (one cloud, one local) worked the same branch without syncing. Rule:
- **Don't run two Claude Code environments against the same branch in parallel** expecting them to stay in sync. They won't without explicit push/fetch between them.
- If you must switch environments (cloud ↔ local) on the same branch: **push from the one you're leaving, fetch in the one you're entering, before doing any work.**
- Pick a "home" environment for a given block's work and stay in it where practical.

**Cloud vs local — neither is "better," they expose different things:**
- *Local* runs in the real target environment (e.g. Windows) and catches platform-specific bugs a Linux cloud box never would — this incident's one genuinely-unique local find was the `uvloop` Windows-install bug.
- *Cloud* gives a clean, reproducible Linux container.
- The deciding rule is not which you pick, but that you **push/fetch at every handoff** so the branch is the single shared truth.

### 4. Branch → main discipline
Closing a block requires the work to be reachable by the next session. That means **either**:
- the block's commits are **merged to `main`** (cleanest — every future session audits `main` and sees truth), **or**
- the block stays on the working branch **and the next session is explicitly told the branch name to check out.**

Default recommendation: **merge to `main` at the end of each block** once it's genuinely complete and pushed. If you stay on a branch, the handoff note (and the milestone file) MUST name the branch.

### 5. "Reported" vs "Confirmed" in the milestone file
A milestone box carries its evidence and its confidence level:
- **Reported** — a session committed it and reported a hash/branch, but no *later* session has yet re-fetched and confirmed it persists. Written as: `reported by <session>, <hash> on <branch>`.
- **Confirmed** — a *subsequent* session ran `git fetch` + `git cat-file -t <hash>` and saw it on origin. Only then does the box become a confirmed `[x]`.

This one-session lag is cheap and would have caught the incident immediately: `fa3c144` was real-on-branch but a fresh checkout couldn't see it, so it should have been "reported," re-verified on fetch, then "confirmed" — never silently trusted as done.

### 6. Report & review language (Coddy ↔ Chatty)
- **Coddy (execution side):** every report names the **branch** the work is on and whether it's been **pushed to origin**. "Committed as `<hash>`" alone is insufficient — say "committed as `<hash>` on `<branch>`, pushed: yes/no."
- **Chatty (review side):** never write "verified" / "confirmed from the actual graph" for something it only *reviewed in a report*. The honest phrasing is "Coddy reports X (`<hash>` on `<branch>`)." Chatty cannot verify disk state — only Coddy can. Blurring "I reviewed a report" into "I verified it" is exactly what let the original record drift unchallenged.
- Milestone-completion edits to the file are made from **real repo state** (by Coddy, or by Chatty reconciling the Project copy to what Coddy confirms on origin) — never from a report taken on faith.

---

## Quick Checklist (paste-friendly)

**Session start:**
- [ ] `git fetch origin --prune`
- [ ] confirm current branch
- [ ] verify every milestone-claimed hash exists on origin (`git cat-file -t`)
- [ ] if any claimed hash is missing → STOP, flag, don't rebuild blindly

**During:**
- [ ] all work on the one agreed branch
- [ ] no parallel environment on the same branch without push/fetch handoff

**Session end:**
- [ ] `git push origin <branch>` — confirm the `-> <branch>` line
- [ ] if push impossible → say so loudly; work is at risk
- [ ] handoff note / milestone names the branch (and whether merged to main)
- [ ] milestone boxes marked "reported" until a later session confirms on fetch

---

## Relationship to Other Modules

- **`12_BUILD_MILESTONES.md`** — its "Updating This File" section should point here; completion is defined by this protocol (pushed + re-fetchable), not by local commits.
- **`00_MASTER_CONTEXT.md`** — carries a one-line pointer to this module in its phase/working-method framing.
- **"Working With Claude Code" (Project instructions)** — the report/review language rules in §6 extend the peer-collaboration model already described there; this module is the git-persistence half of that same loop.
