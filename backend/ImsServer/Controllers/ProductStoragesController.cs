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

        [HttpGet("ByProductVariation/{variationId}")]
        public async Task<ActionResult<IEnumerable<ProductStorageDto>>> GetStorageByProductVariation(Guid variationId)
        {
            if (_dbcontext.ProductStorages == null)
            {
                return NotFound();
            }

            var storages = await _dbcontext.ProductStorages
                .Include(ps => ps.ProductGeneric)
                    .ThenInclude(pg => pg.Product)
                .Include(ps => ps.Store)
                .Where(ps => ps.ProductVariationId == variationId)
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

            if (_dbcontext.ProductGenerics == null || _dbcontext.ProductVariations == null)
            {
                return Problem("Related entity sets are null.");
            }

            var variation = await _dbcontext.ProductVariations
                .Include(pv => pv.Product)
                .FirstOrDefaultAsync(pv => pv.Id == productStorage.ProductVariationId);

            var product = await _dbcontext.Products
                .Include(p => p.ProductGenerics)
                .FirstOrDefaultAsync(p => p.Id == variation.ProductId);

            if (product == null)
            {
                return BadRequest("The product associated with the specified variation does not exist.");
            }

            if (variation == null)
            {
                return BadRequest("The specified product variation does not exist.");
            }
            
            // Handle ProductGenericId - use most recent or create dummy if not provided
            ProductGeneric generic = null;
            if (productStorage.ProductGenericId == Guid.Empty || productStorage.ProductGenericId == null)
            {
                // Try to get the most recent generic for this product (by Id descending)
                generic = await _dbcontext.ProductGenerics
                    .Where(pg => pg.ProductId == variation.ProductId)
                    .OrderByDescending(pg => pg.Id)
                    .FirstOrDefaultAsync();

                if (generic == null)
                {
                    // Create a dummy generic
                    generic = new ProductGeneric
                    {
                        Id = Guid.NewGuid(),
                        ProductId = variation.ProductId,
                        ExpiryDate = DateTime.Now.AddYears(10), // Default 10 year expiry
                        ManufactureDate = DateTime.Now,
                        BatchNumber = $"DEFAULT-{DateTime.Now:yyyyMMddHHmmss}",
                        SupplierId = await _dbcontext.Suppliers.Select(s => s.Id).FirstOrDefaultAsync() // Use first available supplier
                    };

                    if (generic.SupplierId == Guid.Empty)
                    {
                        return BadRequest("No suppliers available. Cannot create default product generic.");
                    }

                    // product.ProductGenerics.Add(generic);
                    _dbcontext.ProductGenerics.Add(generic);
                    await _dbcontext.SaveChangesAsync();
                }

                productStorage.ProductGenericId = generic.Id;

            }
            else
            {
                // Validate that the provided product generic exists
                generic = await _dbcontext.ProductGenerics
                    .FirstOrDefaultAsync(pg => pg.Id == productStorage.ProductGenericId);
                
                if (generic == null)
                {
                    return BadRequest("The specified product generic does not exist.");
                }
            }

            
            // Map DTO to entity
            var storageEntity = _mapper.Map<ProductStorage>(productStorage);

            

            // generic.ProductStorages.Add(storageEntity);
            _dbcontext.ProductStorages.Add(storageEntity);

            await _dbcontext.SaveChangesAsync();

            // Add them to their respective collections
            generic.ProductStorages.Add(storageEntity);
            variation.ProductStorages.Add(storageEntity);

            await _dbcontext.SaveChangesAsync();

            return Ok(_mapper.Map<ProductStorageDto>(storageEntity));

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
            if (id != productStorage.Id.GetValueOrDefault())
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
