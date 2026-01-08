# IMPOSTER HUNT - Map Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌─────────┐       ┌──────────┐       ┌─────────┐       ┌─────────┐  │
│   │ REACTOR │───────│CAFETERIA │───────│  ADMIN  │───────│ WEAPONS │  │
│   │  (Task) │       │(EMERGENCY│       │ (Task)  │       │ (Task)  │  │
│   └────┬────┘       │  BUTTON) │       └────┬────┘       └────┬────┘  │
│        │            └─────┬────┘            │                 │        │
│        │                  │                 │                 │        │
│   ┌────┴────┐        ┌────┴────┐      ┌────┴────┐       ┌────┴────┐  │
│   │ MEDBAY  ├────────┤ CENTRAL ├──────┤  PATH   ├───────┤  PATH   │  │
│   │ (Task)  │        │  HALL   │      │         │       │         │  │
│   └────┬────┘        └────┬────┘      └─────────┘       └────┬────┘  │
│        │                  │                                   │        │
│        │             ┌────┴────┐                         ┌────┴────┐  │
│   ┌────┴────┐        │  PATH   │                         │  NAVI-  │  │
│   │  LEFT   │────────┤ MIDDLE  ├─────────────────────────┤ GATION  │  │
│   │VERTICAL │        │  LEFT   │                         │ (Task)  │  │
│   │ HALL    │        └─────────┘                         └────┬────┘  │
│   └────┬────┘                                                 │        │
│        │                                                       │        │
│   ┌────┴────┐        ┌─────────┐                         ┌────┴────┐  │
│   │ELECTRIC │        │ MIDDLE  │                         │  RIGHT  │  │
│   │  (Task) │────────┤  RIGHT  ├─────────────────────────┤VERTICAL │  │
│   └────┬────┘        │  PATH   │                         │  HALL   │  │
│        │             └─────────┘                         └────┬────┘  │
│        │                  │                                   │        │
│   ┌────┴────┐        ┌────┴────┐                         ┌────┴────┐  │
│   │SECURITY │────────│ STORAGE │─────────────────────────│ SHIELDS │  │
│   │ (Task)  │        │ (Task)  │                         │ (Task)  │  │
│   └─────────┘        └─────────┘                         └─────────┘  │
│        │                  │                                   │        │
│   ┌────┴────┐             │                              ┌────┴────┐  │
│   │ ENGINE  │─────────────┴──────────────────────────────│  PATH   │  │
│   │ (Task)  │                                            │         │  │
│   └─────────┘                                            └─────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

LEGEND:
═══════  Main Corridors (Horizontal/Vertical)
───────  Connecting Paths
┌─────┐  Rooms
(Task)   Has task station
(EMERGENCY BUTTON) Can call emergency meeting

ROOM COLORS:
- Cafeteria: Green (#2a4a2a) - HAS EMERGENCY BUTTON
- MedBay: Blue (#2a2a4a)
- Electrical: Dark Red (#4a2a2a)
- Security: Gray (#3a3a3a)
- Reactor: Brown (#4a3a2a)
- Engine: Yellow-Brown (#4a4a2a)
- Storage: Green-Gray (#3a4a3a)
- Admin: Purple (#4a2a4a)
- Weapons: Blue-Gray (#2a3a4a)
- Navigation: Purple-Gray (#3a2a4a)
- Shields: Cyan (#2a4a4a)

PATH NETWORK:
1. Central Vertical Hall - Connects Cafeteria to Storage
2. Upper Horizontal - Connects all top rooms
3. Lower Horizontal - Connects all bottom rooms
4. Left Vertical - Connects MedBay → Electrical → Security → Engine
5. Right Vertical - Connects Weapons → Navigation → Shields
6. Middle Left Branch - Connects Left Vertical to Central Hall
7. Middle Right Branch - Connects Central Hall to Right Vertical
8. Top Connectors - Link Reactor and Admin to upper corridor
9. Bottom Connectors - Link Engine and Shields to lower corridor

STARTING POSITION:
Players spawn in the Central Hall area (around x: 1000, y: 700)

EMERGENCY MEETING:
Go to Cafeteria (center top) to access emergency meeting button
```

## Map Coordinates Reference

### Rooms:
- **Cafeteria**: x: 850-1150, y: 100-300 ⚠️ EMERGENCY BUTTON
- **MedBay**: x: 100-300, y: 300-550
- **Electrical**: x: 100-300, y: 700-950
- **Security**: x: 100-300, y: 1100-1300
- **Reactor**: x: 500-750, y: 100-300
- **Engine**: x: 500-750, y: 1100-1300
- **Storage**: x: 850-1150, y: 1100-1300
- **Admin**: x: 1200-1400, y: 100-350
- **Weapons**: x: 1700-1900, y: 300-550
- **Navigation**: x: 1700-1900, y: 700-950
- **Shields**: x: 1700-1900, y: 1100-1300

### Main Paths:
- **Central Vertical**: x: 950-1050, y: 300-1200
- **Upper Horizontal**: x: 300-1700, y: 380-460
- **Lower Horizontal**: x: 300-1700, y: 1000-1080
- **Left Vertical**: x: 350-430, y: 300-1300
- **Right Vertical**: x: 1570-1650, y: 300-1300

All rooms are now connected and accessible!
