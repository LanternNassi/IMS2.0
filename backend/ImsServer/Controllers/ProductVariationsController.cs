using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models.ProductX;
using ImsServer.Models;
using AutoMapper;


namespace ImsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductVariationsController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public ProductVariationsController(DBContext dbcontext, IMapper mapper)
        {
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        // GET: api/ProductVariations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductVariationDto>>> GetProductVariations([FromQuery] string? keywords = null, [FromQuery] Guid? productId = null)
        {
            if (_dbcontext.ProductVariations == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductVariations
                .Include(pv => pv.Product)
                .AsQueryable();

            if (keywords != null)
            {
                query = query.Where(pv => pv.Name.Contains(keywords));
            }

            if (productId.HasValue)
            {
                query = query.Where(pv => pv.ProductId == productId.Value);
            }

            return Ok(_mapper.Map<List<ProductVariationDto>>(await query.ToListAsync()));
        }

        // GET: api/ProductVariations/DeletedVariations
        [HttpGet("DeletedVariations")]
        public async Task<ActionResult<IEnumerable<ProductVariationDto>>> GetDeletedProductVariations([FromQuery] string? keywords = null, [FromQuery] Guid? productId = null)
        {
            if (_dbcontext.ProductVariations == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductVariations
                .IgnoreQueryFilters()
                .Where(pv => pv.DeletedAt != null)
                .Include(pv => pv.Product)
                .AsQueryable();

            if (keywords != null)
            {
                query = query.Where(pv => pv.Name.Contains(keywords));
            }

            if (productId.HasValue)
            {
                query = query.Where(pv => pv.ProductId == productId.Value);
            }

            return Ok(_mapper.Map<List<ProductVariationDto>>(await query.ToListAsync()));
        }

        // GET: api/ProductVariations/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductVariationDto>> GetProductVariation(Guid id)
        {
            if (_dbcontext.ProductVariations == null)
            {
                return NotFound();
            }

            var productVariation = await _dbcontext.ProductVariations
                .Include(pv => pv.Product)
                .FirstOrDefaultAsync(pv => pv.Id == id);

            if (productVariation == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<ProductVariationDto>(productVariation));
        }

        // POST: api/ProductVariations
        [HttpPost]
        public async Task<ActionResult<ProductVariationDto>> PostProductVariation(ProductVariationDto productVariation)
        {
            if (_dbcontext.ProductVariations == null)
            {
                return Problem("Entity set 'DBContext.ProductVariations' is null.");
            }

            // Validate that the product exists
            var productExists = await _dbcontext.Products.AnyAsync(p => p.Id == productVariation.ProductId);
            if (!productExists)
            {
                return BadRequest("The specified product does not exist.");
            }

            // If this is set as the main variation, ensure no other variation is main for this product
            if (productVariation.IsMain)
            {
                var existingMainVariations = await _dbcontext.ProductVariations
                    .Where(pv => pv.ProductId == productVariation.ProductId && pv.IsMain)
                    .ToListAsync();

                foreach (var existingMain in existingMainVariations)
                {
                    existingMain.IsMain = false;
                }
            }

            _dbcontext.ProductVariations.Add(_mapper.Map<ProductVariation>(productVariation));
            await _dbcontext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProductVariation), new { id = productVariation.Id }, _mapper.Map<ProductVariationDto>(productVariation));
        }

        // POST: api/ProductVariations/Bulk
        [HttpPost("Bulk")]
        public async Task<ActionResult<IEnumerable<ProductVariationDto>>> PostProductVariations(List<ProductVariationDto> productVariations)
        {
            if (_dbcontext.ProductVariations == null)
            {
                return Problem("Entity set 'DBContext.ProductVariations' is null.");
            }

            if (productVariations == null || !productVariations.Any())
            {
                return BadRequest("No variations provided.");
            }

            // Validate that all products exist
            var productIds = productVariations.Select(pv => pv.ProductId).Distinct().ToList();
            var existingProducts = await _dbcontext.Products
                .Where(p => productIds.Contains(p.Id))
                .Select(p => p.Id)
                .ToListAsync();

            var missingProductIds = productIds.Except(existingProducts).ToList();
            if (missingProductIds.Any())
            {
                return BadRequest($"The following product IDs do not exist: {string.Join(", ", missingProductIds)}");
            }

            // Handle main variation logic for each product
            foreach (var productId in productIds)
            {
                var mainVariations = productVariations.Where(pv => pv.ProductId == productId && pv.IsMain).ToList();
                if (mainVariations.Count > 1)
                {
                    // Only keep the first one as main
                    for (int i = 1; i < mainVariations.Count; i++)
                    {
                        mainVariations[i].IsMain = false;
                    }
                }

                // If any new variation is set as main, unset existing main variations
                if (mainVariations.Any())
                {
                    var existingMainVariations = await _dbcontext.ProductVariations
                        .Where(pv => pv.ProductId == productId && pv.IsMain)
                        .ToListAsync();

                    foreach (var existingMain in existingMainVariations)
                    {
                        existingMain.IsMain = false;
                    }
                }
            }

            _dbcontext.ProductVariations.AddRange(_mapper.Map<List<ProductVariation>>(productVariations));
            await _dbcontext.SaveChangesAsync();

            return Ok(_mapper.Map<List<ProductVariationDto>>(productVariations));
        }

        // PUT: api/ProductVariations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductVariation(Guid id, ProductVariationDto productVariation)
        {
            if (id != productVariation.Id)
            {
                return BadRequest("ID mismatch.");
            }

            // Validate that the product exists
            var productExists = await _dbcontext.Products.AnyAsync(p => p.Id == productVariation.ProductId);
            if (!productExists)
            {
                return BadRequest("The specified product does not exist.");
            }

            // If this is being set as the main variation, ensure no other variation is main for this product
            if (productVariation.IsMain)
            {
                var existingMainVariations = await _dbcontext.ProductVariations
                    .Where(pv => pv.ProductId == productVariation.ProductId && pv.IsMain && pv.Id != id)
                    .ToListAsync();

                foreach (var existingMain in existingMainVariations)
                {
                    existingMain.IsMain = false;
                }
            }

            _dbcontext.Entry(productVariation).State = EntityState.Modified;

            try
            {
                await _dbcontext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _dbcontext.ProductVariations.AnyAsync(e => e.Id == id))
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

        // DELETE: api/ProductVariations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductVariation(Guid id)
        {
            if (_dbcontext.ProductVariations == null)
            {
                return NotFound();
            }

            var productVariation = await _dbcontext.ProductVariations.FindAsync(id);
            if (productVariation == null)
            {
                return NotFound();
            }

            // Check if there are any storage records linked to this variation
            var hasStorageRecords = await _dbcontext.ProductStorages
                .AnyAsync(ps => ps.ProductVariationId == id);

            if (hasStorageRecords)
            {
                return BadRequest("Cannot delete this variation because it has associated storage records. Please delete or reassign the storage records first.");
            }

            _dbcontext.SoftDelete(productVariation);
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/ProductVariations/Restore/{id}
        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> RestoreProductVariation(Guid id)
        {
            if (_dbcontext.ProductVariations == null)
            {
                return NotFound();
            }

            var productVariation = await _dbcontext.ProductVariations
                .IgnoreQueryFilters()
                .Where(pv => pv.DeletedAt != null && pv.Id == id)
                .FirstOrDefaultAsync();

            if (productVariation == null)
            {
                return NotFound();
            }

            _dbcontext.Restore(productVariation);
            await _dbcontext.SaveChangesAsync();

            return Ok();
        }

        // PUT: api/ProductVariations/{id}/SetMain
        [HttpPut("{id}/SetMain")]
        public async Task<IActionResult> SetMainVariation(Guid id)
        {
            var productVariation = await _dbcontext.ProductVariations.FindAsync(id);
            if (productVariation == null)
            {
                return NotFound();
            }

            // Unset any existing main variations for this product
            var existingMainVariations = await _dbcontext.ProductVariations
                .Where(pv => pv.ProductId == productVariation.ProductId && pv.IsMain)
                .ToListAsync();

            foreach (var existingMain in existingMainVariations)
            {
                existingMain.IsMain = false;
            }

            // Set this variation as main
            productVariation.IsMain = true;

            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/ProductVariations/{id}/ToggleActive
        [HttpPut("{id}/ToggleActive")]
        public async Task<IActionResult> ToggleActiveStatus(Guid id)
        {
            var productVariation = await _dbcontext.ProductVariations.FindAsync(id);
            if (productVariation == null)
            {
                return NotFound();
            }

            productVariation.IsActive = !productVariation.IsActive;

            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }
    }
}
