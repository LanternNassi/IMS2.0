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
            // query = query.Include(s => s.Categories);


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
        public async Task<ActionResult<StoreDto>> PostStore(SimpleStoreDto store)
        {
          if (_dbcontext.Stores == null)
          {
              return Problem("Entity set 'DBContext.Store'  is null.");
          }

            _dbcontext.Stores.Add(_mapper.Map<Store>(store));
            await _dbcontext.SaveChangesAsync();

            return CreatedAtAction("GetStore", new { id = store.Id }, store);
        }

        // [HttpPatch("AddCategories/{store_id}")]
        // public async Task<IActionResult> AddCategoriesToStore(Guid store_id , List<Guid> categories)
        // {
        //     var store =  _dbcontext.Stores.Find(store_id);

        //     if (store == null){
        //         return BadRequest("The store doesnot exist");
        //     }

        //     foreach (var categoryId in categories)
        //     {
        //         var category = _dbcontext.Categories.Find(categoryId);
        //         if (category != null){
        //             store.Categories.Add(category);
        //         }
        //     }

        //     await _dbcontext.SaveChangesAsync();


        //     return Ok(new {message = "Categories added successfully"});
        // }

        // [HttpDelete("RemoveCategories/{store_id}")]
        // public async Task<IActionResult> RemoveCategoriesFromStore(Guid store_id , List<Guid> categories)
        // {
        //     var store =  _dbcontext.Stores.Find(store_id);

        //     if (store == null){
        //         return BadRequest("The store doesnot exist");
        //     }

        //     foreach (var categoryId in categories)
        //     {
        //         var category = _dbcontext.Categories.Find(categoryId);
        //         if (category != null){
        //             store.Categories.Remove(category);
        //         }
        //     }

        //     await _dbcontext.SaveChangesAsync();


        //     return Ok(new {message = "Categories removed successfully"});
        // }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutStore(Guid id, SimpleStoreDto store)
        {
            if (id != store.Id)
            {
                return BadRequest();
            }

            var db_store = _dbcontext.Stores.Find(id);

            if (db_store == null){
                return BadRequest("The store doesnot exist");
            }

            db_store.Name = store.Name;
            db_store.Address = store.Address;
            db_store.Description = store.Description;
            db_store.UpdatedAt = DateTime.Now;

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