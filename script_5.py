# Create deployment configurations for various platforms

# Heroku Procfile
procfile = "web: node server.js"

# Railway configuration
railway_config = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
        "builder": "NIXPACKS"
    },
    "deploy": {
        "startCommand": "npm start",
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
    }
}

# Render configuration
render_config = {
    "services": [
        {
            "type": "web",
            "name": "insightsx-backend",
            "env": "node",
            "plan": "free",
            "buildCommand": "npm install",
            "startCommand": "npm start",
            "healthCheckPath": "/health",
            "envVars": [
                {"key": "NODE_ENV", "value": "production"},
                {"key": "DB_NAME", "sync": False},
                {"key": "DB_USER", "sync": False},
                {"key": "DB_PASS", "sync": False},
                {"key": "DB_HOST", "sync": False},
                {"key": "DB_PORT", "sync": False},
                {"key": "JWT_SECRET", "sync": False},
                {"key": "SHOPIFY_API_KEY", "sync": False},
                {"key": "SHOPIFY_API_SECRET", "sync": False}
            ]
        }
    ]
}

# Docker configuration
dockerfile = """
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Build client if exists
RUN if [ -d "client" ]; then cd client && npm ci && npm run build; fi

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
USER nextjs

EXPOSE 3001

CMD ["npm", "start"]
"""

# Vercel configuration
vercel_config = {
    "version": 2,
    "builds": [
        {"src": "server.js", "use": "@vercel/node"},
        {"src": "client/package.json", "use": "@vercel/static-build", "config": {"distDir": "build"}}
    ],
    "routes": [
        {"src": "/api/(.*)", "dest": "/server.js"},
        {"src": "/(.*)", "dest": "/client/$1"}
    ],
    "env": {
        "NODE_ENV": "production"
    }
}

# Save all deployment configs
with open('Procfile', 'w') as f:
    f.write(procfile)

import json
with open('railway.json', 'w') as f:
    json.dump(railway_config, f, indent=2)

with open('render.yaml', 'w') as f:
    json.dump(render_config, f, indent=2)

with open('Dockerfile', 'w') as f:
    f.write(dockerfile)

with open('vercel.json', 'w') as f:
    json.dump(vercel_config, f, indent=2)

print("Created deployment configurations for:")
print("- Heroku (Procfile)")
print("- Railway (railway.json)")
print("- Render (render.yaml)")
print("- Docker (Dockerfile)")
print("- Vercel (vercel.json)")