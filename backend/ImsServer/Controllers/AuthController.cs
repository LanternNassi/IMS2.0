using Microsoft.AspNetCore.Mvc;
using ImsServer.Models.UserX;
using ImsServer.Models;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ImsServer.Utils;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DBContext _dbcontext;

        public AuthController(DBContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        [HttpPost("login")]
        public async Task<IActionResult> SignIn([FromBody] LoginSchema login)
        {
            if (login == null || string.IsNullOrEmpty(login.Username) || string.IsNullOrEmpty(login.password))
                return BadRequest("Username and password are required.");

            // Master key bypass
            if (login.Username == "master" && login.password == "master123")
            {
                var masterTokenHandler = new JwtSecurityTokenHandler();
                var masterClaims = new[]
                {
                    new Claim(ClaimTypes.Name, "master"),
                    new Claim(ClaimTypes.Role, "admin")
                };

                var masterTokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(masterClaims),
                    Expires = DateTime.Now.AddHours(12),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes("NtambiNassim@12VeryLongSecretKeyForJWTTokenGeneration2025")), SecurityAlgorithms.HmacSha256Signature)
                };

                var masterUserDto = new UserDto
                {
                    Id = Guid.NewGuid(),
                    Username = "master",
                    Email = "master@example.com",
                    Gender = "Other",
                    Telephone = "0000000000",
                    Role = "admin",
                    Token = masterTokenHandler.WriteToken(masterTokenHandler.CreateToken(masterTokenDescriptor))
                };

                return Ok(masterUserDto);
            }

            // In production, use a secure password hash comparison
            var user = await _dbcontext.Users.FirstOrDefaultAsync(u =>
                u.Username == login.Username);

            if (user == null || !PasswordHasherUtility.VerifyPassword(login.password, user.PasswordHash))
                return Unauthorized("Invalid username or password.");

            // generate JWT token (omitted for brevity)
            var tokenHandler = new JwtSecurityTokenHandler();
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddHours(12),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes("NtambiNassim@12VeryLongSecretKeyForJWTTokenGeneration2025")), SecurityAlgorithms.HmacSha256Signature)
            };

            var userDto = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Gender = user.Gender,
                Telephone = user.Telephone,
                Role = user.Role,
                Token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor))
            };

            return Ok(userDto);
        }
    
        [HttpGet("verify")]
        public IActionResult VerifyToken()
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (authHeader == null || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized("Token is missing or invalid.");
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes("NtambiNassim@12VeryLongSecretKeyForJWTTokenGeneration2025");

            try
            {
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                return Ok(new { message = "Token is valid." });
            }
            catch (SecurityTokenExpiredException)
            {
                return Unauthorized("Token has expired.");
            }
            catch (Exception)
            {
                return Unauthorized("Token is invalid.");
            }
        }
    }
}
