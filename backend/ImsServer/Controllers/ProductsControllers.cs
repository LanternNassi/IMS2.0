using System;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;

using ImsServer.Models.ProductX;
using ImsServer.Models.SupplierX;

using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using ImsServer.Utils;

namespace ImsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public ProductsController(DBContext dbcontext , IMapper mapper){
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts(
            [FromQuery]string? keywords = null,
            [FromQuery]int page = 1,
            [FromQuery]int pageSize = 10
        )
        {

            if (_dbcontext.Products == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Products
                                .Include(p => p.ProductVariations)
                                .AsQueryable();

            if (keywords != null){
                query = query.Where(p => p.ProductName.Contains(keywords));
            }

            var pagedProducts = await Pagination.GetPagedAsync(query , page , pageSize);

            return Ok( new {
                Pagination = pagedProducts.Pagination,
                Products = _mapper.Map<List<ProductDto>>(pagedProducts.Items),
            });
            
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(Guid id)
        {
            var product = await _dbcontext.Products
                                    .Where(p => p.Id==id)
                                    .FirstOrDefaultAsync();

            var productvariations =  _dbcontext.ProductVariations
                                                .Where(p => p.Product.Id == id);

            var productStorages =  _dbcontext.ProductStorages
                                                        .Include(p => p.ProductGeneric)
                                                            .ThenInclude(p => p.Product)
                                                        .Include(p => p.Store)
                                                        .Where(p => p.ProductGeneric.Product.Id == id);

            var productGenerics = _dbcontext.ProductGenerics
                                                .Include(p => p.ProductStorages)
                                                .Include(p => p.Supplier)
                                                .Where(p => p.Product.Id == id);

            // var productStores = await _dbcontext.Stores
            //                                         .Include(s => s.ProductStorages)
            //                                             .ThenInclude(p => p.ProductGeneric)
            //                                                     .ThenInclude(p => p.Product)
            //                                         .Where(s => s.ProductStorages.ProductGeneric.Product.Id == id);

            var productDto = _mapper.Map<SimpleProductDto>(product);
            var variations = _mapper.Map<List<ProductVariationDto>>(await productvariations.ToListAsync());
            var storages = _mapper.Map<List<ProductStorageDto>>(await productStorages.ToListAsync());
            var generics = _mapper.Map<List<ProductGenericDto>>(await productGenerics.ToListAsync());

            var result = new System.Dynamic.ExpandoObject() as IDictionary<string, object?>;
            foreach (var prop in productDto.GetType().GetProperties())
            {
                var name = prop.Name;
                if (!string.IsNullOrEmpty(name))
                {
                    var key = char.ToLowerInvariant(name[0]) + (name.Length > 1 ? name.Substring(1) : string.Empty);
                    result[key] = prop.GetValue(productDto);
                }
            }

            result["variations"] = variations;
            result["storages"] = storages;
            result["generics"] = generics;

            return Ok(result);

                                            
        }

        [HttpPost]
        public async Task<ActionResult<SimpleProductDto>> CreateProduct([FromBody] CreateProductDto productDto)
        {
            if (_dbcontext.Products == null)
            {
                return Problem("Entity not found");
            }

            try {

                // Create the product first 
                var product_instance = new Product
                {
                    Id = productDto.Id,
                    ProductName = productDto.ProductName,
                    BarCode = productDto.BarCode,
                    Description = productDto.Description,
                    BaseCostPrice = productDto.BaseCostPrice,
                    BaseRetailPrice = productDto.BaseRetailPrice,
                    BaseWholeSalePrice = productDto.BaseWholeSalePrice,
                    BaseDiscount = productDto.BaseDiscount,
                    StackSize = productDto.StackSize,
                    BasicUnitofMeasure = productDto.BasicUnitofMeasure,
                    ReorderLevel = productDto.ReorderLevel,
                    IsTaxable = productDto.IsTaxable,
                    TaxRate = productDto.TaxRate,
                    IsActive = productDto.IsActive
                };

                _dbcontext.Products.Add(product_instance);

                // Handle variations
                if (productDto.Variations != null && productDto.Variations.Any())
                {
                    // Use provided variations
                    foreach (var variationDto in productDto.Variations)
                    {
                        var variation = _mapper.Map<ProductVariation>(variationDto);
                        variation.ProductId = product_instance.Id;
                        _dbcontext.ProductVariations.Add(variation);
                    }
                }
                else
                {
                    // Create automatic main variation if none provided
                    var product_variation = new SimpleProductVariationDto{
                        ProductId = product_instance.Id,
                        Name = product_instance.ProductName,
                        UnitSize = product_instance.StackSize,
                        RetailPrice = product_instance.BaseRetailPrice,
                        WholeSalePrice = product_instance.BaseWholeSalePrice,
                        Discount = product_instance.BaseDiscount,
                        UnitofMeasure = product_instance.BasicUnitofMeasure,
                        IsActive = product_instance.IsActive,
                        IsMain = true
                    };

                    var product_variation_instance = _mapper.Map<ProductVariation>(product_variation);
                    _dbcontext.ProductVariations.Add(product_variation_instance);
                }

                await _dbcontext.SaveChangesAsync();

                var createdProduct = _mapper.Map<SimpleProductDto>(product_instance);
                return CreatedAtAction("GetProduct" , new { id = createdProduct.Id} , createdProduct);

            }catch(Exception ex){

                return Problem(ex.Message);

            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] CreateProductDto productDto)
        {
            if (id != productDto.Id)
            {
                return BadRequest("Product ID mismatch");
            }

            var product = await _dbcontext.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            try
            {
                // Update product properties
                product.ProductName = productDto.ProductName;
                product.BarCode = productDto.BarCode;
                product.Description = productDto.Description;
                product.BaseCostPrice = productDto.BaseCostPrice;
                product.BaseRetailPrice = productDto.BaseRetailPrice;
                product.BaseWholeSalePrice = productDto.BaseWholeSalePrice;
                product.BaseDiscount = productDto.BaseDiscount;
                product.StackSize = productDto.StackSize;
                product.BasicUnitofMeasure = productDto.BasicUnitofMeasure;
                product.ReorderLevel = productDto.ReorderLevel;
                product.IsTaxable = productDto.IsTaxable;
                product.TaxRate = productDto.TaxRate;
                product.IsActive = productDto.IsActive;

                _dbcontext.Products.Update(product);

                // Handle variations
                if (productDto.Variations != null && productDto.Variations.Any())
                {
                    // Get existing variations
                    var existingVariations = await _dbcontext.ProductVariations
                        .Where(v => v.ProductId == id)
                        .ToListAsync();

                    var incomingVariationIds = productDto.Variations
                        .Where(v => v.Id != Guid.Empty)
                        .Select(v => v.Id)
                        .ToList();

                    // Remove variations that are no longer in the request
                    var variationsToRemove = existingVariations
                        .Where(ev => !incomingVariationIds.Contains(ev.Id))
                        .ToList();

                    _dbcontext.ProductVariations.RemoveRange(variationsToRemove);

                    foreach (var variationDto in productDto.Variations)
                    {
                        // Check if it's a new variation (Guid.Empty or not in existing)
                        var existingVariation = existingVariations.FirstOrDefault(v => v.Id == variationDto.Id);
                        
                        if (existingVariation != null)
                        {
                            // Update existing variation
                            existingVariation.Name = variationDto.Name;
                            existingVariation.UnitSize = variationDto.UnitSize;
                            existingVariation.RetailPrice = variationDto.RetailPrice;
                            existingVariation.WholeSalePrice = variationDto.WholeSalePrice;
                            existingVariation.CostPrice = variationDto.CostPrice;
                            existingVariation.Discount = variationDto.Discount;
                            existingVariation.UnitofMeasure = variationDto.UnitofMeasure;
                            existingVariation.IsActive = variationDto.IsActive;
                            existingVariation.IsMain = variationDto.IsMain;

                            _dbcontext.ProductVariations.Update(existingVariation);
                        }
                        else
                        {
                            // Add new variation
                            var newVariation = _mapper.Map<ProductVariation>(variationDto);
                            newVariation.ProductId = id;
                            
                            // Generate new ID if it's empty or a placeholder
                            if (newVariation.Id == Guid.Empty || !existingVariations.Any(v => v.Id == newVariation.Id))
                            {
                                newVariation.Id = Guid.NewGuid();
                            }

                            _dbcontext.ProductVariations.Add(newVariation);
                        }
                    }
                }

                // Handle generics and their storages (if provided)
                if (productDto.Generics != null && productDto.Generics.Any())
                {
                    var existingGenerics = await _dbcontext.ProductGenerics
                        .Include(g => g.ProductStorages)
                        .Where(g => g.ProductId == id)
                        .ToListAsync();

                    var incomingGenericIds = productDto.Generics
                        .Where(g => g.Id != Guid.Empty)
                        .Select(g => g.Id)
                        .ToList();

                    var genericsToRemove = existingGenerics
                        .Where(eg => !incomingGenericIds.Contains(eg.Id))
                        .ToList();

                    _dbcontext.ProductGenerics.RemoveRange(genericsToRemove);

                    foreach (var genericDto in productDto.Generics)
                    {
                        var existingGeneric = existingGenerics.FirstOrDefault(g => g.Id == genericDto.Id);
                        
                        if (existingGeneric != null)
                        {
                            // Update existing generic
                            existingGeneric.ExpiryDate = genericDto.ExpiryDate;
                            existingGeneric.ManufactureDate = genericDto.ManufactureDate;
                            existingGeneric.BatchNumber = genericDto.BatchNumber;
                            existingGeneric.SupplierId = genericDto.SupplierId;

                            _dbcontext.ProductGenerics.Update(existingGeneric);

                            // Handle storages for this generic
                            if (genericDto.ProductStorages != null && genericDto.ProductStorages.Any())
                            {
                                // Initialize collection if null
                                if (existingGeneric.ProductStorages == null)
                                {
                                    existingGeneric.ProductStorages = new List<ProductStorage>();
                                }

                                var existingStorages = existingGeneric.ProductStorages.ToList();
                                var incomingStorageIds = genericDto.ProductStorages
                                    .Where(s => s.Id != Guid.Empty)
                                    .Select(s => s.Id)
                                    .ToList();

                                // Remove storages that are no longer in the request
                                var storagesToRemove = existingStorages
                                    .Where(es => !incomingStorageIds.Contains(es.Id))
                                    .ToList();

                                foreach (var storageToRemove in storagesToRemove)
                                {
                                    existingGeneric.ProductStorages.Remove(storageToRemove);
                                    _dbcontext.ProductStorages.Remove(storageToRemove);
                                }

                                foreach (var storageDto in genericDto.ProductStorages)
                                {
                                    var existingStorage = existingStorages.FirstOrDefault(s => s.Id == storageDto.Id);

                                    if (existingStorage != null)
                                    {
                                        // Update existing storage
                                        existingStorage.Quantity = storageDto.Quantity;
                                        existingStorage.ReorderLevel = storageDto.ReorderLevel;
                                        existingStorage.ProductVariationId = storageDto.ProductVariationId;
                                        existingStorage.StorageId = storageDto.StorageId;

                                        _dbcontext.ProductStorages.Update(existingStorage);
                                    }
                                    else
                                    {
                                        // Add new storage
                                        var newStorage = _mapper.Map<ProductStorage>(storageDto);
                                        newStorage.ProductGenericId = existingGeneric.Id;

                                        if (newStorage.Id == Guid.Empty)
                                        {
                                            newStorage.Id = Guid.NewGuid();
                                        }

                                        // Add to both the collection and DbContext
                                        existingGeneric.ProductStorages.Add(newStorage);
                                        _dbcontext.ProductStorages.Add(newStorage);
                                    }
                                }
                            }
                        }
                        else
                        {
                            // Add new generic
                            var newGeneric = _mapper.Map<ProductGeneric>(genericDto);
                            newGeneric.ProductId = id;
                            
                            if (newGeneric.Id == Guid.Empty)
                            {
                                newGeneric.Id = Guid.NewGuid();
                            }

                            _dbcontext.ProductGenerics.Add(newGeneric);

                            // Handle storages for the new generic
                            if (genericDto.ProductStorages != null && genericDto.ProductStorages.Any())
                            {
                                foreach (var storageDto in genericDto.ProductStorages)
                                {
                                    var newStorage = _mapper.Map<ProductStorage>(storageDto);
                                    newStorage.ProductGenericId = newGeneric.Id;

                                    if (newStorage.Id == Guid.Empty)
                                    {
                                        newStorage.Id = Guid.NewGuid();
                                    }

                                    _dbcontext.ProductStorages.Add(newStorage);
                                }
                            }
                        }
                    }
                }

                await _dbcontext.SaveChangesAsync();

                return NoContent();

            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ProductExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }
        

        
        private async Task<bool> ProductExists(Guid id)
        {
            return await _dbcontext.Products.AnyAsync(e => e.Id == id);
        }




    }
}
