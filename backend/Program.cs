using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QCScheduler.Api.Data;
using QCScheduler.Api.Hubs;
using QCScheduler.Api.Services;
using System.Text;
using System.Threading.Tasks;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// 1. Add DB Contexts
builder.Services.AddDbContext<QCSchedulerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("QCSchedulerConnection")));

builder.Services.AddDbContext<EpicorDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("EpicorConnection")));

// 2. Add SignalR
builder.Services.AddSignalR();

// 3. Add Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// 4. Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(
                  "http://localhost:5173",
                  "http://127.0.0.1:5173",
                  "https://kanban.datalazo.net"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

// 5. Configure JWT Authentication
var jwtSecret = "QC_SCHEDULER_SECRET_KEY_VERY_LONG_SAFE_1234567890!";
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = "QCSchedulerApi",
        ValidateAudience = true,
        ValidAudience = "QCSchedulerClients",
        ValidateLifetime = true
    };

    // Allow JWT authentication token to be sent in the query string for SignalR hub connections
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/qchub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// 6. Register Background Worker Service
builder.Services.AddHostedService<SyncWorker>();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<QCHub>("/qchub");

app.Run();
