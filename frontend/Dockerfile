# ==============================================================================
# Work Tracker Pro - Frontend Dockerfile (Vite + React 18 + Nginx)
# ==============================================================================

# Stage 1: Build React SPA with Node.js
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install npm dependencies
RUN if [ -f package-lock.json ]; then npm ci --prefer-offline --no-audit; else npm install --no-audit; fi

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Production serving stage with lightweight Nginx Alpine
FROM nginx:alpine AS final

# Remove default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy custom reverse proxy & SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck to verify Nginx is actively responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
