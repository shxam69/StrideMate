param(
    [string]$envFile = "C:\StrideMate\.env",
    [string]$backendDir = "C:\StrideMate\backend"
)

Write-Host "============================================="
Write-Host "  StrideMate Local SMTP Test Environment    "
Write-Host "============================================="

if (Test-Path $envFile) {
    Write-Host "Loading environment variables from $envFile..."
    foreach ($line in Get-Content $envFile) {
        $line = $line.Trim()
        if ($line -match "^#" -or $line -eq "") {
            continue
        }
        
        $name, $value = $line -split '=', 2
        if ($name) {
            $name = $name.Trim()
            $value = $value.Trim()
            
            # Remove surrounding quotes if present
            if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") {
                $value = $matches[1]
            }
            
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            
            # Log non-secrets
            $secretKeys = @("MAIL_PASSWORD", "JWT_SECRET", "DATABASE_PASSWORD")
            if ($secretKeys -contains $name) {
                Write-Host "Loaded: $name = ***SECRET***" -ForegroundColor DarkGray
            } else {
                Write-Host "Loaded: $name = $value" -ForegroundColor DarkGray
            }
        }
    }
} else {
    Write-Host "Warning: $envFile not found. Continuing without it." -ForegroundColor Yellow
}

Write-Host "`nOverriding Configuration for Local H2 Test..." -ForegroundColor Cyan

# Force the prod profile to activate SmtpEmailService
[Environment]::SetEnvironmentVariable("SPRING_PROFILES_ACTIVE", "prod", "Process")
Write-Host "Override: SPRING_PROFILES_ACTIVE = prod" -ForegroundColor DarkGray

# Override the production PostgreSQL variables with local H2 variables
[Environment]::SetEnvironmentVariable("JDBC_DATABASE_URL", "jdbc:h2:mem:stridemate;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE", "Process")
Write-Host "Override: JDBC_DATABASE_URL = jdbc:h2:mem:stridemate" -ForegroundColor DarkGray

[Environment]::SetEnvironmentVariable("DATABASE_USERNAME", "sa", "Process")
Write-Host "Override: DATABASE_USERNAME = sa" -ForegroundColor DarkGray

[Environment]::SetEnvironmentVariable("DATABASE_PASSWORD", "", "Process")
Write-Host "Override: DATABASE_PASSWORD = ***SECRET***" -ForegroundColor DarkGray

[Environment]::SetEnvironmentVariable("SPRING_JPA_DATABASE_PLATFORM", "org.hibernate.dialect.H2Dialect", "Process")
Write-Host "Override: SPRING_JPA_DATABASE_PLATFORM = org.hibernate.dialect.H2Dialect" -ForegroundColor DarkGray

Write-Host "`nStarting Spring Boot Backend..." -ForegroundColor Green
Write-Host "============================================="

Set-Location -Path $backendDir
mvn spring-boot:run
