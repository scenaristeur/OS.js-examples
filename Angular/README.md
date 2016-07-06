# OS.js Angular Application Example

There's many ways to do this, but this example is made using a "normal OS.js application"

## Setup

Just add this package your package repository and use normal instructions, then install Angular dependencies in the app:

```
$ cd source
$ npm install
```

## Compile

```
$ cd source
$ npm run tsc
```

## Overview

This app was made using the official tutorial: https://angular.io/docs/ts/latest/quickstart.html

```
app/                  tsc compiler output
source/app            Your Angular application source
source/node_modules   Angluar dependencies
```

## Restrictions

I'm not familiar with Angular, so I have not found a way to make the root component reference a DOM Element so that you can properly run multiple instances of this app.

*So now only one running instance is allowed*, but you can add multiple windows easily that you render different root components into.

**Does anyone know how to do this?**
