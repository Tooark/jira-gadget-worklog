# Jira Worklog Chart Gadget

🌍 **Languages:** ![USA Flag](https://flagcdn.com/w20/us.png) **English (this file)** · [![Brazil Flag](https://flagcdn.com/w20/br.png) Português](https://github.com/Tooark/jira-gadget-worklog/blob/main/README.pt-BR.md)

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-sponsor-EA4AAA?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/paulosfjunior)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-support-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/paulosfjunior)

A Forge gadget that displays interactive worklog charts on the Jira dashboard. The gadget aggregates and visualizes work time (worklog) per user, letting teams analyze hour distribution, navigate between detail levels (drill-down), and export charts.

## Key features

- **Dynamic filters:** last `n days`, `users`, and `additional JQL`, configurable via `Edit`.
- **Grouping:** interactive chart with multiple drill-down/back levels, export, and tabular view.
- **Interactive navigation:** local stack navigation (drill-down/drill-up) and opening issues in a new tab.

**Where the code lives:** see the [src](src) directory for frontend/backend.

---

## Prerequisites

- **Node.js** — LTS version 22.x or 24.x (22 is the minimum required by the test tooling)  
  Check with `node --version`. If you need to install it, use [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or the official installer at [nodejs.org](https://nodejs.org).
- **Forge CLI** — installed globally:

  ```sh
  npm install -g @forge/cli
  forge --version   # confirms the installation
  ```

- **Atlassian Cloud account** with a development site containing Jira.  
  Create one for free at [go.atlassian.com/cloud-dev](https://go.atlassian.com/cloud-dev) if you don't have one yet.

---

## Forge App Setup

These steps are only needed the **first time** you set up the environment, following the [official Forge getting-started guide](https://developer.atlassian.com/platform/forge/getting-started/).

### 1. Generate an Atlassian API token

1. Go to [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens).
2. Click **Create API token with scopes**.
3. Give it a name (e.g., `forge-api-token`), set the expiry, and select **Forge** as the app.
4. Confirm the recommended scopes and click **Create token**.
5. **Copy** the generated token.

### 2. Authenticate with the Forge CLI

```sh
forge login
# enter your Atlassian account email
# paste the API token when prompted
```

> In CI/CD environments without a keychain, use environment variables:
>
> ```sh
> export FORGE_EMAIL=your-email@company.com
> export FORGE_API_TOKEN=your-token
> ```

### 3. Register the app (new forks/clones only)

If you cloned this repository and want to register a **new** app in your Atlassian ecosystem, run:

```sh
forge register
```

This updates the `app.id` in [manifest.yml](manifest.yml) with the ID of the app created in your account.  
If you are just contributing to the existing app (`a546d3b1-9757-447c-8403-6513899d61cb`), skip this step.

### 4. Install the app on the Jira site

After the first deploy (see the section below), install the app on your site:

```sh
forge install
# select the product: Jira
# enter the site URL (e.g., https://my-site.atlassian.net)
```

---

## Installation

Clone the repository and install the dependencies for all workspaces:

```sh
git clone https://github.com/Tooark/jira-gadget-worklog.git
cd jira-gadget-worklog
npm install
```

---

## Available scripts

Run from the project root:

| Script                | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `npm run build`       | Builds the frontend (Vite), generating `src/frontend/dist` |
| `npm run clean`       | Removes the frontend `dist` directory                      |
| `npm test`            | Runs frontend tests with coverage (CI mode)                |
| `npm run lint`        | ESLint + build + Forge lint                                |
| `npm run lint:fix`    | Lint with auto-fix                                         |
| `npm run lint:tsc`    | TypeScript type-checking without emit                      |
| `npm run lint:forge`  | Validates `manifest.yml` with `forge lint`                 |
| `npm run login`       | Forge CLI authentication                                   |
| `npm run deploy`      | Build + deploy + upgrade on the default env (development)  |
| `npm run deploy-hml`  | Build + deploy + upgrade on the **staging** environment    |
| `npm run deploy-prd`  | Build + deploy + upgrade on the **production** environment |
| `npm run deploy-test` | Build + tests + deploy + upgrade (full pipeline)           |

---

## Deploying per environment

The project maintains three independent Forge environments:

```sh
# development (default)
npm run deploy

# staging
npm run deploy-hml

# production
npm run deploy-prd

# full pipeline: build → tests → deploy → upgrade
npm run deploy-test
```

On the first installation in a new environment, use `forge install` (or `forge install -e staging` / `forge install -e production`) after the deploy to associate the app with the Jira site.

---

## Local development

To develop with hot-reload using the Forge tunnel:

```sh
# in one terminal — starts the tunnel (connects the local backend function to Jira Cloud)
npx forge tunnel

# optional — in another terminal, starts the frontend in watch mode
cd src/frontend
npm start
```

To run only the frontend tests interactively:

```sh
cd src/frontend
npm test        # watch mode
npm run test:ci # CI with coverage
```

---

## Implementation — main components

- **Edit** ([src/frontend/src/edit/Edit.tsx](src/frontend/src/edit/Edit.tsx)): gadget configuration form.
  - Main fields:
    - `days` — number of days (default 7).
    - `color` — chart palette/color (e.g., `color`, `blue`, `gray`, ...).
    - `users` — multi-select of users (fetched via `getUsers` on the backend).
    - `jql` — additional JQL applied before aggregation.
  - Behavior: uses `useForgeInvoke('getUsers')` to populate the selector, keeps `props.formValues`, and calls `props.view.submit(...)` to save/close.

- **View** ([src/frontend/src/view/View.tsx](src/frontend/src/view/View.tsx)): renders the chart using `echarts-for-react`.
  - Fetches data from the backend via `useForgeInvoke('getWorklog', { days, color, query, users })`.
  - Keeps a `path` stack for drill-down (root = []).
  - When clicking a bar/segment:
    - if the node has a `url`, opens the issue with `router.open(url)`;
    - if the node has `children`, pushes the node onto the stack (`setPath([...])`) to go down a level.
  - Dynamic title with the total or the current level's context; custom tooltips with HTML escaping and `value + 'h'` formatting.
  - The chart toolbox includes a `Back` button, `Export Chart`, `View Data` (generates an HTML table), zoom, and chart-type toggle (`line`/`bar`).
  - The chart registers `on('click', ...)`/`off('click')` handlers directly on the object returned by `echarts`.

## How data is formatted

- Each node returned by the backend is a `TreeNode` with at least: `name`, `value`, `color?`, `summary?`, `url?`, `children?`.
- Values are rounded (one decimal place) before display; colors are applied via `itemStyle.color`.

---

## Gadget examples

### Color parameter (palette)

| **Colorful**                                                   | **Blue**                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| <img src="media/gadget-color.svg" alt="Colorful" width="600"/> | <img src="media/gadget-blue.svg" alt="Blue" width="600"/> |

| **Gray**                                                  | **Orange**                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| <img src="media/gadget-gray.svg" alt="Gray" width="600"/> | <img src="media/gadget-orange.svg" alt="Orange" width="600 "/> |

| **Green**                                                   | **Red**                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| <img src="media/gadget-green.svg" alt="Green" width="600"/> | <img src="media/gadget-red.svg" alt="Red" width="600"/> |

### Summary and drill-down views

<img src="media/gadget-total-hover.svg" alt="Summary" width="600"/>
<img src="media/gadget-total-date.svg" alt="Drill-down by date" width="600"/>
<img src="media/gadget-total-user.svg" alt="Drill-down by user" width="600"/>

### Color variations — options available in the `Chart Color` field in `Edit`

| Value    | Description                |
| -------- | -------------------------- |
| `color`  | Colorful (default palette) |
| `blue`   | Blue                       |
| `gray`   | Gray                       |
| `orange` | Orange                     |
| `green`  | Green                      |
| `red`    | Red                        |

### Interactive drill-down

1. The `View` starts at the root level (aggregation by user/project/period).
2. Click a bar/segment with `children` → goes down a level (drill-down).
3. Click a node with a `url` → opens the issue in Jira via `router.open(url)`.
4. Use the **Back** button in the chart toolbox to go up a level (drill-up).

---

## Contributing

- Read the [contribution guide](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md).
- Open an issue to suggest additional filters or UX improvements: [Issues](https://github.com/Tooark/jira-gadget-worklog/issues).
- Pull requests are welcome; keep tests passing and update the documentation when needed.
- Need help? See [SUPPORT.md](SUPPORT.md).

---

## Supporting the project

If this gadget is useful to you or your team, consider supporting its development:

- 💖 **[GitHub Sponsors](https://github.com/sponsors/paulosfjunior)** — recurring or one-time sponsorship through GitHub.
- ☕ **[Ko-fi](https://ko-fi.com/paulosfjunior)** — one-off or recurring tips.

You can also support for free by starring ⭐ the repository and sharing the project.

---

## Third-party licenses

This project includes third-party dependencies redistributed in the frontend bundle. Copies of the licenses are in `LICENSES/`.

- **ECharts** — Apache License 2.0
  - [`LICENSES/echarts-LICENSE.txt`](LICENSES/echarts-LICENSE.txt)
  - [`LICENSES/echarts-NOTICE.txt`](LICENSES/echarts-NOTICE.txt)
  - Official source: <https://echarts.apache.org/en/js/vendors/echarts/LICENSE>

> If you generate a bundle containing ECharts code, include the files above in the distribution. Including the `NOTICE` may be required by section 4(d) of the Apache License 2.0.

## License

Apache License 2.0 — see the [LICENSE](LICENSE) file for the full text.
