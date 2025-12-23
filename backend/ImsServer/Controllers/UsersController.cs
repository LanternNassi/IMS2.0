using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models.UserX;
using ImsServer.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using ImsServer.Utils;


namespace ImsServer.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public UsersController(DBContext dbcontext , IMapper mapper){
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers([FromQuery]string? keywords = null)
        {
            if (_dbcontext.Users == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Users.AsQueryable();

            if (keywords != null)
            {
                query = query.Where(c => c.Username.Contains(keywords));
            }

            return Ok(_mapper.Map<List<UserDto>>(await query.ToListAsync()));
        }

        [HttpGet("DeletedUsers")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetDeletedUsers([FromQuery]string? keywords = null)
        {
            if (_dbcontext.Users == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Users.IgnoreQueryFilters().Where(u => u.DeletedAt != null).AsQueryable();

            if (keywords != null)
            {
                query = query.Where(c => c.Username.Contains(keywords));
            }

            return Ok(_mapper.Map<List<UserDto>>(await query.ToListAsync()));
        }



        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(Guid id)
        {
            if (_dbcontext.Users == null)
            {
                return NotFound();
            }
            var user = await _dbcontext.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<UserDto>(user));

        }

        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
          if (_dbcontext.Users == null)
          {
              return Problem("Entity set 'DBContext.Users'  is null.");
          }

            user.PasswordHash = PasswordHasherUtility.HashPassword(user.PasswordHash);
            _dbcontext.Users.Add(user);
            await _dbcontext.SaveChangesAsync();

            return Created("GetUser", new { id = user.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(Guid id, User user)
        {
            if (id != user.Id)
            {
                return BadRequest();
            }

            _dbcontext.Entry(user).State = EntityState.Modified;

            try
            {
                await _dbcontext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_dbcontext.Users.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            if (_dbcontext.Users == null)
            {
                return NotFound();
            }
            var user = await _dbcontext.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            _dbcontext.SoftDelete(user);
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> RestoreUser(Guid id)
        {
            if (_dbcontext.Users == null)
            {
                return NotFound();
            }
            var user = await _dbcontext.Users.IgnoreQueryFilters().Where(u => u.DeletedAt != null && u.Id == id).FirstOrDefaultAsync();
            if (user == null)
            {
                return NotFound();
            }

            _dbcontext.Restore(user);
            await _dbcontext.SaveChangesAsync();

            return Ok();
        }

    }
    
}