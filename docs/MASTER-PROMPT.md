# MASTER PROMPT — PROJECT ELEVEN
## Complete Mobile Football Manager — Phase 1 + Phase 2
**Type:** Mobile-first football management simulation  
**Target:** Production-ready webgame + installable PWA  
**Platforms:** iOS, Android, tablet, desktop  
**Stack:** Next.js, React, TypeScript, Tailwind, football simulation engine, IndexedDB, optional Supabase, GitHub, Vercel  
**Language:** Dutch by default, English-ready  
**Status:** Full implementation required, not a prototype

---

# 1. YOUR ROLE AND MISSION

You are an autonomous senior game development team consisting of:

- Lead Game Designer
- Football Simulation Engineer
- Senior Full-Stack Developer
- Mobile UX/UI Designer
- Game Economy Designer
- Data Engineer
- QA Automation Engineer
- DevOps Engineer
- Product Lead

Your mission is to build a complete, playable football management game inspired by the management depth of Football Manager 2026.

Build Phase 1 and Phase 2 as **one integrated, production-ready game**.

This must NOT become a static dashboard, visual prototype, collection of mocked screens or disconnected functionality.

The product must work as an actual football management simulation with a persistent football world.

The player must be able to:

1. Create a manager profile.
2. Choose an existing football club.
3. Manage the real club's licensed player roster.
4. Select formations and tactics.
5. Manage the starting eleven and substitutes.
6. Simulate matches.
7. Watch matches in a functional 2D match viewer.
8. Buy, sell and loan football players.
9. Negotiate contracts.
10. Scout new players.
11. Develop youth players.
12. Manage training, fitness and injuries.
13. Hire and manage staff.
14. Manage club finances.
15. Compete in football leagues and cup competitions.
16. Progress through multiple seasons.
17. Save and resume their football career.

Every major user-facing action must have real consequences within the game world.

**Definition of success:** A user can start a new career, complete multiple football seasons, transfer players, develop a squad, win or lose competitions, handle club finances and continue playing after closing and reopening the browser.

# 2. NON-NEGOTIABLE DEVELOPMENT RULES

- Build mobile-first, not desktop-first.
- Reuse mature, proven open-source code where legally permitted.
- Verify source licenses, dependency compatibility and maintenance status.
- Do not copy proprietary Football Manager code, interface assets or branding.
- Use original visual design and product naming.
- Use genuine licensed player names from the user's authorized dataset.
- Never claim fictional players or generated ratings are official real-world data.
- No fake buttons, placeholder workflows or simulated success notifications.
- No hardcoded match outcomes.
- No random results unrelated to player attributes and tactics.
- No game-breaking financial exploits.
- No infinite loading screens.
- No losing savegame data during updates.
- No mandatory login for local single-player careers.
- No paid features, advertisements or microtransactions in this release.
- No unnecessary settings or complicated onboarding.
- The product must be deployable to a production URL.

Choose sensible engineering defaults independently. Request external information only when a genuine dependency cannot be resolved automatically, such as access to an authorized player database.

# 3. RESEARCH AND OPEN-SOURCE FOUNDATIONS

Before implementation, inspect these projects:

**Primary match simulation engine**

https://github.com/tbleckert/football-simulator

Use as preferred foundation for:
- Real-time match simulation
- Football events
- Player positions and movement
- Tactical instructions
- Match statistics
- Match reports
- Season simulation foundations

Inspect `RealTimeEngine`, `SeasonSimulator`, examples, tests and integration documentation.

Its MIT license permits reuse subject to its license conditions. Preserve the required notices.

**Mobile football manager reference**

https://github.com/JorgeQuijano/football-manager

Review:
- Mobile game flows
- Match simulation orchestration
- Deterministic gameplay
- PWA implementation
- Local saves
- State management

Do not incorporate source code unless a compatible license or separate authorization is verified.

**Additional management reference**

https://github.com/openfootmanager/openfootmanager

Study:
- Contracts
- Transfers
- Scouting
- Player development
- Staff systems
- Game state management

This repository uses GPLv3. Do not directly integrate GPL code into a proprietary implementation without explicitly accepting and satisfying its distribution obligations.

Produce a short dependency and license audit in the repository before coding.

Do not unnecessarily rebuild an engine when a verified existing engine works.

However, never force a technically unsuitable dependency into the architecture.

# 4. REQUIRED TECHNOLOGY ARCHITECTURE

Use the following default architecture:

**Frontend**
- Next.js with App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- Accessible reusable UI components
- Zustand for interactive game state
- TanStack Virtual or equivalent for very large lists

**Football simulation**
- Verified TypeScript football simulation engine
- Dedicated domain layer for game rules
- Deterministic seeded random number generation
- Web Workers for expensive client-side simulations
- Pure functions for calculations and business rules

**Persistence**
- IndexedDB for local savegames
- Dexie or equivalent transactional persistence abstraction
- Versioned schemas and safe migrations
- Export/import of save files
- Optional Supabase Postgres for cloud saves

**Infrastructure**
- GitHub repository
- GitHub Actions for continuous integration
- Vercel hosting
- HTTPS
- Installable PWA
- Error monitoring without collecting sensitive game data unnecessarily

**Architecture boundaries**

Separate the project into:

1. Presentation and user interaction
2. Football world data
3. Football rules and league regulations
4. Simulation engine
5. Career progression engine
6. Club and player economy
7. Data adapters and licensed imports
8. Savegame persistence
9. Cloud synchronization
10. Operational monitoring and testing

The simulation engine must not depend directly on React.

UI components must never be the source of truth for football rules.

Avoid unnecessary microservices and external databases. Local single-player functionality should remain usable without cloud services.

# 5. LICENSED REAL-WORLD FOOTBALL DATA

The project owner states that they hold a license to use real player names.

The game must support licensed datasets containing, where covered:

- Real player names
- Real clubs
- Real league structures
- Player positions
- Player ages and nationalities
- Player team assignments
- Player career history
- Contract data
- Player valuations
- Relevant statistics

Build a configurable data import system supporting CSV, JSON and authorized API providers.

Sportmonks or another legitimate provider may be integrated where the existing license covers the intended use.

**Important distinction**

The use of real player names, photographs, club badges, kits, league branding and official statistics may involve different rights.

Verify the specific authorized fields and permitted usage.

Do not download copyrighted database files from pirated copies of Football Manager.

Do not extract Football Manager proprietary databases.

## Data import requirements

- Stable unique external player IDs
- Internal canonical player IDs
- Club and league ID mapping
- Duplicate detection
- Validation of required fields
- Import error reports
- Incremental data updates
- Data provenance
- Dataset version tracking
- Correct handling of missing values
- Protection of provider API credentials

A player must not accidentally appear on two clubs at the same moment unless a valid transfer or loan relationship explains the arrangement.

Separate licensed real-world values from game-generated values.

Game-generated potential, tactical attributes, salary estimates or valuations must be transparently identified as simulation data if they are not supplied by the licensed source.

Each new career should create a starting-world snapshot. Later external data imports must not silently overwrite transfers or player development already created within that career.

If licensed data is temporarily unavailable, use a clearly labeled fictional development dataset to test the entire game. Do not claim the real-player release is complete until the authorized data has been imported, validated and tested.

# 6. GAME WORLD AND COMPETITION SYSTEM

Build a persistent football world containing:

- Countries
- Leagues
- Clubs
- First-team squads
- Youth squads
- Managers
- Coaching staff
- Players
- Football seasons
- Fixtures
- Match results
- League tables
- Domestic cup competitions
- Transfer markets
- Contract records
- Financial records
- Player statistics
- Player histories

## League coverage

Target at least five recognizable league systems when the available licensed data and competition rights support them:

- Netherlands
- England
- Spain
- Germany
- Italy

Use competition-specific configuration rather than forcing all leagues to follow identical rules.

Each playable league requires a complete coherent competition configuration, participating clubs, fixtures and a viable player database.

A smaller complete licensed competition is preferable to five incomplete ones.

## Competition logic

Implement:

- Full fixture generation
- Home and away matches
- Points calculation
- Goal difference
- League ranking rules
- League-specific tiebreakers
- Cup draws
- Knockout rounds
- Extra time where applicable
- Penalty shootouts where applicable
- Promotion and relegation where supported
- Seasonal league resets
- Historical standings
- Champions and award histories

Every match must affect the same persistent world state.

The user must be able to see other clubs' results, transfers, league positions and player statistics.

AI-managed clubs must actively participate throughout each season.

# 7. MANAGER PROFILE AND CAREER MODE

Create an onboarding flow with the following steps:

**Step 1 — Create manager**

- Enter name
- Select nationality
- Select difficulty
- Select starting career options

**Step 2 — Select club**

Display clubs with:

- Name
- Competition
- Squad quality
- Available budget
- Club expectations
- Difficulty indicator

**Step 3 — Start career**

Generate the season and open the main game dashboard.

The player should be playing within a few interactions.

Do not require account registration.

## Career progression

Implement:

- Manager reputation
- Board confidence
- Job security
- Club objectives
- Manager career history
- League and cup achievements
- Manager trophies
- Manager performance statistics
- Employment history

Board confidence must respond to results, financial decisions and club expectations.

Add a functional dismissal system with a way to continue the career where a suitable management opportunity exists. Never erase the career automatically.

# 8. MOBILE-FIRST GAME DASHBOARD

Build one primary home screen named **Vandaag** or **Clubhuis**.

It must answer:

- What is my next match?
- What do I need to decide?
- Is my team ready?
- What happened since my previous action?
- Can I continue to the next day?

## Main content

Show:

- Current club
- Date and competition
- Upcoming opponent
- League position
- Squad condition summary
- Important inbox items
- Pending transfers
- Injuries and suspensions
- Board confidence
- Next match action

The primary action must be clearly visible:

**Doorgaan**

The game advances through the calendar when the user chooses to continue.

When an important decision requires attention, explain why without blocking gameplay unnecessarily.

## Navigation

Use compact, thumb-friendly bottom navigation:

1. Home
2. Selectie
3. Wedstrijd
4. Transfers
5. Meer

Under Meer provide access to:

- Competities
- Scouting
- Training
- Jeugd
- Financiën
- Staf
- Inbox
- Managerprofiel
- Instellingen
- Savegames

Avoid placing every feature in the main bottom navigation.

# 9. SQUAD MANAGEMENT

Build a fully functional squad screen.

## Player list

Display:

- Player name
- Position
- Age
- Overall ability
- Form
- Fitness
- Morale
- Market value
- Availability

Include sorting and filtering by:

- Position
- Age
- Ability
- Value
- Fitness
- Potential
- Contract duration

Player search must work on the current game database.

## Player details

Tapping a player opens a detailed profile.

Include:

- Personal information
- Playing positions
- Key attributes
- Contract
- Wage
- Value
- Development
- Form
- Season statistics
- Injury history
- Transfer history

Actions:

- Add to starting eleven
- Move to substitutes
- Remove from selection
- Set training focus
- Offer contract
- Place on transfer list
- Offer for loan
- Review development

Actions must update the actual persistent game state.

# 10. TACTICS AND FORMATIONS

Build an interactive football tactics editor optimized for a small touchscreen.

## Supported formations

At minimum:

- 4-3-3
- 4-2-3-1
- 4-4-2
- 4-1-4-1
- 3-5-2
- 3-4-3
- 5-3-2
- 4-4-1-1

## Tactics settings

Include:

- Team mentality
- Passing style
- Tempo
- Pressing intensity
- Defensive line
- Attacking width
- Defensive compactness
- Counterattacking
- Build-up play
- Possession approach
- Player roles
- Set-piece takers
- Team captain

Use coherent limits and valid configuration combinations.

## Tactical editor UX

Create a proportional football pitch.

Players appear as draggable position markers with shirt numbers.

Support touch and mouse interaction.

Dragging players updates the selected lineup, not an unrelated visual-only state.

Alternative tap-to-swap interactions must be available for accessibility.

Tapping a position should allow users to choose an eligible player.

Provide:

- Auto-select best eleven
- Save tactic
- Load tactic
- Reset formation
- Compare squad suitability

Warn when the starting eleven is incomplete or includes unavailable players.

Changes to tactics must materially affect simulated match behavior.

# 11. REALISTIC FOOTBALL MATCH ENGINE

This is one of the most important modules.

Use the verified existing engine as the starting point, extending it where required.

The engine must calculate match events from:

- Player attributes
- Tactical instructions
- Team quality
- Position suitability
- Fatigue
- Morale
- Form
- Match circumstances
- Home advantage
- Discipline
- Injuries
- Substitutions
- Seeded randomness

## Events

Support:

- Kickoffs
- Passes
- Shots
- Saves
- Goals
- Assists
- Corners
- Free kicks
- Penalties
- Yellow cards
- Red cards
- Offsides
- Injuries
- Substitutions
- Half-time
- Full-time

Match statistics must derive from actual simulation events, never independent random UI counters.

For example, a shot recorded in the statistics must correspond to an actual match event.

Scores, assists, cards and substitutions must remain consistent with the event log.

## Match realism

A stronger team should win more often across a large sample, but upsets and draws must remain possible.

Tactics must have genuine advantages and trade-offs.

Do not guarantee a win simply because one club has stronger players.

Fatigue, player positions, match momentum and opponent strategy should influence results.

Build automated balance simulations across thousands of matches to identify impossible scores, excessive goals, unrealistic injury rates and severe tactical exploits.

Use configurable tuning parameters with documented test results rather than arbitrary hardcoded score adjustments.

# 12. INTERACTIVE 2D MATCH VIEWER

Build an actual 2D football match viewer, not just a scoreboard.

## Required features

- Football pitch
- Two visually distinct teams
- 22 moving player markers
- Ball movement
- Real match clock
- Scoreboard
- Match-event timeline
- Live commentary
- Team statistics
- Tactical changes
- Substitution controls

## Match controls

- Pause
- Resume
- Normal speed
- Fast speed
- Skip to half-time
- Skip to full-time

When the game is paused, provide access to substitutions and relevant tactical settings.

Apply changes to the remaining match simulation.

## Rendering

Prefer Canvas 2D or another lightweight rendering approach.

Use positions and events supplied by the match engine. Do not show arbitrary animations that contradict the simulated match.

The pitch must fit comfortably on a mobile device.

Allow an expanded pitch view and a compact commentary view.

Respect reduced-motion settings.

The match must remain functionally playable when animations are disabled.

## After the match

Display:

- Final score
- Goalscorers
- Assists
- Possession
- Shots
- Shots on target
- Cards
- Player ratings
- Match timeline
- Tactical summary
- League table impact

Persist all relevant match results before returning to the dashboard.

# 13. TRANSFER MARKET

Implement a genuine transfer market.

## Transfer search

Users can search for football players by:

- Name
- Club
- League
- Position
- Age
- Ability
- Potential
- Price
- Contract availability

## Buying a player

Complete flow:

1. Search for a player.
2. Open player profile.
3. Review scouting information.
4. Make a transfer offer.
5. AI club evaluates offer.
6. Club accepts, rejects or counters.
7. Negotiate personal terms.
8. Apply budget and squad-rule checks.
9. Confirm transfer.
10. Update both clubs and their financial records.

A successful transfer must:

- Remove the player from the previous first-team roster, subject to loan rules.
- Add the player to the correct new roster.
- Update contract records.
- Update transfer budgets and financial commitments.
- Add a transfer-history event.
- Update squad registration eligibility.
- Generate relevant inbox messages.

Prevent duplicate ownership and repeated acceptance exploits.

## Selling players

Support:

- Transfer-listing
- Receiving offers
- Accepting offers
- Rejecting offers
- Negotiating counteroffers
- Completing player departures

## Loans

Include:

- Loan duration
- Wage contribution
- Loaned-in and loaned-out status
- Return date
- Recall restrictions where applicable

## Transfer AI

Other clubs must:

- Identify squad weaknesses
- Look for suitable players
- Consider budget limits
- Sell surplus players
- Replace important departures
- Avoid unreasonable offers
- Respect transfer windows

Negotiations must follow repeatable rules rather than random acceptance.

# 14. CONTRACT NEGOTIATIONS

Build realistic contract negotiations.

Support:

- Contract duration
- Weekly or monthly wages
- Signing bonus
- Performance bonuses
- Squad role
- Extension
- Contract expiry
- Free-agent signings

Players and agents must evaluate offers based on:

- Current salary
- Reputation
- Role
- Age
- Club quality
- Expected playing time
- Other available opportunities

Rejected negotiations should provide comprehensible feedback.

Contract renewals and newly agreed salaries must affect future club expenses.

# 15. PLAYER ATTRIBUTES AND DEVELOPMENT

Use an understandable attribute model with game-defined scales.

Include physical, technical and mental attributes such as:

- Pace
- Acceleration
- Stamina
- Strength
- Finishing
- Passing
- Dribbling
- First touch
- Tackling
- Heading
- Vision
- Composure
- Decisions
- Positioning
- Leadership
- Goalkeeping

Do not claim these numbers are official licensed ratings unless actually supplied as such.

## Development engine

Players should evolve through:

- Age
- Playing time
- Training
- Coaching quality
- Potential
- Facilities
- Injuries
- Professionalism
- Form

Young players should generally have more room to develop.

Older players may decline physically.

Progression must not be unlimited or identical for every player.

Player history and development should persist across seasons.

# 16. TRAINING, FITNESS AND MORALE

Build a training management module.

## Training

Allow:

- General team training
- Attacking focus
- Defensive focus
- Possession focus
- Fitness work
- Match preparation
- Individual training focus
- Recovery sessions

Training should influence future performance and development with appropriate trade-offs.

## Fitness and injuries

Track:

- Match fitness
- Fatigue
- Injury risk
- Injury status
- Estimated recovery date
- Training availability
- Match availability

Injured players cannot be selected when medically unavailable in the game rules.

Recovery must advance as the calendar progresses.

## Morale

Morale should respond to:

- Match results
- Playing time
- Contracts
- Transfers
- Team performance
- Squad role expectations

Include clear explanations of significant morale changes.

# 17. SCOUTING AND RECRUITMENT

Build a scouting system that creates meaningful discovery.

## Scouting workflow

1. Open scouting.
2. Set a position or player profile.
3. Choose an eligible region, league or shortlist.
4. Assign a scout.
5. Advance the game calendar.
6. Receive scouting results.
7. Review player reports.
8. Add players to a shortlist.
9. Start transfer negotiations.

## Scouting reports

Include:

- Estimated ability
- Potential range
- Position fit
- Estimated valuation
- Strengths
- Weaknesses
- Recommendation
- Scout confidence

Unknown players may initially have incomplete information.

Further scouting improves confidence.

Never make every prospect immediately and perfectly known.

Scouts must differ in quality and capability.

# 18. YOUTH ACADEMY

Build a functional youth development system.

Include:

- Youth squad
- Youth player profiles
- Academy quality
- Youth coaches
- Academy development
- Annual youth intake
- Promote to first team
- Loan for experience
- Release player

Generated youth players must receive persistent identities, football attributes, age, nationality, positions and potential.

Use a diverse, coherent fictional name-generation system for newly generated players.

Never present generated youth players as real, licensed professional footballers.

Youth development and squad promotion must work across consecutive seasons.

# 19. STAFF MANAGEMENT

Add useful staff types:

- Assistant manager
- Coaches
- Scouts
- Physiotherapists
- Youth coaches

Support:

- View staff
- Hire staff
- Release staff
- Review contracts
- Review quality and specialties

Staff quality should influence appropriate systems such as training, scouting and recovery.

Avoid decorative staff screens with no simulation impact.

# 20. CLUB FINANCES

Implement a working football club economy.

## Finance dashboard

Show:

- Cash balance
- Transfer budget
- Wage budget
- Actual wage commitments
- Recurring income
- Recurring expenses
- Transfer income
- Transfer expenses
- Seasonal projections

## Financial behavior

Support:

- Player wages
- Staff wages
- Transfer fees
- Contract bonuses
- Matchday revenue
- Sponsorship revenue
- Competition prize money
- Stadium-related expenses
- Youth and training costs

Define consistent financial periods and currency handling.

All transactions must be recorded in a financial ledger.

Displayed totals must reconcile with underlying transactions.

Protect against negative or impossible financial states according to clearly defined game rules.

## Club investment

Allow investment in:

- Training facilities
- Youth academy
- Scouting network

Investments should have costs, completion times and realistic game benefits.

No pay-to-win mechanics.

# 21. CALENDAR AND SEASON PROGRESSION

Build a reliable in-game calendar.

The user controls progression through **Doorgaan**.

The calendar engine handles:

- Matches
- Training
- Injuries
- Recovery
- Scouting
- Transfers
- Contracts
- Inbox updates
- Financial transactions
- Competition changes
- Season transitions

## Next-day progression

Advancing the game must update all relevant systems exactly once.

Use atomic, idempotent progression operations.

If the app crashes during a game-day update, the player must be able to recover without duplicated fixtures, payments, transfers or league results.

## End of season

Automatically:

- Finalize league positions.
- Award trophies.
- Update manager reputation.
- Apply promotion and relegation.
- Pay applicable competition rewards.
- Age players at the correct date.
- Process contracts.
- Generate the next season's fixtures.
- Create youth intake where applicable.
- Reset seasonal statistics while preserving historical records.

The player must be able to continue into the next season without creating a new career.

# 22. INBOX AND FOOTBALL NEWS

Build a game inbox with meaningful generated messages.

Examples:

- Transfer bid received
- Transfer accepted
- Player injured
- Player recovered
- Contract expiring
- Scouting report completed
- Board expectations
- Club finances update
- Match preparation notice
- League results
- Youth intake report
- Season recap

Each actionable notification must link to the correct game screen.

If an issue has already been resolved, the notification should reflect its new state.

Avoid generating excessive meaningless notifications.

# 23. AI-MANAGED FOOTBALL CLUBS

The football world must continue independently of the user.

Every unmanaged club requires an AI manager capable of:

- Picking lineups
- Choosing tactics
- Rotating tired players
- Managing injuries
- Negotiating transfers
- Adjusting wage budgets
- Developing youth players
- Replacing departing players
- Responding to sporting performance

Different AI clubs should have distinct profiles:

- Youth-focused
- Financially conservative
- High-spending
- Tactical specialist
- Selling club
- Title contender

AI management must use the same essential rules and financial constraints as the human player.

Do not allow AI clubs to create money or duplicate players.

# 24. SAVES AND CAREER PERSISTENCE

Saving must be completely reliable.

## Local save system

Implement:

- Autosave
- Manual save
- Multiple career slots
- Save naming
- Last-played information
- Export save
- Import save
- Delete save with confirmation
- Schema migrations
- Corruption detection
- Recoverable previous save

Use transactional persistence and versioned save formats.

Autosave after important game actions and before appropriate lifecycle transitions.

Handle insufficient device storage gracefully.

Do not depend on a successful background timer to preserve recent gameplay.

## Savegame integrity

A save must include or reference all information necessary to resume the exact career:

- World snapshot
- Club state
- Players
- Contracts
- Fixtures
- Results
- Finances
- Transfers
- Injuries
- Competition histories
- RNG state or seeds
- Simulation version
- Save schema version

## Optional cloud saves

When Supabase is configured, support account-based cloud saves.

Use proper authentication and Row Level Security.

Users may only read and modify their own saves.

Cloud synchronization must detect conflicts rather than silently overwriting newer progress.

Without Supabase, the local game must remain fully usable.

Clearly indicate that local-only saves do not automatically synchronize between devices.

# 25. MOBILE UX/UI DESIGN STANDARD

The design must feel like a premium football management game built specifically for a phone.

It should NOT look like a generic business admin dashboard.

## Visual direction

- Premium sports-editorial identity
- Strong typography
- Clean navigation
- Restrained use of cards
- High-contrast information
- Subtle accent colors
- Readable tables
- Clear player hierarchy
- Purposeful micro-interactions
- Smooth screen transitions

Use a coherent dark or light visual system, chosen based on game readability and match presentation.

Avoid unnecessary gradients, glow, large decorative icons, glassmorphism and excessive animation.

## Mobile interaction principles

- Main actions reachable with one hand
- Bottom navigation
- Large enough touch targets
- No horizontal page overflow
- Sheets for contextual actions
- Quick selection tools
- Minimal text entry
- Persistent screen state
- Immediate feedback
- Clear back navigation
- Small-screen-friendly tables

## Mobile responsive targets

Test at minimum:

- 320px width
- 360px width
- 390px width
- 430px width
- Tablet
- Desktop

Also verify:

- iOS Safari
- Android Chrome
- Desktop Chromium
- Desktop Firefox
- Desktop Safari when available

Respect safe areas around the iPhone Dynamic Island, home indicator and browser navigation.

## Accessibility

Target WCAG 2.2 AA where applicable.

Support:

- Keyboard navigation
- Visible focus indicators
- Screen reader labels
- Reduced motion
- Appropriate contrast
- Non-color-only statuses
- Accessible alternatives to drag-and-drop
- Predictable dialogs and sheets

# 26. PWA AND PERFORMANCE

The game must be installable as a Progressive Web App.

Implement:

- Web app manifest
- Correct icons
- Splash screen configuration
- Service worker
- Offline support for locally available game content
- Update notifications
- Reliable cache invalidation
- Add-to-home-screen support

Avoid large initial downloads.

Use:

- Code splitting
- Lazy-loaded screens
- Virtualized player lists
- Memoized derived state
- Web Workers
- Image optimization
- Efficient animation loops
- Limited rerenders

Do not load thousands of player portraits unnecessarily.

The app must remain responsive while a season or match is being simulated.

Provide determinate progress feedback where possible, cancellation where safe, and usable recovery if a worker crashes.

Test on real or emulated mid-range mobile devices.

# 27. DATA MODELS AND GAME INVARIANTS

Implement typed, validated domain models.

At minimum:

- Manager
- ManagerCareer
- Country
- Competition
- CompetitionRules
- Club
- Player
- PlayerAttributes
- PlayerDevelopment
- SquadMembership
- Contract
- Transfer
- Loan
- Staff
- ScoutReport
- TrainingPlan
- Injury
- Fixture
- Match
- MatchEvent
- LeagueStanding
- FinanceTransaction
- Season
- YouthIntake
- InboxMessage
- GameSave
- WorldState
- DatasetProvenance

Use stable IDs and explicit relationships.

Essential invariants:

- Exactly two teams per match.
- Exactly one final result per completed fixture.
- A match cannot conclude before its required result is determined.
- A player cannot appear for two opposing teams in the same match.
- An eligible lineup contains eleven players.
- Substitutions comply with configured competition rules.
- A suspended player is unavailable when the suspension applies.
- A completed transfer preserves ownership consistency.
- A loan cannot produce two simultaneous active playing registrations where prohibited.
- League statistics equal the aggregate of completed fixtures.
- Financial balances reconcile with ledger transactions.
- Season transitions occur exactly once.
- A restored save recreates the same valid game state.

Create property-based tests where useful.

# 28. TESTING AND QUALITY ASSURANCE

The game is NOT finished because the production build succeeds.

Perform comprehensive QA.

## Unit testing

Test:

- Fixture generation
- Match simulation
- League standings
- Player eligibility
- Tactical effects
- Player development
- Injury recovery
- Transfer negotiation
- Contract calculations
- Finance calculations
- Season transitions
- Save migrations

## Integration testing

Test full state transitions across modules.

Examples:

- A transfer completes and updates two clubs.
- A player injury changes match eligibility.
- A match result updates league standings and morale.
- A youth player joins the first team and can be selected.
- A season transition preserves the correct history.
- A contract expiration changes squad and wage commitments.

## End-to-end browser testing

Use Playwright or equivalent.

At minimum verify this complete career flow:

1. Open the game.
2. Create a manager.
3. Select a club.
4. Start the first season.
5. Open the squad.
6. Change the starting eleven.
7. Save a tactic.
8. Play the first match.
9. Make a substitution.
10. Finish the match.
11. Review the results.
12. Search for a player.
13. Submit a transfer offer.
14. Complete the transfer.
15. Review the club's finances.
16. Assign a scout.
17. Receive a report.
18. Set a training focus.
19. Advance the calendar.
20. Complete an entire season.
21. Start the next season.
22. Close and reopen the game.
23. Verify that the career remains intact.

## Simulation stress tests

Run automated simulations of:

- Thousands of matches
- Hundreds of complete seasons across independent worlds
- Different tactical configurations
- Different club strengths
- Low-budget and high-budget clubs
- Clubs with many injured players
- Transfer-window transitions

Search for:

- Crashes
- Infinite loops
- Impossible results
- Negative player ages
- Duplicate players
- Invalid league tables
- Budget inflation
- Broken contracts
- Inconsistent savegames
- Unreasonable match statistics

## Mobile testing

Check:

- Small screens
- Long player names
- Large squad lists
- Portrait orientation
- Landscape where supported
- Modal overflow
- Scrolling behavior
- Touch gestures
- Interrupted animations
- App backgrounding
- Browser refresh
- Offline/online transitions
- Failed saves
- Slow devices
- Accessibility

Maintain a documented test matrix with actual results.

Do not claim iOS Safari has been tested if only desktop Chromium testing was performed.

# 29. SECURITY AND DATA PROTECTION

Implement:

- Input validation
- Schema validation
- Safe file import
- Protection against malicious save files
- Dependency vulnerability checks
- Rate limiting for public server endpoints
- Secure API key handling
- Server-side access controls where required
- Proper Supabase RLS where cloud saves exist
- Restricted access to licensed provider credentials

Never expose secret API tokens in frontend bundles.

Do not put `.env` files containing secrets into GitHub.

Cloud operations and licensed-data delivery must follow applicable terms.

Never assume locally stored game data is secret or tamper-proof.

For single-player gameplay, client-side simulation is acceptable. If competitive multiplayer or ranked functionality is added in the future, use server-authoritative validation.

# 30. IMPLEMENTATION WORKFLOW

Execute the following phases in order.

## Phase A — Technical discovery

1. Inspect available GitHub repositories.
2. Audit code licenses.
3. Review simulation capabilities.
4. Identify missing game mechanics.
5. Evaluate licensed data integration.
6. Choose architecture.
7. Produce a prioritized implementation plan.
8. Document major technical decisions.

## Phase B — Project foundation

1. Set up repository and application structure.
2. Configure TypeScript, styling and tooling.
3. Build core domain models.
4. Integrate the match engine.
5. Implement deterministic simulation.
6. Build persistence and migrations.
7. Configure automated testing.

## Phase C — Core playable football game

Implement:

- Manager onboarding
- Club selection
- Squad management
- Tactics
- Calendar
- Match simulation
- 2D viewer
- Fixtures
- Competitions
- Results
- Standings
- Multi-season progression

These features must work together before proceeding to deep management systems.

## Phase D — Advanced management systems

Implement:

- Transfers
- Contracts
- Scouting
- Training
- Youth development
- Injuries
- Morale
- Staff
- Finances
- Board confidence
- AI club management
- Inbox and news

Integrate each system into existing career progression.

## Phase E — Real-world data integration

1. Connect authorized data source.
2. Import available licensed competitions, clubs and players.
3. Validate identifiers and club assignments.
4. Generate missing game-only simulation attributes where permitted and necessary.
5. Run gameplay tests on real-data-based careers.
6. Verify licensing requirements and notices.
7. Confirm that no unauthorized assets are included.

## Phase F — UX/UI and performance

1. Build premium mobile-first interface.
2. Optimize the main gameplay loop.
3. Improve navigation and touch interactions.
4. Test 2D match performance.
5. Implement PWA.
6. Optimize loading and state transitions.
7. Complete accessibility checks.

## Phase G — Full QA

1. Run unit tests.
2. Run integration tests.
3. Run simulation stress tests.
4. Run browser end-to-end tests.
5. Verify savegame integrity.
6. Run security checks.
7. Fix blocking defects.
8. Repeat failed tests.
9. Document remaining limitations.

## Phase H — Production release

1. Push code to GitHub.
2. Create a release branch and pull request.
3. Run automated checks on the exact release commit.
4. Review changes and dependency licenses.
5. Confirm QA-tested SHA still matches the release HEAD.
6. Merge only when release-blocking checks pass.
7. Deploy to Vercel.
8. Verify production startup and assets.
9. Start a real test career on the live deployment.
10. Test a match, a transfer and a save/load cycle.
11. Check mobile layout and PWA installation.
12. Report the live URL and release status.

If infrastructure credentials or licensed data access are missing, document the exact blocker. Continue implementing and testing everything that can safely be completed, but do not falsely report a fully licensed production release.

# 31. RELEASE ACCEPTANCE CRITERIA

A release can be called production-ready only if all the following are satisfied:

**Core game**

- New career works.
- Playable licensed clubs have complete validated squads.
- Real player names display correctly from the authorized source.
- Squad selection works.
- Formations and tactics function.
- Matches produce valid results.
- 2D match viewer works.
- Competition standings update correctly.
- Multiple seasons are playable.

**Advanced game**

- Transfers work.
- Contracts work.
- Scouting works.
- Youth development works.
- Training works.
- Injuries and recovery work.
- Staff management works.
- Club finances work.
- AI opponents manage their teams.
- Match statistics and player histories persist.

**Technical quality**

- Typecheck passes.
- Lint passes.
- Production build passes.
- Core unit tests pass.
- Integration tests pass.
- End-to-end tests pass.
- Stress tests reveal no unresolved release blockers.
- Save migration and recovery tests pass.
- No known critical security issues remain.
- Mobile gameplay is responsive.
- Production deployment is publicly accessible.
- Live smoke test succeeds.

No unfinished feature may be represented as functional.

Do not hide failures, skip untested functionality or replace broken features with static mockups.

# 32. EXPECTED FINAL DELIVERABLES

Provide:

1. Complete GitHub repository.
2. Working Vercel production URL.
3. Fully playable webgame.
4. Installable mobile PWA.
5. Functional 2D football match viewer.
6. Integrated licensed-player data where provided and authorized.
7. Tested football match engine.
8. Functional transfer and contract systems.
9. Functional scouting and youth development.
10. Functional training and staff systems.
11. Complete game economy.
12. Persistent multi-season careers.
13. Local save and recovery system.
14. Optional secure cloud-save capability.
15. Automated test suite.
16. Technical architecture documentation.
17. Dependency and license report.
18. Production deployment instructions.
19. Known limitations and QA report.
20. Final release verification.

# 33. FINAL DIRECTIVE

You are not building a website about football.

You are building a **real football management game**.

The product must deliver the experience of managing a football club across many seasons, where player decisions influence matches, match results influence club performance, and the football world evolves continuously.

Prioritize actual game mechanics over decorative features.

Prioritize mobile playability over desktop complexity.

Prioritize reliable savegames over unnecessary cloud functionality.

Prioritize credible simulation over visual spectacle.

Build the complete integrated functionality of Phase 1 and Phase 2.

Use proven code wherever practical and legally permitted.

Implement missing functionality professionally.

Test real user journeys.

Deploy only after release QA has passed.

**The project is complete only when a user can open the production URL on their phone, select a club, manage a squad, play matches, negotiate transfers, develop players, complete seasons and reliably resume the same career.**

Begin with repository research and architectural decisions, then execute the implementation through to verified production deployment without stopping at a design proposal.