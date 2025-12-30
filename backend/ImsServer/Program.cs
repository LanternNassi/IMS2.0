using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using AutoMapper;
using Microsoft.Extensions.Hosting;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// Add Windows Service support
builder.Host.UseWindowsService();

builder.Configuration
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

var connectionString = builder.Configuration.GetConnectionString("DBCONNECTION");
Console.WriteLine($"Database Connection String: {connectionString}");
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");
Console.WriteLine($"AppSettings.json path: {Path.Combine(Directory.GetCurrentDirectory(), "appsettings.json")}");

builder.Services.AddDbContext<DBContext>(options =>
      options.UseSqlServer(connectionString));

// Add CORS policy in services
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow any origin
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var mapperConfig = new MapperConfiguration(mc =>
{
    mc.AddProfile(new MappingProfile());
});

IMapper mapper = mapperConfig.CreateMapper();
builder.Services.AddSingleton(mapper);

var app = builder.Build();

// Apply migrations automatically on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<DBContext>();
        
        Console.WriteLine("Checking database connection...");
        
        // Apply any pending migrations
        context.Database.Migrate();
        
        Console.WriteLine("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred while migrating the database: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        
        // Optionally: You can decide whether to exit or continue
        // Environment.Exit(1); // Uncomment to exit on migration failure
    }
}

app.UseDeveloperExceptionPage();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Apply CORS policy - MUST be after UseHttpsRedirection and before UseAuthorization
app.UseCors();

app.UseAuthorization();

app.MapControllers();

// Run as Windows Service or console app
if (args.Contains("--install-service"))
{
    // Installation will be handled by external script
    Console.WriteLine("Service installation should be done via install-service.bat");
    return;
}

app.Run();