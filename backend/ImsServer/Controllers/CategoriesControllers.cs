using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models.CategoryX;
using ImsServer.Models;

using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Text;


namespace ImsServer.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public CategoriesController(DBContext dbcontext , IMapper mapper){
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories([FromQuery]string? keywords = null)
        {
            if (_dbcontext.Categories == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Categories.AsQueryable();
            // query = query.Include(s => s.Stores);

            if (keywords != null)
            {
                query = query.Where(c => c.Name.Contains(keywords));
            }

            return Ok(_mapper.Map<List<CategoryDto>>(await query.ToListAsync()));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetCategory(Guid id)
        {
            if (_dbcontext.Categories == null)
            {
                return NotFound();
            }
            var category = await _dbcontext.Categories.Where(c => c.Id==id).FirstOrDefaultAsync();

            if (category == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<CategoryDto>(category));

        }

        [HttpGet("DeletedCategories")]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetDeletedCategories([FromQuery]string? keywords = null)
        {
            if (_dbcontext.Categories == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Categories.IgnoreQueryFilters().Where(u => u.DeletedAt != null).AsQueryable();

            if (keywords != null)
            {
                query = query.Where(c => c.Name.Contains(keywords));
            }

            return Ok(_mapper.Map<List<CategoryDto>>(await query.ToListAsync()));
        }


        [HttpPost]
        public async Task<ActionResult<CategoryDto>> PostCategory(SimpleCategoryDto category)
        {
          if (_dbcontext.Categories == null)
          {
              return Problem("Entity set 'DBContext.Category'  is null.");
          }

            _dbcontext.Categories.Add(_mapper.Map<Category>(category));
            await _dbcontext.SaveChangesAsync();

            return CreatedAtAction("GetCategory", new { id = category.Id }, category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategory(Guid id, SimpleCategoryDto category)
        {
            if (id != category.Id)
            {
                return BadRequest();
            }

            var db_category = await _dbcontext.Categories.FindAsync(id);

            if (db_category == null){
                return BadRequest("The category doesnot exist");
            }

            db_category.Name = category.Name;
            db_category.Description = category.Description;
            db_category.UpdatedAt = DateTime.Now;


            try
            {
                await _dbcontext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_dbcontext.Categories.Any(e => e.Id == id))
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
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            if (_dbcontext.Categories == null)
            {
                return NotFound();
            }
            var category = await _dbcontext.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            _dbcontext.SoftDelete(category);
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> RestoreCategory(Guid id)
        {
            if (_dbcontext.Categories == null)
            {
                return NotFound();
            }
            var category = await _dbcontext.Categories.IgnoreQueryFilters().Where(u => u.DeletedAt != null && u.Id == id).FirstOrDefaultAsync();
            if (category == null)
            {
                return NotFound();
            }

            _dbcontext.Restore(category);
            await _dbcontext.SaveChangesAsync();

            return Ok();
        }


    }
    
}