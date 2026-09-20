# HTTP Cookbook — An HTTP & REST Learning Game

Exercise 3, Web Development course.

A browser game that teaches client–server communication over HTTP. Each stage
describes an action in a web system, and the player has to assemble the matching
HTTP request — method, path, query parameters, request body — and send it.

The requests are not simulated: every attempt is sent to the project's own
Express API, and the player sees the real status code and the real JSON returned.

---

## Requirements

- [Node.js](https://nodejs.org/) 18 or later (the server uses the built-in `fetch`)
- npm

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Then open **http://localhost:3000**

Stop the server with `Ctrl + C`. To use another port: `PORT=4000 npm start`

---

## Pages

| Page | Address |
|------|---------|
| Game | `http://localhost:3000/` |
| Schemas / API reference | `http://localhost:3000/schemas` |

The schemas page documents both resources — fields, data types, query parameters
and endpoints. Players need it to build the requests, so it is worth keeping open
in a second tab.

---

## How to play

1. Read the scenario on the stage card.
2. Choose a method and type the request path.
3. Add query parameters or a JSON body if the stage needs them.
4. Press **Send request**.

A correct request unlocks the next stage; a wrong one explains which part does
not match so it can be edited and sent again. Solved stages can be revisited with
**Previous**.

Each stage is worth 10 points, minus 2 per wrong attempt, with a floor of 4.
A perfect run is 100 points across the 10 stages.

---

## The game

| # | Stage | Concepts |
|---|-------|----------|
| 1 | List all recipes | `GET` |
| 2 | Show a single recipe | `GET`, route parameter |
| 3 | Filter recipes by cuisine | `GET`, query parameter |
| 4 | A recipe that does not exist | `GET`, status codes, error handling |
| 5 | Ingredients of a recipe | `GET`, route parameter, query parameter, relationship |
| 6 | Quick Italian recipes, best first | `GET`, three query parameters, filtering, sorting |
| 7 | Add a new recipe | `POST`, request body |
| 8 | Replace a recipe | `PUT`, route parameter, request body |
| 9 | Add an ingredient to a recipe | `POST`, route parameter, request body, relationship |
| 10 | Remove a recipe | `DELETE`, route parameter |

The correct answers are defined on the server only and are never sent to the
browser.
