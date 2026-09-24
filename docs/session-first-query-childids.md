# Session first query with `childIds`

**Question:** for the session app, if the client wants to provide `childIds` for the session routes on the first query (`executedQueries` is null or an empty map), what does the client send?

## Answer

The client has to send **`queries` already filled in**. Session is not a PNC app, and first-load defaults never add `childIds`.

If `queries` is null or `{}`, gateway builds all four session routes with only `isPrivateView`, `take`, and `skip`. Empty `counts` then returns that default map unchanged. `search` (including `?tutorials=101` or `?tutorials=101&courses=102`) does not contribute IDs.

So “first query” here means **`counts` empty and `searchedRoutes` omitted**, not an empty `queries` map.

Use `POST /api/records/authenticated-app`. Session is webapp **7**.

Count queries can be omitted. If `queries` has only `*records` keys, gateway builds a records-only GraphQL query. The response `counts` map will be empty.

## Example

One `childId` per session route, count queries omitted:

```json
{
  "convolution": "session",
  "formatter": "session",
  "search": null,
  "searchedRoutes": null,
  "counts": {},
  "requestTake": 1,
  "isPrivate": false,
  "mailer": 1,
  "curToken": "<token>",
  "mutateRole": "<role>",
  "state": { "webapp": 7 },
  "queries": {
    "dashboardsinstructionsrecords": {
      "isPrivateView": false,
      "take": 1,
      "skip": 0,
      "childIds": [101]
    },
    "instructionsfiltersrecords": {
      "isPrivateView": false,
      "take": 1,
      "skip": 0,
      "childIds": [201]
    },
    "instructionssiftersrecords": {
      "isPrivateView": false,
      "take": 1,
      "skip": 0,
      "childIds": [301]
    },
    "instructionsdashboardsrecords": {
      "isPrivateView": false,
      "take": 1,
      "skip": 0,
      "childIds": [401]
    }
  }
}
```

## Route keys

Keys are lowercase concatenations (`name` + connection + `records`):

| Route | What it fetches |
|---|---|
| `dashboardsinstructionsrecords` | parent sessions |
| `instructionsfiltersrecords` | session items (tutorial) |
| `instructionssiftersrecords` | session items (course) |
| `instructionsdashboardsrecords` | session items (quiz) |

A non-empty `queries` map is used **as-is**. Missing keys are not filled in, so omit a route only if you do not want it fetched. Child-only is valid: leave off `dashboardsinstructionsrecords`, and gateway synthesizes parent session rows from `metadata.instructionId`.

Do not set `searchedRoutes`. That path builds count-only payloads and drops `childIds`. Keep `counts` empty so paging does not treat this as a later page and return `{}`.
