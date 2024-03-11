 
# AI Chat Application

This project provides a streamlined setup process for a Nuxt.js application that seamlessly integrates with the Stella framework. It offers a convenient environment for building interactive chat applications or leveraging Stella's features within your Nuxt projects.

## Demo

https://github.com/aminhaghi86/stella-app/assets/90243818/15fdc551-822e-440f-8ab2-cee6ae022b16


## Installation
* Clone the Repository

* Install dependency of this project run

```bash
  npm install
```

* Stella Configuration
#### Setup STELLA (simple tutorial in documentation) : https://docs.stellaframework.com/Getting_Started.html)

### Nuxt.js Configuration

1. Create .env File:
At the root of your project, create a file named .env. This file will store environment variables for your Nuxt.js application.





```javascript
BASE_URL="http://localhost:5001"  # Replace with your backend URL
SOCKET_HOST="localhost"
SOCKET_PORT="5001"
SOCKET_SSL="false"
SOCKET_NAMESPACE="/chat"
```


## Update nuxt.config.ts:
Open nuxt.config.ts and add the following code block:

```javascript
export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      SOCKET_HOST: process.env.SOCKET_HOST,
      SOCKET_PORT: process.env.SOCKET_PORT,
      SOCKET_SSL: process.env.SOCKET_SSL,
      SOCKET_NAMESPACE: process.env.SOCKET_NAMESPACE,
      DEFAULT_WORKSPACE_ID: process.env.DEFAULT_WORKSPACE_ID, // Add this line if needed
    },
    private: {
      // Define private variables here (not exposed on client-side)
    },
  },
});
```

## Development

## Client :
 #### Execute the following command
```javascript 
npm run dev
```

## Run Stella on terminal
```javascript 
 stella
```
## USE Stella CLI on terminal
```javascript 
  stella serve
```

# Enjoy your chat!
