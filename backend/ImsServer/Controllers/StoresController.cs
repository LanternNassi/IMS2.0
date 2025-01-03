using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models.StoreX;
using ImsServer.Models;

using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Text;


namespace ImsServer.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class StoresController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public StoresController(DBContext dbcontext , IMapper mapper){
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StoreDto>>> GetStores([FromQuery]string? keywords = null)
        {
            if (_dbcontext.Stores == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Stores.AsQueryable();

            if (keywords != null)
            {
                query = query.Where(c => c.Name.Contains(keywords));
            }

            return Ok(_mapper.Map<List<StoreDto>>(await query.ToListAsync()));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StoreDto>> GetStore(Guid id)
        {
            if (_dbcontext.Stores == null)
            {
                return NotFound();
            }
            var store = await _dbcontext.Stores.FindAsync(id);

            if (store == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<StoreDto>(store));

        }

        [HttpGet("DeletedStores")]
        public async Task<ActionResult<IEnumerable<StoreDto>>> GetDeletedStores([FromQuery]string? keywords = null)
        {
            if (_dbcontext.Stores == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Stores.IgnoreQueryFilters().Where(u => u.DeletedAt != null).AsQueryable();

            if (keywords != null)
            {
                query = query.Where(c => c.Name.Contains(keywords));
            }

            return Ok(_mapper.Map<List<StoreDto>>(await query.ToListAsync()));
        }


        [HttpPost]
        public async Task<ActionResult<Store>> PostStore(Store store)
        {
          if (_dbcontext.Users == null)
          {
              return Problem("Entity set 'DBContext.Store'  is null.");
          }

            // user.PasswordHash = PasswordHasherUtility.HashPassword(user.PasswordHash);
            _dbcontext.Stores.Add(store);
            await _dbcontext.SaveChangesAsync();

            return CreatedAtAction("GetStore", new { id = store.Id }, store);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutStore(Guid id, Store store)
        {
            if (id != store.Id)
            {
                return BadRequest();
            }

            _dbcontext.Entry(store).State = EntityState.Modified;

            try
            {
                await _dbcontext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_dbcontext.Stores.Any(e => e.Id == id))
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
        public async Task<IActionResult> DeleteStore(Guid id)
        {
            if (_dbcontext.Stores == null)
            {
                return NotFound();
            }
            var store = await _dbcontext.Stores.FindAsync(id);
            if (store == null)
            {
                return NotFound();
            }

            _dbcontext.SoftDelete(store);
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> RestoreStore(Guid id)
        {
            if (_dbcontext.Stores == null)
            {
                return NotFound();
            }
            var store = await _dbcontext.Stores.IgnoreQueryFilters().Where(u => u.DeletedAt != null && u.Id == id).FirstOrDefaultAsync();
            if (store == null)
            {
                return NotFound();
            }

            _dbcontext.Restore(store);
            await _dbcontext.SaveChangesAsync();

            return Ok();
        }



        

    }
    
}