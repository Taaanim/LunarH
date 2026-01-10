# Map Layout

## Visual Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌─────────┐       ┌──────────┐       ┌─────────┐       ┌─────────┐   │
│   │ REACTOR │───────│CAFETERIA │───────│  ADMIN  │───────│ WEAPONS │   │
│   │  (Task) │       │(EMERGENCY│       │ (Task)  │       │ (Task)  │   │
│   └────┬────┘       │  BUTTON) │       └────┬────┘       └────┬────┘   │
│        │            └─────┬────┘            │                 │        │
│        │                  │                 │                 │        │
│   ┌────┴────┐        ┌────┴────┐      ┌────┴────┐       ┌────┴────┐   │
│   │ MEDBAY  ├────────┤ CENTRAL ├──────┤  PATH   ├───────┤  PATH   │   │
│   │ (Task)  │        │  HALL   │      │         │       │         │   │
│   └────┬────┘        └────┬────┘      └─────────┘       └────┬────┘   │
│        │                  │                                   │        │
│        │             ┌────┴────┐                         ┌────┴────┐   │
│   ┌────┴────┐        │  PATH   │                         │  NAVI-  │   │
│   │  LEFT   │────────┤ MIDDLE  ├─────────────────────────┤ GATION  │   │
│   │VERTICAL │        │  LEFT   │                         │ (Task)  │   │
│   │ HALL    │        └─────────┘                         └────┬────┘   │
│   └────┬────┘                                                 │        │
│        │                                                      │        │
│   ┌────┴────┐        ┌─────────┐                         ┌────┴────┐   │
│   │ELECTRIC │        │ MIDDLE  │                         │  RIGHT  │   │
│   │  (Task) │────────┤  RIGHT  ├─────────────────────────┤VERTICAL │   │
│   └────┬────┘        │  PATH   │                         │  HALL   │   │
│        │             └─────────┘                         └────┬────┘   │
│        │                  │                                   │        │
│   ┌────┴────┐        ┌────┴────┐                         ┌────┴────┐   │
│   │SECURITY │────────│ STORAGE │─────────────────────────│ SHIELDS │   │
│   │ (Task)  │        │ (Task)  │                         │ (Task)  │   │
│   └─────────┘        └─────────┘                         └─────────┘   │
│        │                  │                                   │        │
│   ┌────┴────┐             │                              ┌────┴────┐   │
│   │ ENGINE  │─────────────┴──────────────────────────────│  PATH   │   │
│   │ (Task)  │                                            │         │   │
│   └─────────┘                                            └─────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Room Reference

| Room | Color Code | Notes |
|------|------------|-------|
| Cafeteria | #2a4a2a | Emergency Button Location |
| MedBay | #2a2a4a | |
| Electrical | #4a2a2a | |
| Security | #3a3a3a | |
| Reactor | #4a3a2a | |
| Engine | #4a4a2a | |
| Storage | #3a4a3a | |
| Admin | #4a2a4a | |
| Weapons | #2a3a4a | |
| Navigation | #3a2a4a | |
| Shields | #2a4a4a | |

## Room Coordinates

| Room | X Range | Y Range |
|------|---------|---------|
| Cafeteria | 850-1150 | 100-300 |
| MedBay | 100-300 | 300-550 |
| Electrical | 100-300 | 700-950 |
| Security | 100-300 | 1100-1300 |
| Reactor | 500-750 | 100-300 |
| Engine | 500-750 | 1100-1300 |
| Storage | 850-1150 | 1100-1300 |
| Admin | 1200-1400 | 100-350 |
| Weapons | 1700-1900 | 300-550 |
| Navigation | 1700-1900 | 700-950 |
| Shields | 1700-1900 | 1100-1300 |

## Path Coordinates

| Path | X Range | Y Range |
|------|---------|---------|
| Central Vertical | 950-1050 | 300-1200 |
| Upper Horizontal | 300-1700 | 380-460 |
| Lower Horizontal | 300-1700 | 1000-1080 |
| Left Vertical | 350-430 | 300-1300 |
| Right Vertical | 1570-1650 | 300-1300 |

## Spawn Point

Players spawn in Central Hall at coordinates: x: 1000, y: 700
