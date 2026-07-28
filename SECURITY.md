# Security Policy

## Reporting a vulnerability

The Worklog Chart Gadget maintainers take security seriously. This is an
Atlassian Forge app that reads Jira worklog and user data (`read:jira-work`,
`read:jira-user` scopes), so we treat any unsafe handling of that data as a
security issue. If you believe you have found a vulnerability, please report it
**privately** so we can address it before public disclosure.

### How to report

**Do NOT** open a public GitHub issue for security vulnerabilities.

Instead, use one of the following channels:

1. **Preferred** — GitHub Security Advisories:
   [Report a vulnerability](https://github.com/Tooark/jira-gadget-worklog/security/advisories/new)
2. **Email** — `security@tooark.com` (PGP key available on request)

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce (proof of concept if possible)
- The app version and Forge environment (development, staging, production)
- Your Jira site type and browser, if relevant
- Your name / handle for credit (optional)

### What to expect

| Milestone                            | Target time                                             |
| ------------------------------------ | ------------------------------------------------------- |
| Acknowledgment of report             | Within **72 hours**                                     |
| Initial triage & severity assessment | Within **5 business days**                              |
| Fix and coordinated disclosure plan  | Within **30 days** (may be extended for complex issues) |
| Public advisory (if applicable)      | After a fixed release is deployed                       |

We follow the principles of
[Coordinated Vulnerability Disclosure (CVD)](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure).

## Supported versions

The gadget is deployed continuously from `main`. Only the **latest deployed
version** receives security fixes.

| Version                 | Supported |
| ----------------------- | --------- |
| Latest release (`main`) | ✅        |
| Older versions / forks  | ❌        |

## Scope

In scope:

- Vulnerabilities in the gadget code (frontend `Edit`/`View` and the backend
  resolver)
- Unsafe construction of JQL queries or Jira REST requests (e.g. injection
  through the `jql` configuration field)
- Leaking worklog or user data beyond what the configured gadget should show
- Cross-site scripting through chart tooltips, labels, or exported data
- Supply-chain issues in this project's declared dependencies

Out of scope:

- Vulnerabilities in Jira, Atlassian Cloud, or the Forge platform itself
  (report to [Atlassian](https://www.atlassian.com/trust/security/report-a-vulnerability))
- Vulnerabilities in other Forge apps installed alongside this gadget
- Issues that require Jira admin or site-level permissions the attacker
  already holds
- Social engineering, physical attacks, and denial of service

## Safe harbor

We support security research conducted in good faith. If you follow this policy,
we will:

- Not pursue legal action against you
- Work with you to understand and resolve the issue
- Publicly credit you (if you wish) in the security advisory

## Bounties

This is an open-source project maintained by volunteers. **No monetary bounty
program is currently offered**, but we deeply appreciate responsible disclosure
and will credit reporters publicly.
