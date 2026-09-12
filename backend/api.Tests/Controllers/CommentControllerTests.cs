using System.Security.Claims;
using api.Controllers;
using api.Dtos.Comment;
using api.Interfaces;
using api.Models;
using api.Tests.TestHelpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace api.Tests.Controllers
{
    public class CommentControllerTests
    {
        private static CommentController CreateController(
            Mock<ICommentRepository> commentRepo,
            Mock<IStockRepository> stockRepo,
            Mock<UserManager<AppUser>> userManager,
            string? authenticatedUsername
        )
        {
            var stockCacheInvalidator = new Mock<IStockCacheInvalidator>();
            var controller = new CommentController(
                commentRepo.Object,
                stockRepo.Object,
                stockCacheInvalidator.Object,
                userManager.Object
            );

            var claims = new List<Claim>();
            if (authenticatedUsername != null)
            {
                claims.Add(new Claim(ClaimTypes.Name, authenticatedUsername));
            }
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal },
            };

            return controller;
        }

        private static AppUser MakeUser(string id, string username) =>
            new AppUser { Id = id, UserName = username };

        private static Comment MakeComment(int id, string ownerId) =>
            new Comment
            {
                Id = id,
                Title = "Existing title",
                Content = "Existing content",
                AppUserId = ownerId,
            };

        [Fact]
        public async Task Update_WhenNotOwner_ReturnsForbid()
        {
            var owner = MakeUser("owner-id", "owner");
            var attacker = MakeUser("attacker-id", "attacker");

            var commentRepo = new Mock<ICommentRepository>();
            commentRepo
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(MakeComment(1, owner.Id));

            var stockRepo = new Mock<IStockRepository>();
            var userManager = MockUserManager.Create();
            userManager.Setup(u => u.FindByNameAsync("attacker")).ReturnsAsync(attacker);

            var controller = CreateController(commentRepo, stockRepo, userManager, "attacker");

            var result = await controller.Update(
                1,
                new UpdateCommentRequestDto { Title = "Hacked title", Content = "Hacked content" }
            );

            Assert.IsType<ForbidResult>(result);
            commentRepo.Verify(
                r => r.UpdateAsync(It.IsAny<int>(), It.IsAny<Comment>()),
                Times.Never
            );
        }

        [Fact]
        public async Task Update_WhenOwner_ReturnsOk()
        {
            var owner = MakeUser("owner-id", "owner");

            var commentRepo = new Mock<ICommentRepository>();
            commentRepo
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(MakeComment(1, owner.Id));
            commentRepo
                .Setup(r => r.UpdateAsync(1, It.IsAny<Comment>()))
                .ReturnsAsync(MakeComment(1, owner.Id));

            var stockRepo = new Mock<IStockRepository>();
            var userManager = MockUserManager.Create();
            userManager.Setup(u => u.FindByNameAsync("owner")).ReturnsAsync(owner);

            var controller = CreateController(commentRepo, stockRepo, userManager, "owner");

            var result = await controller.Update(
                1,
                new UpdateCommentRequestDto { Title = "New title", Content = "New content" }
            );

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Update_WhenCommentMissing_ReturnsNotFound()
        {
            var owner = MakeUser("owner-id", "owner");

            var commentRepo = new Mock<ICommentRepository>();
            commentRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Comment?)null);

            var stockRepo = new Mock<IStockRepository>();
            var userManager = MockUserManager.Create();
            userManager.Setup(u => u.FindByNameAsync("owner")).ReturnsAsync(owner);

            var controller = CreateController(commentRepo, stockRepo, userManager, "owner");

            var result = await controller.Update(
                99,
                new UpdateCommentRequestDto { Title = "New title", Content = "New content" }
            );

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task Delete_WhenNotOwner_ReturnsForbid()
        {
            var owner = MakeUser("owner-id", "owner");
            var attacker = MakeUser("attacker-id", "attacker");

            var commentRepo = new Mock<ICommentRepository>();
            commentRepo
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(MakeComment(1, owner.Id));

            var stockRepo = new Mock<IStockRepository>();
            var userManager = MockUserManager.Create();
            userManager.Setup(u => u.FindByNameAsync("attacker")).ReturnsAsync(attacker);

            var controller = CreateController(commentRepo, stockRepo, userManager, "attacker");

            var result = await controller.Delete(1);

            Assert.IsType<ForbidResult>(result);
            commentRepo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task Delete_WhenOwner_ReturnsOk()
        {
            var owner = MakeUser("owner-id", "owner");

            var commentRepo = new Mock<ICommentRepository>();
            commentRepo
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(MakeComment(1, owner.Id));
            commentRepo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(MakeComment(1, owner.Id));

            var stockRepo = new Mock<IStockRepository>();
            var userManager = MockUserManager.Create();
            userManager.Setup(u => u.FindByNameAsync("owner")).ReturnsAsync(owner);

            var controller = CreateController(commentRepo, stockRepo, userManager, "owner");

            var result = await controller.Delete(1);

            Assert.IsType<OkObjectResult>(result);
        }

        // This action used to return the EF entity itself, which put the
        // author's internal user id on the wire and made it the odd one out in
        // a controller that answers in DTOs everywhere else.
        [Fact]
        public async Task Delete_WhenOwner_AnswersWithADtoNotTheEntity()
        {
            var owner = MakeUser("owner-id", "owner");

            var stored = MakeComment(1, owner.Id);
            stored.AppUser = owner;

            var commentRepo = new Mock<ICommentRepository>();
            commentRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(stored);
            // The delete path does not load the author, exactly as the
            // repository behaves.
            commentRepo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(MakeComment(1, owner.Id));

            var stockRepo = new Mock<IStockRepository>();
            var userManager = MockUserManager.Create();
            userManager.Setup(u => u.FindByNameAsync("owner")).ReturnsAsync(owner);

            var controller = CreateController(commentRepo, stockRepo, userManager, "owner");

            var result = Assert.IsType<OkObjectResult>(await controller.Delete(1));

            var dto = Assert.IsType<CommentDto>(result.Value);
            Assert.Equal(1, dto.Id);
            Assert.Equal("Existing title", dto.Title);
            Assert.Equal("owner", dto.CreatedBy);
        }

        [Fact]
        public async Task Delete_WhenCommentMissing_ReturnsNotFound()
        {
            var owner = MakeUser("owner-id", "owner");

            var commentRepo = new Mock<ICommentRepository>();
            commentRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Comment?)null);

            var stockRepo = new Mock<IStockRepository>();
            var userManager = MockUserManager.Create();
            userManager.Setup(u => u.FindByNameAsync("owner")).ReturnsAsync(owner);

            var controller = CreateController(commentRepo, stockRepo, userManager, "owner");

            var result = await controller.Delete(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
