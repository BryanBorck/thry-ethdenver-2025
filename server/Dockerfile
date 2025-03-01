# ---- Base Stage: Set up Node and update Corepack ----
  FROM node:23.0.0-alpine AS base
  ENV PNPM_HOME="/pnpm"
  ENV PATH="$PNPM_HOME:$PATH"
  # Update Corepack to the latest version to avoid signature errors, then enable it
  RUN npm install -g corepack@latest && corepack enable
  
  # ---- Stage 1: Build the TypeScript code ----
  FROM base AS build
  WORKDIR /usr/src/app
  
  # Copy package files for caching
  COPY package*.json ./
  
  # Install all dependencies (including devDependencies, so tsc is available)
  RUN pnpm install
  
  # Copy configuration and source code
  COPY tsconfig.json .
  COPY src ./src
  
  # Build the app (transpile TypeScript to JavaScript)
  RUN pnpm run build
  
  # ---- Stage 2: Create a minimal production image ----
  FROM base AS prod
  WORKDIR /usr/src/app
  
  # Copy package files and install production dependencies only
  COPY --from=build /usr/src/app/package*.json ./
  RUN pnpm install --only=production
  
  # Copy the compiled JavaScript code from the build stage
  COPY --from=build /usr/src/app/dist ./dist
  
  # Expose the port (here 5001 as in your npm example)
  EXPOSE 5001
  
  # Run the server using pnpm
  CMD ["pnpm", "start"]