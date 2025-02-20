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
                                                        .Where(p => p.ProductGeneric.Product.Id == id);

            // var productStores = await _dbcontext.Stores
            //                                         .Include(s => s.ProductStorages)
            //                                             .ThenInclude(p => p.ProductGeneric)
            //                                                     .ThenInclude(p => p.Product)
            //                                         .Where(s => s.ProductStorages.ProductGeneric.Product.Id == id);

            return Ok(new {
                Product = _mapper.Map<SimpleProductDto>(product),
                Variations = _mapper.Map<List<ProductVariationDto>>(await productvariations.ToListAsync()),
                Storages = _mapper.Map<List<ProductStorageDto>>(await productStorages.ToListAsync())
            });

                                            
        }

        [HttpPost]
        public async Task<ActionResult<SimpleProductDto>> CreateProduct(SimpleProductDto product)
        {
            if (_dbcontext.Products == null)
            {
                return Problem("Entity not found");
            }

            try {

                // Create the product first 

                var product_instance = _mapper.Map<Product>(product);
                _dbcontext.Products.Add(product_instance);

                //Create the first automatic variation based off the product

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

                await _dbcontext.SaveChangesAsync();

                return CreatedAtAction("GetProduct" , new { id = product.Id} , product);


            }catch(Exception ex){

                return Problem(ex.Message);

            }

            

            




        }




    }
}
