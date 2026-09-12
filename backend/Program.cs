using System.Security.Claims;
using System.Text;
using api.Caching;
using api.Data;
using api.Diagnostics;
using api.Interfaces;
using api.Models;
using api.Repository;
using api.Service;
using api.Validation;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    // The levels below are the defaults; ReadFrom.Configuration lets the
    // `Serilog` section in appsettings/environment override them, so the log
    // volume can be turned up on a deployment without a code change. Before
    // this call that section was read by nothing at all. The sinks stay in
    // code on purpose -- a typo in configuration should not be able to leave
    // production writing its logs nowhere.
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console()
    .WriteTo.File("Logs/dolfin-log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// The origins the deployed frontends are actually served from. These stay in
// code because getting CORS wrong locks every browser out of the API, and an
// environment variable that is missing or mistyped must not be able to cause
// that.
string[] defaultCorsOrigins =
[
    "https://www.dol-fin.com",
    "https://dol-fin.com",
    "https://ensaraslannn.github.io",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://localhost:7109",
    "http://localhost:5002",
];

// Anything a particular deployment needs on top -- a preview URL, a new
// domain -- arrives as `AllowedOrigins`, a comma- or semicolon-separated
// list. It adds to the defaults rather than replacing them. The setting was
// documented in .env.example and set in appsettings.json long before anything
// read it, so setting it used to do nothing at all.
var corsOrigins = defaultCorsOrigins
    .Concat(
        (builder.Configuration["AllowedOrigins"] ?? string.Empty).Split(
            [',', ';'],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
        )
    )
    // A trailing slash makes an origin match nothing -- the browser never
    // sends one in the Origin header.
    .Select(origin => origin.TrimEnd('/'))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "DolfinCorsPolicy",
        policy =>
        {
            policy
                .WithOrigins(corsOrigins)
                .WithMethods("GET", "POST", "PUT", "DELETE")
                .WithHeaders("Content-Type", "X-CSRF-TOKEN")
                .AllowCredentials();
        }
    );
});


builder
    .Services.AddControllers(options =>
    {
        options.Filters.Add<ValidationActionFilter>();
    })
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft
            .Json
            .ReferenceLoopHandling
            .Ignore;
        options.SerializerSettings.Converters.Add(
            new Newtonsoft.Json.Converters.StringEnumConverter()
        );
    });

builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer(
        (document, _, _) =>
        {
            document.Info = new Microsoft.OpenApi.OpenApiInfo
            {
                Title = "DOLFIN API",
                Version = "v1",
                Description =
                    "Portfolio management API: stock catalog, user portfolios, trading, price alerts, and portfolio analytics.",
            };
            document.Servers =
            [
                new Microsoft.OpenApi.OpenApiServer
                {
                    Url = "https://api-production-a1b64.up.railway.app",
                    Description = "Production (Railway)",
                },
                new Microsoft.OpenApi.OpenApiServer
                {
                    Url = "http://localhost:5002",
                    Description = "Local development",
                },
            ];
            return Task.CompletedTask;
        }
    );
});

void ConfigureCommon(DbContextOptionsBuilder options)
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.ConfigureWarnings(warnings =>
        warnings.Ignore(
            Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning
        )
    );
}

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddSingleton<NPlusOneDetectionInterceptor>();
    builder.Services.AddDbContext<ApplicationDBContext>(
        (sp, options) =>
        {
            ConfigureCommon(options);
            options.AddInterceptors(sp.GetRequiredService<NPlusOneDetectionInterceptor>());
        }
    );
}
else
{
    builder.Services.AddDbContext<ApplicationDBContext>(ConfigureCommon);
}

var redisConnectionString = builder.Configuration.GetConnectionString("Redis");

StackExchange.Redis.ConfigurationOptions? BuildRedisConfigurationOptions()
{
    if (string.IsNullOrWhiteSpace(redisConnectionString))
        return null;

    var configurationOptions = StackExchange.Redis.ConfigurationOptions.Parse(redisConnectionString);
    configurationOptions.ConnectTimeout = 1000;
    configurationOptions.ConnectRetry = 1;
    configurationOptions.SyncTimeout = 1000;
    configurationOptions.AsyncTimeout = 1000;
    configurationOptions.AbortOnConnectFail = false;
    configurationOptions.AllowAdmin = true;
    return configurationOptions;
}

builder.Services.AddStackExchangeRedisCache(options =>
{
    var configurationOptions = BuildRedisConfigurationOptions();
    if (configurationOptions != null)
    {
        options.ConfigurationOptions = configurationOptions;
    }
    options.InstanceName = "dolfin:";
});

if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(_ =>
        StackExchange.Redis.ConnectionMultiplexer.Connect(BuildRedisConfigurationOptions()!)
    );
}

builder.Services.AddHybridCache(options =>
{
    options.DefaultEntryOptions = new Microsoft.Extensions.Caching.Hybrid.HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(5),
        LocalCacheExpiration = TimeSpan.FromSeconds(30),
    };
});

var healthChecksBuilder = builder
    .Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is missing in configuration!"),
        name: "postgres"
    );

if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    healthChecksBuilder.AddRedis(
        redisConnectionString,
        name: "redis",
        failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded
    );
}

var jwtSigningKeyBytes = Encoding.UTF8.GetBytes(
    builder.Configuration["JWT:SigningKey"]
        ?? throw new InvalidOperationException("JWT SigningKey is missing in configuration!")
);

if (jwtSigningKeyBytes.Length < 64)
{
    throw new InvalidOperationException(
        "JWT SigningKey must be at least 64 bytes (512 bits) long for HS512."
    );
}

builder
    .Services.AddIdentity<AppUser, IdentityRole>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequiredLength = 12;

        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<ApplicationDBContext>();

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            options.DefaultChallengeScheme =
            options.DefaultForbidScheme =
            options.DefaultScheme =
            options.DefaultSignInScheme =
            options.DefaultSignOutScheme =
                JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JWT:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(jwtSigningKeyBytes),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrEmpty(context.Token) &&
                    context.Request.Cookies.TryGetValue("access_token", out var cookieToken))
                {
                    context.Token = cookieToken;
                }
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var stampClaim = context.Principal?.FindFirst("SecurityStamp")?.Value;
                var userId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(stampClaim) || string.IsNullOrEmpty(userId))
                {
                    context.Fail("Token is missing required security stamp claims.");
                    return;
                }

                var userManager = context.HttpContext.RequestServices
                    .GetRequiredService<UserManager<AppUser>>();
                var user = await userManager.FindByIdAsync(userId);
                var currentStamp = user == null ? null : await userManager.GetSecurityStampAsync(user);

                if (user == null || currentStamp != stampClaim)
                {
                    context.Fail("Token has been revoked.");
                }
            }
        };
    });

builder.Services.AddSingleton<ICacheMetrics, CacheMetrics>();

builder.Services.AddScoped<StockRepository>();
builder.Services.AddScoped<CachedStockRepository>();
builder.Services.AddScoped<IStockRepository>(sp => sp.GetRequiredService<CachedStockRepository>());
builder.Services.AddScoped<IStockCacheInvalidator>(sp =>
    sp.GetRequiredService<CachedStockRepository>()
);
builder.Services.AddScoped<CommentRepository>();
builder.Services.AddScoped<CachedCommentRepository>();
builder.Services.AddScoped<ICommentRepository>(sp => sp.GetRequiredService<CachedCommentRepository>());
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPortfolioRepository, PortfolioRepository>();
builder.Services.AddScoped<IPortfolioService, PortfolioService>();
builder.Services.AddScoped<IPortfolioAnalyticsService, PortfolioAnalyticsService>();
builder.Services.AddScoped<IRebalancingService, RebalancingService>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IPriceAlertRepository, PriceAlertRepository>();
builder.Services.AddScoped<IPriceAlertService, PriceAlertService>();
builder.Services.AddSingleton(PriceAlertOptions.FromConfiguration(builder.Configuration));
builder.Services.AddSingleton(PriceSimulationOptions.FromConfiguration(builder.Configuration));
builder.Services.AddScoped<IPriceSimulationService, PriceSimulationService>();
builder.Services.AddHostedService<PriceAlertBackgroundService>();
builder.Services.AddHostedService<PriceSimulationBackgroundService>();
builder.Services.AddScoped<ICacheWarmingService, CacheWarmingService>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddDataProtection().PersistKeysToDbContext<ApplicationDBContext>();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
    options.ForwardLimit = 2;
});

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "af-token";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    var authRateLimitPermits = builder.Configuration.GetValue<int?>("RateLimiting:AuthPermitLimit") ?? 10;
    var authRateLimitWindow = TimeSpan.FromSeconds(
        builder.Configuration.GetValue<int?>("RateLimiting:AuthWindowSeconds") ?? 60
    );
    options.AddPolicy(
        "auth",
        httpContext =>
            System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                {
                    PermitLimit = authRateLimitPermits,
                    Window = authRateLimitWindow,
                    QueueLimit = 0,
                }
            )
    );
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
    db.Database.Migrate();

    await StockSeeder.SeedAsync(db);

    var adminUsername = app.Configuration["Admin:SeedUsername"];
    if (!string.IsNullOrWhiteSpace(adminUsername))
    {
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var existingAdmins = await userManager.GetUsersInRoleAsync("Admin");
        if (existingAdmins.Count == 0)
        {
            var adminUser = await userManager.FindByNameAsync(adminUsername);
            if (adminUser != null)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }

    var cacheWarmingService = scope.ServiceProvider.GetRequiredService<ICacheWarmingService>();
    await cacheWarmingService.WarmAsync();
}

app.UseForwardedHeaders();

// First in the pipeline so the headers reach every response, including the
// ones that never get as far as a controller. UseForwardedHeaders runs ahead
// of it only because HSTS below needs to know whether the original request
// was HTTPS.
app.UseMiddleware<api.Middleware.SecurityHeadersMiddleware>();

// Strict-Transport-Security, at the framework default of 30 days with no
// preload and no includeSubDomains -- long enough to be worth having, short
// enough to back out of. It is skipped outside production because a developer
// on http://localhost would otherwise be pinned to HTTPS by their browser for
// a month. UseHsts emits nothing for a plain-HTTP request either way, which is
// why the forwarded-headers step above has to come first: behind Railway's
// proxy, TLS is terminated before the request reaches us and X-Forwarded-Proto
// is the only evidence it was ever HTTPS.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseSerilogRequestLogging();

app.UseMiddleware<api.Middleware.ExceptionMiddleware>();

app.UseRouting();
app.UseCors("DolfinCorsPolicy");
app.UseRateLimiter();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.Use(
    async (context, next) =>
    {
        var method = context.Request.Method;
        var isMutatingRequest =
            !HttpMethods.IsGet(method)
            && !HttpMethods.IsHead(method)
            && !HttpMethods.IsOptions(method)
            && !HttpMethods.IsTrace(method);

        if (context.User.Identity?.IsAuthenticated == true && isMutatingRequest)
        {
            var antiforgery = context.RequestServices.GetRequiredService<Microsoft.AspNetCore.Antiforgery.IAntiforgery>();
            try
            {
                await antiforgery.ValidateRequestAsync(context);
            }
            catch (Microsoft.AspNetCore.Antiforgery.AntiforgeryValidationException ex)
            {
                Log.Warning(ex, "CSRF validation failed for {Method} {Path}", method, context.Request.Path);
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("CSRF token missing or invalid.");
                return;
            }
        }

        await next();
    }
);

app.MapHealthChecks("/health");

app.MapOpenApi("/openapi.json");

app.MapControllers();

app.MapScalarApiReference(options =>
{
    options
        .WithTitle("DOLFIN API")
        .WithTheme(ScalarTheme.DeepSpace)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);

    options.OpenApiRoutePattern = "/openapi.json";
});

try
{
    Log.Information("API started successfully...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "API error");
}
finally
{
    Log.CloseAndFlush();
}