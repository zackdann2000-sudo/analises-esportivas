# The Connection Hub

.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ca624497-8e53-470e-88c7-367bb19aac24).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


## Placar Pro — Football-Data.org

The app uses a TanStack Start server function to call Football-Data.org v4. The API token is read only on the server from `FOOTBALL_DATA_API_KEY`; it must never be added to a `VITE_*` variable or frontend code.

### Configure and manage API keys

1. Create a free account and token at https://www.football-data.org/client/register.
2. Open the app's **Gerenciar APIs** page at `/apis`, select Football-Data.org, paste the token and save. The match dashboard will use this key automatically in the same browser.
3. For production or multi-user deployments, prefer the server environment variable `FOOTBALL_DATA_API_KEY` in Render or another Node-compatible host. Never commit a real token or place it in a `VITE_*` variable.
4. The in-app manager currently integrates Football-Data.org. Other providers can be saved as entries, but each requires a provider-specific adapter before it can supply live data.
5. The browser-based manager stores keys in local storage on that browser. This is convenient for personal testing but is not the recommended storage for a shared production system. The dashboard requests matches for a rolling seven-day past/future window and refreshes every 60 seconds. Server responses are cached for 45 seconds to reduce API calls. The free plan has a rate limit, so avoid repeated manual refreshes.

### Data coverage

- Matches, fixtures, scores and competition standings are requested through API v4.
- The free Football-Data.org API does **not** provide comprehensive per-match possession, shots, corners, fouls and card statistics. The interface displays an em dash for unavailable values instead of inventing numbers.
- The list of competitions available depends on your plan and the provider's current coverage. A 403 response is shown as a plan/permission issue.
- If no token is configured or the API is temporarily unavailable, the UI keeps the demo fallback and shows a status message.

### API documentation

- https://www.football-data.org/documentation/quickstart
- https://docs.football-data.org/general/v4/policies.html
- https://docs.football-data.org/general/v4/errors.html
