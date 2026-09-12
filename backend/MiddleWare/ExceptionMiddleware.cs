using System.Net;
using System.Text.Json;
using api.Models;
using api.Validation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace api.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (FluentValidation.ValidationException validationException)
            {
                await HandleValidationExceptionAsync(httpContext, validationException);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error: {Message}", ex.Message);
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private static async Task HandleValidationExceptionAsync(
            HttpContext context,
            FluentValidation.ValidationException exception
        )
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

            var problemDetails = ValidationProblemFactory.Create(exception.Errors);

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var message = _env.IsDevelopment()
                ? exception.Message
                : "An internal server error occurred.";

            var response = new ExceptionResponse
            {
                StatusCode = context.Response.StatusCode,
                Title = "Internal Server Error",
                Message = message,
                // Carried so a client can say "something went wrong" in its own
                // language rather than print whichever English sentence landed
                // here -- the message itself is a stack-trace-shaped detail in
                // development and a fixed string in production.
                Code = ErrorCodes.Unexpected,
            };

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            };
            var json = JsonSerializer.Serialize(response, options);

            await context.Response.WriteAsync(json);
        }
    }
}