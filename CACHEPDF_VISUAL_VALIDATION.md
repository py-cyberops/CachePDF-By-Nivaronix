# CachePDF Visual Validation Evidence

## Theme, Logo, Navigation, and Density Review

| Review target | Evidence | Result |
| --- | --- | --- |
| Dark theme | Isolated Chromium capture of `/tools` at 1280×720 (`dark-tools-ready.png`) | The light CachePDF lockup, desktop navigation labels, Local state control, theme toggle, and Open PDF action remain legible on the near-black shell. |
| Explicit light theme | Isolated Chromium capture of `/tools` at 1280×720 (`light-comfortable-tools.png`) | Paper-white cards use ink text and cyan operating signals. Header navigation is visibly larger and higher-contrast than the pre-correction state. |
| System preference | Isolated Chromium capture of `/tools` at 1280×720 with `cachepdf-theme-preference=system` and emulated `prefers-color-scheme: dark` (`system-dark-comfortable-tools.png`) | The system preference selected the dark shell and dark-specific CachePDF asset treatment while retaining contrast in navigation and actions. |
| Density | The workbench presents Comfortable and Compact controls. The compact rule reduces tool-card minimum height and padding, heading and paragraph spacing, page-thumbnail padding and gaps, and page-manager spacing. | Both density modes are implemented through persisted workbench styling; desktop and mobile control visibility was reviewed. |
| Workbench-directory hover | Isolated Chromium pointer-hover capture of `/tools` (`light-hover-tools-directory.png`) | The hovered action card rendered a pale cyan-white gradient. Its measured heading and body colors were `rgb(16, 39, 53)` and `rgb(66, 89, 106)`, respectively; the dark hover color is no longer applied. |
| Homepage mode-card hover | Isolated Chromium pointer-hover capture of `/` (`light-hover-home-modes.png`) | The five-mode card grid retained paper-white surfaces with visible ink labels and cyan action affordances while a card was hovered. |

The captured screenshot file is stored outside the deployed application workspace for validation only. It is not used by the client runtime.
