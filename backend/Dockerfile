# ==============================================================================
# Work Tracker Pro - Backend Dockerfile (.NET 8 Web API)
# ==============================================================================

# Stage 1: Base Runtime Environment
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000 \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    TZ=Asia/Jakarta

# Install ICU and curl for proper globalization and health checks
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tzdata libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: SDK Build Environment
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project definition files first for optimal Docker layer caching
COPY ["WorkTracker.Api/WorkTracker.Api.csproj", "WorkTracker.Api/"]
COPY ["WorkTracker.Infrastructure/WorkTracker.Infrastructure.csproj", "WorkTracker.Infrastructure/"]
COPY ["WorkTracker.Core/WorkTracker.Core.csproj", "WorkTracker.Core/"]

# Restore NuGet dependencies
RUN dotnet restore "WorkTracker.Api/WorkTracker.Api.csproj"

# Copy entire source code and build in Release configuration
COPY . .
WORKDIR "/src/WorkTracker.Api"
RUN dotnet build "WorkTracker.Api.csproj" -c Release -o /app/build

# Stage 3: Publish Release Binaries
FROM build AS publish
RUN dotnet publish "WorkTracker.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 4: Production Final Image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create persistent storage directories with proper permissions
RUN mkdir -p /app/uploads/notes /app/uploads/avatars /app/uploads/covers \
             /app/wwwroot/uploads/notes /app/wwwroot/uploads/avatars /app/wwwroot/uploads/covers \
             /app/logs \
    && chmod -R 777 /app/uploads /app/wwwroot /app/logs

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dotnet", "WorkTracker.Api.dll"]
