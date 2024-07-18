# Akinator Unofficial Node API

> Node.js client for the unofficial [Akinator game](https://akinator.com), an awesome genie that's able to guess any character in your mind!

## Intro

This package was inspired by many akinator packages, including the python one, but the javascript versions were not good enough in my opinion or were not working.

**This project is not affiiliated with Akinator in any way! It is a community project**

If you like this project, please check out [Akinator](https://akinator.com)!

## Features

* 👌 No dependencies (only `node-fetch`)
* ✅ Written in TypeScript and strongly typed
* 🧸 Very easy to use
* ⌚ Asynchronous requests
* 🔁 Active development

## Installation

```bash
npm install node_akinator
```

## Usage

### Importing the package

Typescript:
```typescript
import { AkinatorClient, Languages, Themes, Answers } from 'node_akinator';
```

Javascript:
```javascript
const { AkinatorClient, Languages, Themes, Answers } = require("node_akinator");
```

### Example

Basic automated usage:
```typescript
// create the client
const akinator = new AkinatorClient(Languages.English, true, Themes.Character);

// go into async
(async() => {
    // start the game
    const start = await akinator.start();
    console.log(start.question);

    // let it run automatically until akinator won
    while (!akinator.won) {
        // answer yes all the time
        const answer = await akinator.answer(Answers.Yes);
        console.log(`(${answer.step}/100) ${answer.question}`);

        // wanna go back?
        // await akinator.back();
    }

    // win result and extra information
    console.log(akinator.winResult.name);

    // not satisfied? you can always continue. 
    // use (akinator.ko) to know if he lost.
    const answer = await akinator.continue();
    console.log(`(${answer.step}/100) ${answer.question}`);

    // OR maybe you're satisfied, 
    // then tell akinator.
    await akinator.submitWin();
})();
```

## Disclaimer
##### ❤️ This project is updated frequently, **always check for the latest version for new features or bug fixes**.

🚀 If you have an issue or idea, let me know in the [**Issues**](https://github.com/realcoloride/node_akinator/issues) section.

📜 If you use this API, you also bound to the terms of usage of their website.

☕ **Want to support me?** You can send me a coffee on ko.fi: https://ko-fi.com/coloride. 

*(real)coloride - 2024, Licensed MIT.*