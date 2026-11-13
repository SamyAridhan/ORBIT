# ORBIT — Real-World Precedents (evidence that systems like this exist)
> Collected 11 Nov 2026 by web search, after Samy asked "is there a real transport system that works this way?"
> Purpose: concrete backing for the locked design in `claude/ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md` — the spare bus,
> the driver screen, holding, how ORBIT knows a bus is full, and the planning reports.
> Sources were read as search summaries, not full papers — check each source before citing it in the PSM2 report,
> and add the ones used to `06_RESEARCH_FINDINGS.md` in proper citation format.

## 1. Standby / spare buses waiting at busy points, sent when a route overcrowds (design 3.1)
This is ordinary practice, not a new idea.
- **Winnipeg Transit (Canada):** standby buses are positioned at various points in the city and called on when drivers report overcrowded buses or routes; the director cites daily variation in demand as the reason. https://amp.cbc.ca/news/canada/manitoba/winnipeg-transit-adds-extra-buses-to-meet-demand-on-busy-routes-1.3355378
- **Pittsburgh (Port Authority of Allegheny County, USA):** buses placed on standby along high-priority routes, put into service immediately when a driver reports high ridership and overcrowding (COVID-19 period). https://transitcenter.org/responding-to-covid-19-with-agile-service-changes/
- **Miami-Dade Metro Express (USA, Dec 2025):** five standby buses in the morning and afternoon peaks to help with delays or overcrowding. https://www.miamitodaynews.com/?p=85600
- **Toronto (TTC):** "run as directed" buses kept on standby for overcrowded routes and emergencies (blog analysis; notes their actual use is hard to measure). https://stevemunro.ca/2021/08/16
- **TransitCenter overview:** agencies hold some buses on standby so they can be inserted into gaps in service on frequent routes. https://transitcenter.org/rising-to-the-challenge-of-providing-reliable-service-on-frequent-transit-routes/

## 2. Where the spares wait is usually decided by gut feeling — the gap ORBIT fills (design 3.1, 3.10)
- **Nashville study (arXiv 2403.04072, with the Nashville transit agency):** many agencies station substitute vehicles around their service area and dispatch them to routes with overcrowding or disruption. The partner agency had **no formal policy** for where to station them; it placed them near the central terminal and on high-frequency lines with consistent overcrowding, relying on historical ridership and staff experience. The paper proposes choosing the locations from data. https://arxiv.org/html/2403.04072v1
- **Related (arXiv 2403.03339):** reserve vehicles are dispatched in an ad-hoc way that relies on human experience and intuition. https://arxiv.org/abs/2403.03339v1
- **Research on a shared pool:** "Multiline Bunching Control via Vehicle Substitution" (Transportation Research Part B, 2019) models a standby fleet **shared across several lines and pre-positioned at a few parking locations**; notes pre-positioning shortens the time to respond. https://trid.trb.org/View/1572815 and https://par.nsf.gov/servlets/purl/10111707
- The same line of work mentions Champaign-Urbana MTD (a university town) using bus substitution with standby buses. https://par.nsf.gov/servlets/purl/10079018

**How to use this:** ORBIT's spare pool is standard practice; ORBIT's contribution is deciding *where the spare waits and when it goes* from demand data instead of intuition, and logging every use so the timetable improves.

## 3. Driver tablets and holding for spacing, on a campus bus route (design 3.1 driver side, 3.4)
- **Georgia Tech (USA, 2012):** students, with the campus transport department, built a tablet system on the main campus trolley route (more than 5,000 passengers a day). A server tracks each bus by GPS and tells the driver how long to wait and when to go, to keep buses evenly spaced. Holding happens at a few control points — the ends of the route or special locations such as transfer points. The live trial got positive results and favourable reviews from riders and drivers. Based on Bartholdi & Eisenstein, "A self-coördinating bus route to resist bus bunching", Transportation Research Part B (2012). https://hg.gatech.edu/node/124631 , https://www2.isye.gatech.edu/~jjb/buses/buses.html , https://www.gtalumnimag.com/2012/08/buses-in-a-bunch-no-more
- **Washington DC Metro (WMATA), 2026 Bus Action Plan:** piloting a shift from managing schedules to managing the spacing between buses; early results show less bunching, though it needed extra staff. https://www.wmata.com/content/dam/wmata-com/board-affairs/meeting-materials/2026/2026-06-26-meeting-materials/3A%20Metro%20Bus%20Action%20Plan.pdf

**How to use this:** precedent for the driver-mode screen and for holding, on a university campus, built by students.

## 4. How a system knows a bus is full, and showing it to passengers (design 3.2)
Three sources are used in practice — the same three ORBIT uses, best first.
- **Door counters (APC) feeding rider apps:** AC Transit (California) has counter sensors on each door of its Tempo buses; the onboard count is sent to its website and to apps such as Transit, Google and Moovit. About 80% of its fleet has counters. https://www.masstransitmag.com/technology/miscellaneous/press-release/21161493/ac-transit-ac-transit-now-offering-real-time-onboard-crowding-information , https://www.metro-magazine.com/news/ac-transit-introduces-real-time-info-to-help-bus-capacity , https://actransit.org/rider-capacity
- **Drivers reporting:** in Winnipeg and Pittsburgh (section 1), a driver reporting a crowded bus is what brings in the standby bus.
- **Riders reporting in the app:** the Transit app lets riders in 35 cities report how crowded their bus is with a one-tap survey; where buses have no counters, waiting riders see reports made in the last 10 minutes by riders already on board. https://masstransitmag.com/home/press-release/21160934/transit-app-public-transit-riders-help-one-another-avoid-crowds-with-the-transit-app
- **Rider reports checked against counters:** Big Blue Bus (Santa Monica) and RTC Southern Nevada compare rider reports with door-counter data. https://www.bigbluebus.com/Newsroom/Press/Big-Blue-Bus-Pilots-Predictive-Crowding-Levels-for-All-Lines-in-Transit-App.aspx?type=Press , https://www.metro-magazine.com/news/rtc-partners-with-transit-app-for-real-time-crowding-data
- **NJ Transit "How Full is My Ride":** colour-coded fullness in the app; where staff don't have devices, riders supply it. https://www.njtransit.com/news-events/how-full-my-ride
- **Singapore:** bus apps built on the Land Transport Authority's official data show crowd levels for arriving buses (seats available / standing). https://sg.trip.com/guide/phone/sg-busleh-app.html
- **Caution from the industry:** live counter data should be checked for accuracy before being shown to riders. https://www.masstransitmag.com/technology/passenger-info/article/21154973/occupancy-data-a-real-crowd-pleaser

**How to use this:** precedent for ORBIT's "will I fit?" display, for the door counter → driver tap → rider tap order, and for using rider reports where there are no counters.

## 5. Using passenger data to plan the timetable (design 3.10, planning reports)
- **Singapore LTA:** analysing anonymised fare-card data to find commuter hotspots and manage bus fleets; reports a 92% reduction in the number of bus services with crowding issues. https://smartnation.gov.sg/initiatives/open-data-analytics
- **Door counters are the normal tool for service planning:** e.g. Los Angeles Metro feeding counter data into scheduling (https://libraryarchives.metro.net/dpgtl/employeenews/mymetro/20070411-automatic-passenger-counting-system-aids-scheduling.pdf); TransitCenter notes agencies typically measure ridership with counters and fareboxes (https://transitcenter.org/responding-to-covid-19-with-agile-service-changes/).

**How to use this:** precedent for the planning reports (value layer 1) and for the door-counter assumption.

## What is NOT shown by these sources
- No single system was found that combines all of these with student demand signals from an app. That combination is ORBIT's own design, so its benefit still has to be shown by ORBIT's simulation and, in real use, by the shadow-mode phase.

## See also (added 13 Nov 2026)
- How students come to use a transit app (Grab, Uber, OneBusAway, NUS, Rutgers): evidence in `06_RESEARCH_FINDINGS.md` Part 12; the plan built on it in `08_STUDENT_APP_DESIGN.md`.
- NUS keeps a standby pool of bus captains for its campus shuttle — a campus example alongside section 1. https://nus.edu.sg/inside-nus/stories/on-the-go--campus-wide-mobility-satisfaction-climbs-amid-industry-wide-challenges
