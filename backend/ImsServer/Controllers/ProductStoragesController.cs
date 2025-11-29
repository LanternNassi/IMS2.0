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
    public class ProductStoragesController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public ProductStoragesController(DBContext dbcontext, IMapper mapper)
        {
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        // GET: api/ProductStorages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductStorageDto>>> GetProductStorages(
            [FromQuery] Guid? productGenericId = null,
            [FromQuery] Guid? productVariationId = null,
            [FromQuery] Guid? storageId = null,
            [FromQuery] bool? lowStock = null)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductStorages
                .Include(ps => ps.ProductGeneric)
                    .ThenInclude(pg => pg.Product)
                .Include(ps => ps.ProductVariation)
                .Include(ps => ps.Store)
                .AsQueryable();

            if (productGenericId.HasValue)
            {
                query = query.Where(ps => ps.ProductGenericId == productGenericId.Value);
            }

            if (productVariationId.HasValue)
            {
                query = query.Where(ps => ps.ProductVariationId == productVariationId.Value);
            }

            if (storageId.HasValue)
            {
                query = query.Where(ps => ps.StorageId == storageId.Value);
            }

            if (lowStock == true)
            {
                query = query.Where(ps => ps.Quantity <= ps.ReorderLevel);
            }

            return Ok(_mapper.Map<List<ProductStorageDto>>(await query.ToListAsync()));
        }

        // GET: api/ProductStorages/LowStock
        [HttpGet("LowStock")]
        public async Task<ActionResult<IEnumerable<ProductStorageDto>>> GetLowStockItems([FromQuery] Guid? storageId = null)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductStorages
                .Include(ps => ps.ProductGeneric)
                    .ThenInclude(pg => pg.Product)
                .Include(ps => ps.ProductVariation)
                .Include(ps => ps.Store)
                .Where(ps => ps.Quantity <= ps.ReorderLevel)
                .AsQueryable();

            if (storageId.HasValue)
            {
                query = query.Where(ps => ps.StorageId == storageId.Value);
            }

            return Ok(_mapper.Map<List<ProductStorageDto>>(await query.OrderBy(ps => ps.Quantity).ToListAsync()));
        }

        // GET: api/ProductStorages/OutOfStock
        [HttpGet("OutOfStock")]
        public async Task<ActionResult<IEnumerable<ProductStorageDto>>> GetOutOfStockItems([FromQuery] Guid? storageId = null)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductStorages
                .Include(ps => ps.ProductGeneric)
                    .ThenInclude(pg => pg.Product)
                .Include(ps => ps.ProductVariation)
                .Include(ps => ps.Store)
                .Where(ps => ps.Quantity == 0)
                .AsQueryable();

            if (storageId.HasValue)
            {
                query = query.Where(ps => ps.StorageId == storageId.Value);
            }

            return Ok(_mapper.Map<List<ProductStorageDto>>(await query.ToListAsync()));
        }

        // GET: api/ProductStorages/ByStore/{storeId}
        [HttpGet("ByStore/{storeId}")]
        public async Task<ActionResult<IEnumerable<ProductStorageDto>>> GetStorageByStore(Guid storeId)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var storages = await _dbcontext.ProductStorages
                .Include(ps => ps.ProductGeneric)
                    .ThenInclude(pg => pg.Product)
                .Include(ps => ps.ProductVariation)
                .Include(ps => ps.Store)
                .Where(ps => ps.StorageId == storeId)
                .ToListAsync();

            return Ok(_mapper.Map<List<ProductStorageDto>>(storages));
        }

        // GET: api/ProductStorages/ByProduct/{productId}
        [HttpGet("ByProduct/{productId}")]
        public async Task<ActionResult<IEnumerable<ProductStorageDto>>> GetStorageByProduct(Guid productId)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var storages = await _dbcontext.ProductStorages
                .Include(ps => ps.ProductGeneric)
                    .ThenInclude(pg => pg.Product)
                .Include(ps => ps.ProductVariation)
                .Include(ps => ps.Store)
                .Where(ps => ps.ProductGeneric.ProductId == productId)
                .ToListAsync();

            return Ok(_mapper.Map<List<ProductStorageDto>>(storages));
        }

        // GET: api/ProductStorages/DeletedStorages
        [HttpGet("DeletedStorages")]
        public async Task<ActionResult<IEnumerable<ProductStorageDto>>> GetDeletedProductStorages(
            [FromQuery] Guid? productGenericId = null,
            [FromQuery] Guid? storageId = null)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductStorages
                .IgnoreQueryFilters()
                .Where(ps => ps.DeletedAt != null)
                .Include(ps => ps.ProductGeneric)
                    .ThenInclude(pg => pg.Product)
                .Include(ps => ps.ProductVariation)
                .Include(ps => ps.Store)
                .AsQueryable();

            if (productGenericId.HasValue)
            {
                query = query.Where(ps => ps.ProductGenericId == productGenericId.Value);
            }

            if (storageId.HasValue)
            {
                query = query.Where(ps => ps.StorageId == storageId.Value);
            }

            return Ok(_mapper.Map<List<ProductStorageDto>>(await query.ToListAsync()));
        }

        // GET: api/ProductStorages/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductStorageDto>> GetProductStorage(Guid id)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var productStorage = await _dbcontext.ProductStorages
                .Include(ps => ps.ProductGeneric)
                    .ThenInclude(pg => pg.Product)
                .Include(ps => ps.ProductVariation)
                .Include(ps => ps.Store)
                .FirstOrDefaultAsync(ps => ps.Id == id);

            if (productStorage == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<ProductStorageDto>(productStorage));
        }

        // POST: api/ProductStorages
        [HttpPost]
        public async Task<ActionResult<SimpleProductStorageDto>> PostProductStorage(SimpleProductStorageDto productStorage)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return Problem("Entity set 'DBContext.ProductStorages' is null.");
            }

            // Validate that the product generic exists
            var genericExists = await _dbcontext.ProductGenerics.AnyAsync(pg => pg.Id == productStorage.ProductGenericId);
            if (!genericExists)
            {
                return BadRequest("The specified product generic does not exist.");
            }

            // Validate that the product variation exists
            var variationExists = await _dbcontext.ProductVariations.AnyAsync(pv => pv.Id == productStorage.ProductVariationId);
            if (!variationExists)
            {
                return BadRequest("The specified product variation does not exist.");
            }

            // Validate that the store exists
            var storeExists = await _dbcontext.Stores.AnyAsync(s => s.Id == productStorage.StorageId);
            if (!storeExists)
            {
                return BadRequest("The specified store does not exist.");
            }

            // Validate that the variation belongs to the same product as the generic
            var generic = await _dbcontext.ProductGenerics
                .FirstOrDefaultAsync(pg => pg.Id == productStorage.ProductGenericId);
            var variation = await _dbcontext.ProductVariations
                .FirstOrDefaultAsync(pv => pv.Id == productStorage.ProductVariationId);

            if (generic != null && variation != null && generic.ProductId != variation.ProductId)
            {
                return BadRequest("The product variation must belong to the same product as the product generic.");
            }

            // Check for duplicate storage entry
            var duplicateExists = await _dbcontext.ProductStorages.AnyAsync(ps => 
                ps.ProductGenericId == productStorage.ProductGenericId && 
                ps.ProductVariationId == productStorage.ProductVariationId && 
                ps.StorageId == productStorage.StorageId);

            if (duplicateExists)
            {
                return BadRequest("A storage entry for this combination of generic, variation, and store already exists.");
            }

            // Validate quantity and reorder level
            if (productStorage.Quantity < 0)
            {
                return BadRequest("Quantity cannot be negative.");
            }

            if (productStorage.ReorderLevel < 0)
            {
                return BadRequest("Reorder level cannot be negative.");
            }

            _dbcontext.ProductStorages.Add(_mapper.Map<ProductStorage>(productStorage));
            await _dbcontext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProductStorage), new { id = productStorage.Id }, _mapper.Map<ProductStorageDto>(productStorage));
        }

        // POST: api/ProductStorages/Bulk
        [HttpPost("Bulk")]
        public async Task<ActionResult<IEnumerable<SimpleProductStorageDto>>> PostProductStorages(List<SimpleProductStorageDto> productStorages)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return Problem("Entity set 'DBContext.ProductStorages' is null.");
            }

            if (productStorages == null || !productStorages.Any())
            {
                return BadRequest("No storage entries provided.");
            }

            // Validate all generics exist
            var genericIds = productStorages.Select(ps => ps.ProductGenericId).Distinct().ToList();
            var existingGenerics = await _dbcontext.ProductGenerics
                .Where(pg => genericIds.Contains(pg.Id))
                .ToListAsync();

            if (existingGenerics.Count != genericIds.Count)
            {
                return BadRequest("One or more product generics do not exist.");
            }

            // Validate all variations exist
            var variationIds = productStorages.Select(ps => ps.ProductVariationId).Distinct().ToList();
            var existingVariations = await _dbcontext.ProductVariations
                .Where(pv => variationIds.Contains(pv.Id))
                .ToListAsync();

            if (existingVariations.Count != variationIds.Count)
            {
                return BadRequest("One or more product variations do not exist.");
            }

            // Validate all stores exist
            var storeIds = productStorages.Select(ps => ps.StorageId).Distinct().ToList();
            var existingStores = await _dbcontext.Stores
                .Where(s => storeIds.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync();

            if (existingStores.Count != storeIds.Count)
            {
                return BadRequest("One or more stores do not exist.");
            }

            // Validate generic-variation product matching
            foreach (var storage in productStorages)
            {
                var generic = existingGenerics.FirstOrDefault(g => g.Id == storage.ProductGenericId);
                var variation = existingVariations.FirstOrDefault(v => v.Id == storage.ProductVariationId);

                if (generic != null && variation != null && generic.ProductId != variation.ProductId)
                {
                    return BadRequest($"Storage entry with Generic ID {storage.ProductGenericId} and Variation ID {storage.ProductVariationId}: The variation must belong to the same product as the generic.");
                }

                if (storage.Quantity < 0 || storage.ReorderLevel < 0)
                {
                    return BadRequest("Quantity and reorder level cannot be negative.");
                }
            }

            _dbcontext.ProductStorages.AddRange(_mapper.Map<List<ProductStorage>>(productStorages));
            await _dbcontext.SaveChangesAsync();

            return Ok(_mapper.Map<List<ProductStorageDto>>(productStorages));
        }

        // PUT: api/ProductStorages/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductStorage(Guid id, SimpleProductStorageDto productStorage)
        {
            if (id != productStorage.Id)
            {
                return BadRequest("ID mismatch.");
            }

            // Validate that the product generic exists
            var genericExists = await _dbcontext.ProductGenerics.AnyAsync(pg => pg.Id == productStorage.ProductGenericId);
            if (!genericExists)
            {
                return BadRequest("The specified product generic does not exist.");
            }

            // Validate that the product variation exists
            var variationExists = await _dbcontext.ProductVariations.AnyAsync(pv => pv.Id == productStorage.ProductVariationId);
            if (!variationExists)
            {
                return BadRequest("The specified product variation does not exist.");
            }

            // Validate that the store exists
            var storeExists = await _dbcontext.Stores.AnyAsync(s => s.Id == productStorage.StorageId);
            if (!storeExists)
            {
                return BadRequest("The specified store does not exist.");
            }

            // Validate quantity and reorder level
            if (productStorage.Quantity < 0)
            {
                return BadRequest("Quantity cannot be negative.");
            }

            if (productStorage.ReorderLevel < 0)
            {
                return BadRequest("Reorder level cannot be negative.");
            }

            _dbcontext.Entry(productStorage).State = EntityState.Modified;

            try
            {
                await _dbcontext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _dbcontext.ProductStorages.AnyAsync(e => e.Id == id))
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

        // PUT: api/ProductStorages/{id}/UpdateQuantity
        [HttpPut("{id}/UpdateQuantity")]
        public async Task<IActionResult> UpdateQuantity(Guid id, [FromBody] decimal quantity)
        {
            var productStorage = await _dbcontext.ProductStorages.FindAsync(id);
            if (productStorage == null)
            {
                return NotFound();
            }

            if (quantity < 0)
            {
                return BadRequest("Quantity cannot be negative.");
            }

            productStorage.Quantity = quantity;
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/ProductStorages/{id}/AdjustQuantity
        [HttpPut("{id}/AdjustQuantity")]
        public async Task<IActionResult> AdjustQuantity(Guid id, [FromBody] decimal adjustment)
        {
            var productStorage = await _dbcontext.ProductStorages.FindAsync(id);
            if (productStorage == null)
            {
                return NotFound();
            }

            var newQuantity = productStorage.Quantity + adjustment;
            if (newQuantity < 0)
            {
                return BadRequest("Adjustment would result in negative quantity.");
            }

            productStorage.Quantity = newQuantity;
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/ProductStorages/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductStorage(Guid id)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var productStorage = await _dbcontext.ProductStorages.FindAsync(id);
            if (productStorage == null)
            {
                return NotFound();
            }

            _dbcontext.SoftDelete(productStorage);
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/ProductStorages/Restore/{id}
        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> RestoreProductStorage(Guid id)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var productStorage = await _dbcontext.ProductStorages
                .IgnoreQueryFilters()
                .Where(ps => ps.DeletedAt != null && ps.Id == id)
                .FirstOrDefaultAsync();

            if (productStorage == null)
            {
                return NotFound();
            }

            _dbcontext.Restore(productStorage);
            await _dbcontext.SaveChangesAsync();

            return Ok();
        }
    }
}
