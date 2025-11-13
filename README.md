# companion-module-twitch-api

Module for integration with Twitch through their API and Chat, documentation for that can be found here: https://dev.twitch.tv/docs



# Patch Notes
**v4.1.1**
- Fixed a bug causing a crash when updating chat settings
- Improved error logging

**v4.1.0**
- Added PATCH, PUT, and DELETE, methods for custom API request, as well as defaulting to JSON content type
- Fixed a variable typo on selected channel category id

**v4.0.1**
- Fix for Open Channel NodeJS permissions

**v4.0.0**
- Revamped Oauth process to now use the Device Code Flow (DCF) is used for all module users
- Added config options for the permissions required for various endpoints
- Reworked entire API request logic
- Added more Actions, with more on the roadmap to be added for more complete API coverage where appropriate for a client side application
- Added `clip_id`, `clip_url`, and `clip_edit_url` variables after using the Create Clip Action
- Added `ad_next`, `ad_last`, `ad_duration`, `ad_preroll_free_time`, `ad_snooze_count`, and `ad_snooze_refresh` variables for ad scheduling

**v3.0.4**
- Fix to try resolve excess token server requests

**v3.0.2**
- Added support for Instance Variables in chat messages

**v3.0.1**
- Removed deprecated endpoint 

**v3.0.0**
- Updated module for Companion 3
- Replaced most of the deprecated Chat Commands with API requests
- Added additional API functionality in preparation for upcoming features

Older patch notes available in [docs/PATCH_NOTES.md](./docs/PATCH_NOTES.md)
