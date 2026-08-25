using System.Reflection;
using api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace api.Tests.Controllers
{
    public class StockControllerAuthorizationTests
    {
        private static MethodInfo GetAction(string name) =>
            typeof(StockController).GetMethod(name)
            ?? throw new InvalidOperationException($"Action '{name}' not found on StockController");

        [Theory]
        [InlineData(nameof(StockController.Create))]
        [InlineData(nameof(StockController.Update))]
        [InlineData(nameof(StockController.Delete))]
        public void MutatingActions_RequireAdminRole(string actionName)
        {
            var action = GetAction(actionName);

            var authorizeAttribute = action.GetCustomAttribute<AuthorizeAttribute>();

            Assert.NotNull(authorizeAttribute);
            Assert.Equal("Admin", authorizeAttribute!.Roles);
        }

        [Theory]
        [InlineData(nameof(StockController.GetAll))]
        [InlineData(nameof(StockController.GetById))]
        [InlineData(nameof(StockController.GetMarketTrends))]
        public void ReadActions_DoNotRequireAdminRole(string actionName)
        {
            var action = GetAction(actionName);

            var authorizeAttribute = action.GetCustomAttribute<AuthorizeAttribute>();

            Assert.True(
                authorizeAttribute == null || authorizeAttribute.Roles != "Admin",
                $"'{actionName}' should be reachable by any authenticated user, not admin-only."
            );
        }

        [Theory]
        [InlineData(nameof(StockController.GetAll))]
        [InlineData(nameof(StockController.GetById))]
        [InlineData(nameof(StockController.GetMarketTrends))]
        public void ReadActions_AreOpenToAnonymousVisitors(string actionName)
        {
            var action = GetAction(actionName);

            Assert.NotNull(action.GetCustomAttribute<AllowAnonymousAttribute>());
        }

        [Theory]
        [InlineData(nameof(StockController.Create))]
        [InlineData(nameof(StockController.Update))]
        [InlineData(nameof(StockController.Delete))]
        public void MutatingActions_AreNotOpenToAnonymousVisitors(string actionName)
        {
            var action = GetAction(actionName);

            Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
        }
    }
}
