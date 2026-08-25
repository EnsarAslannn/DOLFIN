using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using api.Data;
using api.Dtos.Alerts;
using api.Dtos.Stock;
using api.IntegrationTests.TestHelpers;
using api.Interfaces;
using api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api.IntegrationTests
{
    [Collection("Integration")]
    public class PriceAlertEndpointsTests
    {
        private readonly DolfinApiFactory _factory;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() },
        };

        public PriceAlertEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private async Task<StockDto> CreateStockAsAdminAsync(decimal purchasePrice)
        {
            var symbol = $"T{Guid.NewGuid():N}"[..7].ToUpperInvariant();
            var adminClient = await AuthHelper.CreateAuthenticatedClientAsync(_factory, asAdmin: true);

            var response = await adminClient.PostAsJsonAsync(
                "/api/stock",
                new CreateStockRequestDto
                {
                    Symbol = symbol,
                    CompanyName = "Alert Test Corp",
                    Purchase = purchasePrice,
                    LastDiv = 0.10m,
                    Industry = "Software",
                    MarketCap = 1_000_000_000,
                }
            );

            var stock = await response.Content.ReadFromJsonAsync<StockDto>();
            return stock!;
        }

        [Fact]
        public async Task CreateAlert_ValidRequest_ReturnsCreatedWithAlertDetails()
        {
            var stock = await CreateStockAsAdminAsync(150m);
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.PostAsJsonAsync(
                "/api/alerts",
                new CreatePriceAlertRequestDto
                {
                    StockId = stock.Id,
                    TargetPrice = 200m,
                    Condition = PriceAlertCondition.GreaterThanOrEqual,
                }
            );

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var created = await response.Content.ReadFromJsonAsync<PriceAlertDto>(JsonOptions);
            Assert.Equal(stock.Id, created!.StockId);
            Assert.Equal(200m, created.TargetPrice);
        }

        [Fact]
        public async Task CreateAlert_NonExistentStock_ReturnsBadRequest()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.PostAsJsonAsync(
                "/api/alerts",
                new CreatePriceAlertRequestDto
                {
                    StockId = 999_999,
                    TargetPrice = 200m,
                    Condition = PriceAlertCondition.GreaterThanOrEqual,
                }
            );

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetAlerts_OnlyReturnsTheCallingUsersOwnAlerts()
        {
            var stock = await CreateStockAsAdminAsync(150m);

            var ownerClient = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await ownerClient.PostAsJsonAsync(
                "/api/alerts",
                new CreatePriceAlertRequestDto
                {
                    StockId = stock.Id,
                    TargetPrice = 200m,
                    Condition = PriceAlertCondition.GreaterThanOrEqual,
                }
            );

            var otherClient = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var ownerResponse = await ownerClient.GetAsync("/api/alerts");
            var otherResponse = await otherClient.GetAsync("/api/alerts");

            var ownerAlerts = await ownerResponse.Content.ReadFromJsonAsync<List<PriceAlertDto>>(JsonOptions);
            var otherAlerts = await otherResponse.Content.ReadFromJsonAsync<List<PriceAlertDto>>(JsonOptions);

            Assert.Contains(ownerAlerts!, a => a.StockId == stock.Id);
            Assert.DoesNotContain(otherAlerts!, a => a.StockId == stock.Id);
        }

        [Fact]
        public async Task CheckAndTriggerAlerts_PriceAtOrAboveTarget_CreatesNotificationForOwner()
        {
            var stock = await CreateStockAsAdminAsync(210m);
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            await client.PostAsJsonAsync(
                "/api/alerts",
                new CreatePriceAlertRequestDto
                {
                    StockId = stock.Id,
                    TargetPrice = 200m,
                    Condition = PriceAlertCondition.GreaterThanOrEqual,
                }
            );

            using (var scope = _factory.Services.CreateScope())
            {
                var alertService = scope.ServiceProvider.GetRequiredService<IPriceAlertService>();
                await alertService.CheckAndTriggerAlertsAsync();
            }

            var response = await client.GetAsync("/api/alerts/notifications");
            var notifications = await response.Content.ReadFromJsonAsync<List<AlertNotificationDto>>();

            Assert.Contains(notifications!, n => n.Message.Contains(stock.Symbol));
        }

        [Fact]
        public async Task MarkNotificationRead_NotOwner_ReturnsForbid()
        {
            var stock = await CreateStockAsAdminAsync(210m);
            var ownerClient = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await ownerClient.PostAsJsonAsync(
                "/api/alerts",
                new CreatePriceAlertRequestDto
                {
                    StockId = stock.Id,
                    TargetPrice = 200m,
                    Condition = PriceAlertCondition.GreaterThanOrEqual,
                }
            );

            int notificationId;
            using (var scope = _factory.Services.CreateScope())
            {
                var alertService = scope.ServiceProvider.GetRequiredService<IPriceAlertService>();
                await alertService.CheckAndTriggerAlertsAsync();

                var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
                var notification = await db
                    .AlertNotifications.OrderByDescending(n => n.CreatedAt)
                    .FirstAsync(n => n.PriceAlert.StockId == stock.Id);
                notificationId = notification.Id;
            }

            var attackerClient = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            var response = await attackerClient.PostAsync($"/api/alerts/notifications/{notificationId}/read", null);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task MarkNotificationRead_Owner_ReturnsOkAndPersistsIsRead()
        {
            var stock = await CreateStockAsAdminAsync(210m);
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync(
                "/api/alerts",
                new CreatePriceAlertRequestDto
                {
                    StockId = stock.Id,
                    TargetPrice = 200m,
                    Condition = PriceAlertCondition.GreaterThanOrEqual,
                }
            );

            using (var scope = _factory.Services.CreateScope())
            {
                var alertService = scope.ServiceProvider.GetRequiredService<IPriceAlertService>();
                await alertService.CheckAndTriggerAlertsAsync();
            }

            var notificationsResponse = await client.GetAsync("/api/alerts/notifications");
            var notifications = await notificationsResponse.Content.ReadFromJsonAsync<List<AlertNotificationDto>>();
            var target = notifications!.First(n => n.Message.Contains(stock.Symbol));

            var response = await client.PostAsync($"/api/alerts/notifications/{target.Id}/read", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var updated = await response.Content.ReadFromJsonAsync<AlertNotificationDto>();
            Assert.True(updated!.IsRead);
        }

        [Fact]
        public async Task DeleteAlert_Owner_RemovesItFromTheList()
        {
            var stock = await CreateStockAsAdminAsync(150m);
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var createResponse = await client.PostAsJsonAsync(
                "/api/alerts",
                new CreatePriceAlertRequestDto
                {
                    StockId = stock.Id,
                    TargetPrice = 200m,
                    Condition = PriceAlertCondition.GreaterThanOrEqual,
                }
            );
            var created = await createResponse.Content.ReadFromJsonAsync<PriceAlertDto>(JsonOptions);

            var response = await client.DeleteAsync($"/api/alerts/{created!.Id}");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            var remaining = await client.GetFromJsonAsync<List<PriceAlertDto>>("/api/alerts", JsonOptions);
            Assert.DoesNotContain(remaining!, a => a.Id == created.Id);
        }

        [Fact]
        public async Task DeleteAlert_NotOwner_ReturnsForbidden()
        {
            var stock = await CreateStockAsAdminAsync(150m);
            var ownerClient = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var createResponse = await ownerClient.PostAsJsonAsync(
                "/api/alerts",
                new CreatePriceAlertRequestDto
                {
                    StockId = stock.Id,
                    TargetPrice = 200m,
                    Condition = PriceAlertCondition.GreaterThanOrEqual,
                }
            );
            var created = await createResponse.Content.ReadFromJsonAsync<PriceAlertDto>(JsonOptions);

            var attackerClient = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            var response = await attackerClient.DeleteAsync($"/api/alerts/{created!.Id}");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

            var stillThere = await ownerClient.GetFromJsonAsync<List<PriceAlertDto>>("/api/alerts", JsonOptions);
            Assert.Contains(stillThere!, a => a.Id == created.Id);
        }

        [Fact]
        public async Task DeleteAlert_UnknownId_ReturnsNotFound()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.DeleteAsync("/api/alerts/999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
