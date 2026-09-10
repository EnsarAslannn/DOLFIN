using api.Dtos.Alerts;
using api.Extensions;
using api.Interfaces;
using api.Mappers;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/alerts")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public class PriceAlertController : ControllerBase
    {
        private readonly IPriceAlertService _alertService;
        private readonly UserManager<AppUser> _userManager;

        public PriceAlertController(IPriceAlertService alertService, UserManager<AppUser> userManager)
        {
            _alertService = alertService;
            _userManager = userManager;
        }

        /// <summary>
        /// Creates a price alert on a stock for the signed-in user.
        /// </summary>
        /// <remarks>
        /// A background service re-checks active alerts on an interval and
        /// raises a notification once the condition is met, so alerts do not
        /// fire in real time.
        ///
        /// The same stock, price and direction cannot be watched twice at
        /// once: while an identical alert is still pending this is rejected as
        /// a duplicate. Once that alert has fired, setting it again is allowed
        /// — that is how a watch is re-armed.
        /// </remarks>
        /// <param name="dto">The stock, target price and trigger condition (above or below).</param>
        /// <response code="201">The alert was created.</response>
        /// <response code="400">Unknown stock, invalid target price, or an identical alert is already pending.</response>
        [HttpPost]
        [ProducesResponseType(typeof(PriceAlertDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreatePriceAlertRequestDto dto)
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized("User context not found.");

            try
            {
                var alert = await _alertService.CreateAlertAsync(
                    appUser,
                    dto.StockId,
                    dto.TargetPrice,
                    dto.Condition
                );
                return CreatedAtAction(nameof(GetAlerts), null, alert.ToPriceAlertDto());
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Lists all of the signed-in user's price alerts, newest first.
        /// </summary>
        /// <remarks>
        /// Both alerts still waiting on their condition and alerts that have
        /// already fired are returned — the wallet shows the two together.
        /// <c>triggeredAt</c> is what tells them apart: it is null while the
        /// alert is still being watched and carries the firing time once it
        /// has gone off. Deleting an alert is what removes it from this list.
        /// </remarks>
        /// <response code="200">The user's alerts, pending and fired alike.</response>
        [HttpGet]
        [ProducesResponseType(typeof(List<PriceAlertDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAlerts()
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized("User context not found.");

            var alerts = await _alertService.GetAlertsAsync(appUser);
            return Ok(alerts.Select(a => a.ToPriceAlertDto()));
        }

        /// <summary>
        /// Deletes one of the signed-in user's price alerts.
        /// </summary>
        /// <remarks>
        /// A notification raised by the alert is removed with it, so deleting
        /// a fired alert also clears it from the notification list.
        /// </remarks>
        /// <param name="id">The alert's id.</param>
        /// <response code="204">The alert was deleted.</response>
        /// <response code="403">The alert belongs to a different user.</response>
        /// <response code="404">No alert exists with that id.</response>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized("User context not found.");

            var alert = await _alertService.GetAlertByIdAsync(id);
            if (alert == null)
                return NotFound("Alert not found");

            if (alert.AppUserId != appUser.Id)
                return Forbid();

            await _alertService.DeleteAlertAsync(alert);
            return NoContent();
        }

        /// <summary>
        /// Lists the notifications raised by the user's triggered alerts.
        /// </summary>
        /// <response code="200">The user's notifications, read and unread.</response>
        [HttpGet("notifications")]
        [ProducesResponseType(typeof(List<AlertNotificationDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetNotifications()
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized("User context not found.");

            var notifications = await _alertService.GetNotificationsAsync(appUser);
            return Ok(notifications.Select(n => n.ToAlertNotificationDto()));
        }

        /// <summary>
        /// Marks one of the user's alert notifications as read.
        /// </summary>
        /// <param name="id">The notification's id.</param>
        /// <response code="200">The updated notification.</response>
        /// <response code="403">The notification belongs to a different user.</response>
        /// <response code="404">No notification exists with that id.</response>
        [HttpPost("notifications/{id:int}/read")]
        [ProducesResponseType(typeof(AlertNotificationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarkNotificationRead([FromRoute] int id)
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized("User context not found.");

            var notification = await _alertService.GetNotificationByIdAsync(id);
            if (notification == null)
                return NotFound("Notification not found");

            if (notification.AppUserId != appUser.Id)
                return Forbid();

            await _alertService.MarkNotificationReadAsync(notification);
            return Ok(notification.ToAlertNotificationDto());
        }
    }
}
