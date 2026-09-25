# Base runtime image for ASP.NET Core 8.0
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

# SDK build image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files first for efficient Docker layer caching
COPY ["WorkTracker.Api/WorkTracker.Api.csproj", "WorkTracker.Api/"]
COPY ["WorkTracker.Infrastructure/WorkTracker.Infrastructure.csproj", "WorkTracker.Infrastructure/"]
COPY ["WorkTracker.Core/WorkTracker.Core.csproj", "WorkTracker.Core/"]

RUN dotnet restore "WorkTracker.Api/WorkTracker.Api.csproj"

# Copy the remaining source files and compile
COPY . .
WORKDIR "/src/WorkTracker.Api"
RUN dotnet build "WorkTracker.Api.csproj" -c Release -o /app/build

# Publish release binaries
FROM build AS publish
RUN dotnet publish "WorkTracker.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final production runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Ensure uploads directory exists for persistent volume mounting
RUN mkdir -p /app/uploads

ENTRYPOINT ["dotnet", "WorkTracker.Api.dll"]
