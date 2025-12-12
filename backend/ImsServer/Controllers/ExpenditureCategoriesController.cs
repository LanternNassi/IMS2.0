using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.ExpenditureX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpenditureCategoriesController : ControllerBase
    {
        private readonly DBContext _db;

        public ExpenditureCategoriesController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetExpenditureCategories(
            [FromQuery] string? name,
            [FromQuery] ExpenditureType? type,
            [FromQuery] bool includeExpenditures = false)
        {
            var query = _db.ExpenditureCategories
                .Where(c => !c.DeletedAt.HasValue)
                .OrderBy(c => c.Name)
                .AsQueryable();

            if (includeExpenditures)
            {
                query = query.Include(c => c.Expenditures.Where(e => !e.DeletedAt.HasValue));
            }

            // Apply filters
            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(c => c.Name.Contains(name));
            }

            if (type.HasValue)
            {
                query = query.Where(c => c.Type == type.Value);
            }

            var categories = await query.ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetExpenditureCategory(Guid id, [FromQuery] bool includeExpenditures = false)
        {
            var query = _db.ExpenditureCategories
                .Where(c => c.Id == id && !c.DeletedAt.HasValue);

            if (includeExpenditures)
            {
                query = query.Include(c => c.Expenditures.Where(e => !e.DeletedAt.HasValue));
            }

            var category = await query.FirstOrDefaultAsync();

            if (category == null) return NotFound();

            return Ok(category);
        }

        [HttpPost]
        public async Task<IActionResult> CreateExpenditureCategory([FromBody] CreateExpenditureCategoryDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Check for duplicate name
            var exists = await _db.ExpenditureCategories
                .AnyAsync(c => c.Name == dto.Name && !c.DeletedAt.HasValue);

            if (exists)
            {
                return BadRequest($"An expenditure category with name '{dto.Name}' already exists.");
            }

            var category = new ExpenditureCategory
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                Name = dto.Name,
                Description = dto.Description,
                Type = dto.Type
            };

            _db.ExpenditureCategories.Add(category);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetExpenditureCategory), new { id = category.Id }, category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExpenditureCategory(Guid id, [FromBody] UpdateExpenditureCategoryDto dto)
        {
            var category = await _db.ExpenditureCategories.FindAsync(id);
            if (category == null) return NotFound();

            // Check for duplicate name if name is being changed
            if (!string.IsNullOrEmpty(dto.Name) && dto.Name != category.Name)
            {
                var exists = await _db.ExpenditureCategories
                    .AnyAsync(c => c.Name == dto.Name && c.Id != id && !c.DeletedAt.HasValue);

                if (exists)
                {
                    return BadRequest($"An expenditure category with name '{dto.Name}' already exists.");
                }

                category.Name = dto.Name;
            }

            if (dto.Description != null)
            {
                category.Description = dto.Description;
            }

            if (dto.Type.HasValue)
            {
                category.Type = dto.Type.Value;
            }

            await _db.SaveChangesAsync();

            return Ok(category);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpenditureCategory(Guid id)
        {
            var category = await _db.ExpenditureCategories
                .Include(c => c.Expenditures)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return NotFound();

            // Check if category has expenditures
            var hasExpenditures = category.Expenditures?.Any(e => !e.DeletedAt.HasValue) ?? false;
            if (hasExpenditures)
            {
                return BadRequest("Cannot delete category with existing expenditures. Delete or reassign expenditures first.");
            }

            _db.SoftDelete(category);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
