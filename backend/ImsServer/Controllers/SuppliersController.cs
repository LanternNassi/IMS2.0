using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models.SupplierX;
using ImsServer.Models;
using ImsServer.Utils;

using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Text;


namespace ImsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SuppliersController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public SuppliersController(DBContext dbcontext , IMapper mapper){
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SupplierDto>>> GetSuppliers(
            [FromQuery]string? keywords = null,
            [FromQuery]int page = 1,
            [FromQuery]int pageSize = 10
        )
        {
            if (_dbcontext.Suppliers == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Suppliers
                                .Include(c => c.SupplierTags)
                                .AsQueryable();

            if (keywords != null){
                
                query = query.Where(c => c.CompanyName.Contains(keywords));

            }

            var pagedSuppliers = await Pagination.GetPagedAsync(query , page , pageSize);

            return Ok(new {
                Pagination = pagedSuppliers.Pagination,
                Suppliers = _mapper.Map<List<SupplierDto>>(pagedSuppliers.Items),
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SupplierDto>> GetSupplier (Guid id)
        {
            var supplier = await _dbcontext.Suppliers
                                    .Where(c => c.Id==id)
                                    .Include(c => c.SupplierTags)
                                    .FirstOrDefaultAsync();

            if (supplier == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<SupplierDto>(supplier));
        }

        [HttpPost]
        public async Task<ActionResult<SupplierDto>> CreateSupplier(SupplierDto supplier)
        {
            if (_dbcontext.Suppliers == null)
            {
                return Problem("Entity set not found");
            }

            List<SimpleSupplierTagDto> tags = supplier.SupplierTags;

            SimpleSupplierDto derived_supplier = _mapper.Map<SimpleSupplierDto>(supplier);  
            var saved_supplier = _mapper.Map<Supplier>(derived_supplier);         
            _dbcontext.Suppliers.Add(saved_supplier);

            //Checking the tags that are not present in the database

            if (tags != null && tags.Any()){
                foreach (SimpleSupplierTagDto tag in tags)
                {
                    var tag_present = await _dbcontext.SupplierTags.Where(c => c.Name == tag.Name).FirstOrDefaultAsync();

                    if (tag_present != null){

                        saved_supplier.SupplierTags.Add(tag_present);
                        
                    }else {
                        var new_tag = _mapper.Map<SupplierTag>(tag);
                        _dbcontext.SupplierTags.Add(new_tag);
                        saved_supplier.SupplierTags.Add(new_tag);

                    }
                    
                }
            }

            await _dbcontext.SaveChangesAsync();

            return CreatedAtAction("GetSupplier" , new { id = supplier.Id} , supplier);
        }

        [HttpGet("Tags")]
        public async Task<ActionResult<IEnumerable<SimpleSupplierTagDto>>> GetSupplierTags(
            [FromQuery] Guid? supplier = null,
            [FromQuery] string? keywords = null
        )
        {
            var query = _dbcontext.SupplierTags
                .Include(c => c.Suppliers)
                .AsQueryable();

            if (!string.IsNullOrEmpty(keywords))
            {
                query = query.Where(c => c.Name.Contains(keywords));
            }

            if (supplier != null)
            {
                query = query.Where(c => c.Suppliers.Any(supp => supp.Id == supplier));
            }

            var result = await query.ToListAsync();
            
            return Ok(_mapper.Map<List<SimpleSupplierTagDto>>(result));
        }

        [HttpPost("Tags")]
        public async Task<IActionResult> CreateSupplierTags(SimpleSupplierTagDto tag)
        {

            try {

                _dbcontext.SupplierTags.Add(_mapper.Map<SupplierTag>(tag));

                await _dbcontext.SaveChangesAsync();

                return Ok();

            }catch(Exception ex){

                return BadRequest(ex.Message);

            }
            
        }

        [HttpPost("{supplier}/tags")]
        public async Task<IActionResult> AttachSupplierTags(Guid supplier, List<SimpleSupplierTagDto> tags)
        {
            try{

                var saved_supplier = await _dbcontext.Suppliers.FindAsync(supplier);

                if (tags != null && tags.Any()){
                    foreach (SimpleSupplierTagDto tag in tags)
                    {
                        var tag_present = await _dbcontext.SupplierTags.Where(c => c.Name == tag.Name).FirstOrDefaultAsync();

                        if (tag_present != null){

                            saved_supplier.SupplierTags.Add(tag_present);
                            
                        }else {
                            var new_tag = _mapper.Map<SupplierTag>(tag);
                            _dbcontext.SupplierTags.Add(new_tag);
                            saved_supplier.SupplierTags.Add(new_tag);
                        }
                        
                    }

                    await _dbcontext.SaveChangesAsync();

                    return Ok("Tags were added successfully");
                }

                return BadRequest("No tags were supplied");
            }catch(Exception ex){
                return BadRequest(ex.Message);
            }
            
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutSupplier(Guid id, SupplierDto supplier)
        {
            if (id != supplier.Id)
            {
                return BadRequest("The entities don't match");
            }

            var db_supplier = await _dbcontext.Suppliers
                                            .Include(c => c.SupplierTags) // Ensure existing tags are loaded
                                            .FirstOrDefaultAsync(c => c.Id == id);

            if (db_supplier == null)
            {
                return NotFound("The supplier doesn't exist in the database");
            }

            // Update supplier details
            db_supplier.CompanyName = supplier.CompanyName;
            db_supplier.ContactPerson = supplier.ContactPerson;
            db_supplier.EmailAddress = supplier.EmailAddress;
            db_supplier.PhoneNumber = supplier.PhoneNumber;
            db_supplier.Address = supplier.Address;
            db_supplier.TIN = supplier.TIN;
            db_supplier.Status = supplier.Status;

            // Handle supplier tags
            if (supplier.SupplierTags == null || !supplier.SupplierTags.Any())
            {
                db_supplier.SupplierTags.Clear();
            }
            else
            {
                var new_tags = new List<SupplierTag>();

                foreach (var tagDto in supplier.SupplierTags)
                {
                    var existingTag = await _dbcontext.SupplierTags
                                                    .FirstOrDefaultAsync(t => t.Name == tagDto.Name);

                    if (existingTag != null)
                    {
                        new_tags.Add(existingTag);
                        
                    }
                    else
                    {
                        // Create new tag
                        var newTag = _mapper.Map<SupplierTag>(tagDto);
                        _dbcontext.SupplierTags.Add(newTag);
                        new_tags.Add(newTag);
                    }
                }

                // Update customer tags (clear old ones and add new ones)
                db_supplier.SupplierTags.Clear();
                foreach (var tag in new_tags)
                {
                    db_supplier.SupplierTags.Add(tag);
                }
            }

            try
            {
                await _dbcontext.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(Guid id)
        {
            var supplier = await _dbcontext.Suppliers.FindAsync(id);

            if (supplier == null)
            {
                return NotFound();
            }

            _dbcontext.SoftDelete(supplier);
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("DeletedSuppliers")]
        public async Task<ActionResult<IEnumerable<SupplierDto>>> GetDeletedSuppliers(
            [FromQuery]string? keywords = null,
            [FromQuery]int page = 1,
            [FromQuery]int pageSize = 10
        )
        {
            if (_dbcontext.Suppliers == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Suppliers
                                .IgnoreQueryFilters()
                                .Where(u => u.DeletedAt != null)
                                .Include(c => c.SupplierTags)
                                .AsQueryable();

            if (keywords != null){
                
                query = query.Where(c => c.CompanyName.Contains(keywords));

            }

            var pagedSuppliers = await Pagination.GetPagedAsync(query , page , pageSize);

            return Ok(new {
                Pagination = pagedSuppliers.Pagination,
                Suppliers = _mapper.Map<List<SupplierDto>>(pagedSuppliers.Items),
            });
        }


        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> RestoreSupplier(Guid id)
        {
            var supplier = await _dbcontext.Suppliers.IgnoreQueryFilters().Where(u => u.DeletedAt != null && u.Id == id).FirstOrDefaultAsync();

            if (supplier == null){
                return NotFound();
            }

            _dbcontext.Restore(supplier);
            await _dbcontext.SaveChangesAsync();

            return Ok();
        }


    }
}