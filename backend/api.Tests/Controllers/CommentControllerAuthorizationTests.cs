using System.Reflection;
using api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace api.Tests.Controllers
{
    public class CommentControllerAuthorizationTests
    {
        private static MethodInfo GetAction(string name) =>
            typeof(CommentController).GetMethod(name)
            ?? throw new InvalidOperationException($"Action '{name}' not found on CommentController");

        [Theory]
        [InlineData(nameof(CommentController.GetAll))]
        [InlineData(nameof(CommentController.GetById))]
        public void ReadActions_AreOpenToAnonymousVisitors(string actionName)
        {
            var action = GetAction(actionName);

            Assert.NotNull(action.GetCustomAttribute<AllowAnonymousAttribute>());
        }

        [Theory]
        [InlineData(nameof(CommentController.Create))]
        [InlineData(nameof(CommentController.Update))]
        [InlineData(nameof(CommentController.Delete))]
        public void WritingActions_StayBehindTheSignInWall(string actionName)
        {
            var action = GetAction(actionName);

            Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
        }
    }
}
