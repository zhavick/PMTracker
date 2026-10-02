# ==============================================================================
# Work Tracker Pro - Root Multi-Stage Dockerfile
# Builds both Frontend and Backend directly from the repository root.
# Targets available:
#   - backend: ASP.NET Core 8 Web API
#   - frontend: Nginx + React 18 SPA
# ==============================================================================

# ------------------------------------------------------------------------------
# Target: backend
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS backend-base
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000 \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    TZ=Asia/Jakarta

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tzdata libicu-dev \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src
COPY ["backend/WorkTracker.Api/WorkTracker.Api.csproj", "WorkTracker.Api/"]
COPY ["backend/WorkTracker.Infrastructure/WorkTracker.Infrastructure.csproj", "WorkTracker.Infrastructure/"]
COPY ["backend/WorkTracker.Core/WorkTracker.Core.csproj", "WorkTracker.Core/"]
RUN dotnet restore "WorkTracker.Api/WorkTracker.Api.csproj"

COPY backend/ .
WORKDIR "/src/WorkTracker.Api"
RUN dotnet build "WorkTracker.Api.csproj" -c Release -o /app/build

FROM backend-build AS backend-publish
RUN dotnet publish "WorkTracker.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM backend-base AS backend
WORKDIR /app
COPY --from=backend-publish /app/publish .
RUN mkdir -p /app/uploads /app/logs && chmod -R 777 /app/uploads /app/logs
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1
ENTRYPOINT ["dotnet", "WorkTracker.Api.dll"]

# ------------------------------------------------------------------------------
# Target: frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --prefer-offline --no-audit; else npm install --no-audit; fi
COPY frontend/ .
RUN npm run build

FROM nginx:alpine AS frontend
RUN rm -rf /usr/share/nginx/html/*
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]

# Default target
FROM backend AS default
