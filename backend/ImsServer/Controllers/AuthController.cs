using Microsoft.AspNetCore.Mvc;
using ImsServer.Models.UserX;
using ImsServer.Models;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

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

            // In production, use a secure password hash comparison
            var user = await _dbcontext.Users.FirstOrDefaultAsync(u =>
                u.Username == login.Username &&
                u.PasswordHash == login.password);

            if (user == null)
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
                Expires = DateTime.UtcNow.AddHours(12),
                // SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes("YourSecretKeyHere")), SecurityAlgorithms.HmacSha256Signature)
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
    }
}
