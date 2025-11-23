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
    public class ProductGenericsController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public ProductGenericsController(DBContext dbcontext, IMapper mapper)
        {
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        // GET: api/ProductGenerics
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductGenericDto>>> GetProductGenerics(
            [FromQuery] string? keywords = null, 
            [FromQuery] Guid? productId = null,
            [FromQuery] Guid? supplierId = null,
            [FromQuery] bool? includeExpired = null)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductGenerics
                .Include(pg => pg.Product)
                .Include(pg => pg.Supplier)
                .AsQueryable();

            if (keywords != null)
            {
                query = query.Where(pg => pg.BatchNumber != null && pg.BatchNumber.Contains(keywords));
            }

            if (productId.HasValue)
            {
                query = query.Where(pg => pg.ProductId == productId.Value);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(pg => pg.SupplierId == supplierId.Value);
            }

            // Filter out expired items by default
            if (includeExpired == false || includeExpired == null)
            {
                query = query.Where(pg => pg.ExpiryDate >= DateTime.UtcNow);
            }

            return Ok(_mapper.Map<List<ProductGenericDto>>(await query.ToListAsync()));
        }

        // GET: api/ProductGenerics/Expired
        [HttpGet("Expired")]
        public async Task<ActionResult<IEnumerable<ProductGenericDto>>> GetExpiredProductGenerics(
            [FromQuery] string? keywords = null, 
            [FromQuery] Guid? productId = null,
            [FromQuery] Guid? supplierId = null)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductGenerics
                .Include(pg => pg.Product)
                .Include(pg => pg.Supplier)
                .Where(pg => pg.ExpiryDate < DateTime.UtcNow)
                .AsQueryable();

            if (keywords != null)
            {
                query = query.Where(pg => pg.BatchNumber != null && pg.BatchNumber.Contains(keywords));
            }

            if (productId.HasValue)
            {
                query = query.Where(pg => pg.ProductId == productId.Value);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(pg => pg.SupplierId == supplierId.Value);
            }

            return Ok(_mapper.Map<List<ProductGenericDto>>(await query.ToListAsync()));
        }

        // GET: api/ProductGenerics/ExpiringSoon
        [HttpGet("ExpiringSoon")]
        public async Task<ActionResult<IEnumerable<ProductGenericDto>>> GetExpiringSoonProductGenerics(
            [FromQuery] int days = 30,
            [FromQuery] Guid? productId = null,
            [FromQuery] Guid? supplierId = null)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return NotFound();
            }

            var futureDate = DateTime.UtcNow.AddDays(days);

            var query = _dbcontext.ProductGenerics
                .Include(pg => pg.Product)
                .Include(pg => pg.Supplier)
                .Where(pg => pg.ExpiryDate >= DateTime.UtcNow && pg.ExpiryDate <= futureDate)
                .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(pg => pg.ProductId == productId.Value);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(pg => pg.SupplierId == supplierId.Value);
            }

            return Ok(_mapper.Map<List<ProductGenericDto>>(await query.OrderBy(pg => pg.ExpiryDate).ToListAsync()));
        }

        // GET: api/ProductGenerics/DeletedGenerics
        [HttpGet("DeletedGenerics")]
        public async Task<ActionResult<IEnumerable<ProductGenericDto>>> GetDeletedProductGenerics(
            [FromQuery] string? keywords = null, 
            [FromQuery] Guid? productId = null,
            [FromQuery] Guid? supplierId = null)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return NotFound();
            }

            var query = _dbcontext.ProductGenerics
                .IgnoreQueryFilters()
                .Where(pg => pg.DeletedAt != null)
                .Include(pg => pg.Product)
                .Include(pg => pg.Supplier)
                .AsQueryable();

            if (keywords != null)
            {
                query = query.Where(pg => pg.BatchNumber != null && pg.BatchNumber.Contains(keywords));
            }

            if (productId.HasValue)
            {
                query = query.Where(pg => pg.ProductId == productId.Value);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(pg => pg.SupplierId == supplierId.Value);
            }

            return Ok(_mapper.Map<List<ProductGenericDto>>(await query.ToListAsync()));
        }

        // GET: api/ProductGenerics/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductGenericDto>> GetProductGeneric(Guid id)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return NotFound();
            }

            var productGeneric = await _dbcontext.ProductGenerics
                .Include(pg => pg.Product)
                .Include(pg => pg.Supplier)
                .FirstOrDefaultAsync(pg => pg.Id == id);

            if (productGeneric == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<ProductGenericDto>(productGeneric));
        }

        // POST: api/ProductGenerics
        [HttpPost]
        public async Task<ActionResult<ProductGeneric>> PostProductGeneric(ProductGeneric productGeneric)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return Problem("Entity set 'DBContext.ProductGenerics' is null.");
            }

            // Validate that the product exists
            var productExists = await _dbcontext.Products.AnyAsync(p => p.Id == productGeneric.ProductId);
            if (!productExists)
            {
                return BadRequest("The specified product does not exist.");
            }

            // Validate that the supplier exists
            var supplierExists = await _dbcontext.Suppliers.AnyAsync(s => s.Id == productGeneric.SupplierId);
            if (!supplierExists)
            {
                return BadRequest("The specified supplier does not exist.");
            }

            // Validate dates
            if (productGeneric.ExpiryDate <= productGeneric.ManufactureDate)
            {
                return BadRequest("Expiry date must be after manufacture date.");
            }

            if (productGeneric.ManufactureDate > DateTime.UtcNow)
            {
                return BadRequest("Manufacture date cannot be in the future.");
            }

            _dbcontext.ProductGenerics.Add(productGeneric);
            await _dbcontext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProductGeneric), new { id = productGeneric.Id }, _mapper.Map<ProductGenericDto>(productGeneric));
        }

        // POST: api/ProductGenerics/Bulk
        [HttpPost("Bulk")]
        public async Task<ActionResult<IEnumerable<ProductGeneric>>> PostProductGenerics(List<ProductGeneric> productGenerics)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return Problem("Entity set 'DBContext.ProductGenerics' is null.");
            }

            if (productGenerics == null || !productGenerics.Any())
            {
                return BadRequest("No generics provided.");
            }

            // Validate that all products exist
            var productIds = productGenerics.Select(pg => pg.ProductId).Distinct().ToList();
            var existingProducts = await _dbcontext.Products
                .Where(p => productIds.Contains(p.Id))
                .Select(p => p.Id)
                .ToListAsync();

            var missingProductIds = productIds.Except(existingProducts).ToList();
            if (missingProductIds.Any())
            {
                return BadRequest($"The following product IDs do not exist: {string.Join(", ", missingProductIds)}");
            }

            // Validate that all suppliers exist
            var supplierIds = productGenerics.Select(pg => pg.SupplierId).Distinct().ToList();
            var existingSuppliers = await _dbcontext.Suppliers
                .Where(s => supplierIds.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync();

            var missingSupplierIds = supplierIds.Except(existingSuppliers).ToList();
            if (missingSupplierIds.Any())
            {
                return BadRequest($"The following supplier IDs do not exist: {string.Join(", ", missingSupplierIds)}");
            }

            // Validate dates for each generic
            var invalidDateGenerics = productGenerics
                .Where(pg => pg.ExpiryDate <= pg.ManufactureDate || pg.ManufactureDate > DateTime.UtcNow)
                .ToList();

            if (invalidDateGenerics.Any())
            {
                return BadRequest("One or more generics have invalid dates. Ensure expiry date is after manufacture date and manufacture date is not in the future.");
            }

            _dbcontext.ProductGenerics.AddRange(productGenerics);
            await _dbcontext.SaveChangesAsync();

            return Ok(_mapper.Map<List<ProductGenericDto>>(productGenerics));
        }

        // PUT: api/ProductGenerics/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductGeneric(Guid id, ProductGeneric productGeneric)
        {
            if (id != productGeneric.Id)
            {
                return BadRequest("ID mismatch.");
            }

            // Validate that the product exists
            var productExists = await _dbcontext.Products.AnyAsync(p => p.Id == productGeneric.ProductId);
            if (!productExists)
            {
                return BadRequest("The specified product does not exist.");
            }

            // Validate that the supplier exists
            var supplierExists = await _dbcontext.Suppliers.AnyAsync(s => s.Id == productGeneric.SupplierId);
            if (!supplierExists)
            {
                return BadRequest("The specified supplier does not exist.");
            }

            // Validate dates
            if (productGeneric.ExpiryDate <= productGeneric.ManufactureDate)
            {
                return BadRequest("Expiry date must be after manufacture date.");
            }

            if (productGeneric.ManufactureDate > DateTime.UtcNow)
            {
                return BadRequest("Manufacture date cannot be in the future.");
            }

            _dbcontext.Entry(productGeneric).State = EntityState.Modified;

            try
            {
                await _dbcontext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _dbcontext.ProductGenerics.AnyAsync(e => e.Id == id))
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

        // DELETE: api/ProductGenerics/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductGeneric(Guid id)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return NotFound();
            }

            var productGeneric = await _dbcontext.ProductGenerics.FindAsync(id);
            if (productGeneric == null)
            {
                return NotFound();
            }

            // Check if there are any storage records linked to this generic
            var hasStorageRecords = await _dbcontext.ProductStorages
                .AnyAsync(ps => ps.ProductGenericId == id);

            if (hasStorageRecords)
            {
                return BadRequest("Cannot delete this generic because it has associated storage records. Please delete or reassign the storage records first.");
            }

            _dbcontext.SoftDelete(productGeneric);
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/ProductGenerics/Restore/{id}
        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> RestoreProductGeneric(Guid id)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return NotFound();
            }

            var productGeneric = await _dbcontext.ProductGenerics
                .IgnoreQueryFilters()
                .Where(pg => pg.DeletedAt != null && pg.Id == id)
                .FirstOrDefaultAsync();

            if (productGeneric == null)
            {
                return NotFound();
            }

            _dbcontext.Restore(productGeneric);
            await _dbcontext.SaveChangesAsync();

            return Ok();
        }

        // GET: api/ProductGenerics/ByBatchNumber/{batchNumber}
        [HttpGet("ByBatchNumber/{batchNumber}")]
        public async Task<ActionResult<IEnumerable<ProductGenericDto>>> GetProductGenericsByBatchNumber(string batchNumber)
        {
            if (_dbcontext.ProductGenerics == null)
            {
                return NotFound();
            }

            var productGenerics = await _dbcontext.ProductGenerics
                .Include(pg => pg.Product)
                .Include(pg => pg.Supplier)
                .Where(pg => pg.BatchNumber == batchNumber)
                .ToListAsync();

            if (!productGenerics.Any())
            {
                return NotFound();
            }

            return Ok(_mapper.Map<List<ProductGenericDto>>(productGenerics));
        }
    }
}
