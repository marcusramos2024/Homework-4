# HW4 Reflection: Claude Code Workflow and TDD

Marcus Ramos

## Comparison of the Explore, Plan, Implement, Commit workflow to how I worked previously

Prior to this class, I did not think much about the setup. I would launch a Claude Code session, install the Karpathy skill, and begin asking for code. There was no CLAUDE.md, no permissions, and no documented plan. This approach worked well enough for smaller projects; however, each session began from scratch, and I was the sole source of truth regarding the project's rules.

While the four-phase workflow initially seemed slower than my previous workflow, it did not take long to get comfortable with it. One of the most significant differences between the two approaches is that errors become apparent in the plan rather than in the code. In Part 3, the plan (written in Plan mode before any tests were created) identified two problems prior to writing any code. The PRD stated that "each team receives exactly one bye per round," which is mathematically impossible as written. Therefore, the issue was addressed in its own commit first. Additionally, the plan identified that a "same seed results in the same schedule" test would pass before any seed code was written; therefore, it could never fail. Instead, the red test for that cycle became "different seeds result in different schedules."Part 2 demonstrated what can occur if you do not follow the order of the phases. I created the league setup plan and implemented it first. Subsequently, I conducted a Plan mode review. The review revealed seven omissions, including duplicate IDs (which is the only error I likely would have overlooked), and one incorrect field that obscured all other errors. This required three additional fix commits. In future iterations, I would conduct the Plan mode review immediately following creation of the plan, prior to writing any code. I was pleasantly surprised by /init. I was unaware of its existence, and the output quality was high. It captured several configuration details that I had not documented, such as Next 16's `cacheComponents` setting and that `next typegen` must be executed before typechecking. With some guidance, it generated precisely what I needed. The primary detail that it omitted was listing my documentation files as plain paths instead of `@imports`; therefore, it copied those files into my directory instead of referencing them. TDD via Claude Code required more involvement from me than anticipated. Cycle 1 utilized auto mode. Red and green commits occurred within 12 seconds of each other, and neither party reviewed the failed test. I transitioned to accept-edits mode and submitted red, green, and refactored code one prompt at a time. I read each failure prior to requesting the correction. At this point, it felt like TDD. The property test was perhaps the best illustration: it passed upon submission; therefore, I instructed Claude to intentionally break the code. Fast-check detected the break and minimized it to the smallest possible example (2 teams with seed 0). We then restored it to its original state.

Context Management Strategies That Worked Best






1. **@imports in CLAUDE.md.** The PRD, architecture decisions, and testing rules automatically load into each session. Neither my explore session nor my Plan mode session required me to copy/paste anything; they accurately referenced the documentation.
2. **/compact with focus.** After cycle 3, I executed /context, followed by /compact keep the tdd plan, the cycle list, and current test names. Cycles 4 and 5 continued without requiring me to re-describe the plan.
3. **Small commits + /clear.** Following completion of the TDD session, I ran /clear, followed by claude --continue, and requested a summary. Claude reported that it possessed no memory of the session and recreated it from the git history. That is when I realized: committing small and frequently creates the memory in git; consequently, clearing context is relatively inexpensive.
4. **A separate session for each task, plus --resume and /export.** Rather than adding to existing sessions, I initiated separate sessions for exploring. I utilized --resume to re-open the review session and export it.

What I would omit: Auto mode during TDD. While faster, it eliminates the opportunity for you to read the red test; thus, eliminating the purpose of TDD.

Annotated Session Log

The annotated logs are located in the repository along with raw session exports and screenshots referenced:

* `docs/hw4/part1-setup-log.md`: Setup/Permissions/Init/CLAUDE.md Revisions
* `docs/hw4/part2-workflow-log.md`: Explore/Plan/Implement/Commit for US-1/Plan Mode Review/Fixes
* `docs/hw4/part3-tdd-log.md`: Five Red/Green Cycles/Property-Test Break/Context Management Screenshots
* `docs/hw4/sessions/`: Exported Claude Code Sessions (`part2-plan-review.txt`, `part2-explore.txt`, `part3-tdd.txt`)







