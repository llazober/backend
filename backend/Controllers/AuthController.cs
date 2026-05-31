using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QCScheduler.Api.Data;
using QCScheduler.Api.Models.Scheduler;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace QCScheduler.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly QCSchedulerDbContext _context;
        // High-security key for local development
        private readonly string _jwtSecret = "QC_SCHEDULER_SECRET_KEY_VERY_LONG_SAFE_1234567890!";
        
        public AuthController(QCSchedulerDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return BadRequest(new { message = "Invalid username or password" });
            }

            var token = GenerateJwtToken(user);
            return Ok(new
            {
                user.Username,
                user.Role,
                Token = token
            });
        }

        [HttpGet("me")]
        public IActionResult Me()
        {
            if (User.Identity?.IsAuthenticated != true)
            {
                return Unauthorized();
            }

            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            return Ok(new { Username = username, Role = role });
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            var builder = new StringBuilder();
            foreach (var b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString() == storedHash;
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSecret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = "QCSchedulerApi",
                Audience = "QCSchedulerClients"
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
