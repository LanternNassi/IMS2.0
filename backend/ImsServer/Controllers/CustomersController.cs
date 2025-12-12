using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models.CustomerX;
using ImsServer.Models;
using ImsServer.Utils;

using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Text;


namespace ImsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly DBContext _dbcontext;
        private readonly IMapper _mapper;

        public CustomersController(DBContext dbcontext , IMapper mapper){
            _dbcontext = dbcontext;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers(
            [FromQuery]string? keywords = null,
            [FromQuery]int page = 1,
            [FromQuery]int pageSize = 10
        )
        {
            if (_dbcontext.Customers == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Customers
                                .Include(c => c.CustomerTags)
                                .AsQueryable();

            if (keywords != null){
                
                query = query.Where(c => c.Name.Contains(keywords));

            }

            var pagedCustomers = await Pagination.GetPagedAsync(query , page , pageSize);

            return Ok(new {
                Pagination = pagedCustomers.Pagination,
                Customers = _mapper.Map<List<CustomerDto>>(pagedCustomers.Items),
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDto>> GetCustomer (Guid id)
        {
            var customer = await _dbcontext.Customers
                                    .Where(c => c.Id==id)
                                    .Include(c => c.CustomerTags)
                                    .FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<CustomerDto>(customer));
        }

        [HttpPost]
        public async Task<ActionResult<CustomerDto>> CreateCustomer(CustomerDto customer)
        {
            if (_dbcontext.Customers == null)
            {
                return Problem("Entity set not found");
            }

            List<SimpleCustomerTagDto> tags = customer.CustomerTags;

            SimpleCustomerDto derived_customer = _mapper.Map<SimpleCustomerDto>(customer);  
            var saved_customer = _mapper.Map<Customer>(derived_customer);         
            _dbcontext.Customers.Add(saved_customer);

            //Checking the tags that are not present in the database

            if (tags != null && tags.Any()){
                foreach (SimpleCustomerTagDto tag in tags)
                {
                    var tag_present = await _dbcontext.CustomerTags.Where(c => c.Name == tag.Name).FirstOrDefaultAsync();

                    if (tag_present != null){

                        saved_customer.CustomerTags.Add(tag_present);
                        
                    }else {
                        var new_tag = _mapper.Map<CustomerTag>(tag);
                        _dbcontext.CustomerTags.Add(new_tag);
                        saved_customer.CustomerTags.Add(new_tag);

                    }
                    
                }
            }

            await _dbcontext.SaveChangesAsync();

            return CreatedAtAction("GetCustomer" , new { id = customer.Id} , customer);
        }

        [HttpGet("Tags")]
        public async Task<ActionResult<IEnumerable<SimpleCustomerTagDto>>> GetCustomerTags(
            [FromQuery] Guid? customer = null,
            [FromQuery] string? keywords = null
        )
        {
            var query = _dbcontext.CustomerTags
                .Include(c => c.Customers)
                .AsQueryable();

            if (!string.IsNullOrEmpty(keywords))
            {
                query = query.Where(c => c.Name.Contains(keywords));
            }

            if (customer != null)
            {
                query = query.Where(c => c.Customers.Any(cust => cust.Id == customer));
            }

            var result = await query.ToListAsync();
            
            return Ok(_mapper.Map<List<SimpleCustomerTagDto>>(result));
        }

        [HttpPost("Tags")]
        public async Task<IActionResult> CreateCustomerTags(SimpleCustomerTagDto tag)
        {

            try {

                _dbcontext.CustomerTags.Add(_mapper.Map<CustomerTag>(tag));

                await _dbcontext.SaveChangesAsync();

                return Ok();

            }catch(Exception ex){

                return BadRequest(ex.Message);

            }
            
        }

        [HttpPost("{customer}/tags")]
        public async Task<IActionResult> AttachCustomerTags(Guid customer, List<SimpleCustomerTagDto> tags)
        {
            try{

                var saved_customer = await _dbcontext.Customers.FindAsync(customer);

                if (tags != null && tags.Any()){
                    foreach (SimpleCustomerTagDto tag in tags)
                    {
                        var tag_present = await _dbcontext.CustomerTags.Where(c => c.Name == tag.Name).FirstOrDefaultAsync();

                        if (tag_present != null){

                            saved_customer.CustomerTags.Add(tag_present);
                            
                        }else {
                            var new_tag = _mapper.Map<CustomerTag>(tag);
                            _dbcontext.CustomerTags.Add(new_tag);
                            saved_customer.CustomerTags.Add(new_tag);
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
        public async Task<IActionResult> PutCustomer(Guid id, CustomerDto customer)
        {
            if (id != customer.Id)
            {
                return BadRequest("The entities don't match");
            }

            var db_customer = await _dbcontext.Customers
                                            .Include(c => c.CustomerTags) // Ensure existing tags are loaded
                                            .FirstOrDefaultAsync(c => c.Id == id);

            if (db_customer == null)
            {
                return NotFound("The customer doesn't exist in the database");
            }

            // Update customer details
            db_customer.Name = customer.Name;
            db_customer.CustomerType = customer.CustomerType;
            db_customer.Address = customer.Address;
            db_customer.Phone = customer.Phone;
            db_customer.Email = customer.Email;
            db_customer.AccountNumber = customer.AccountNumber;
            db_customer.MoreInfo = customer.MoreInfo;

            // Handle customer tags
            if (customer.CustomerTags == null || !customer.CustomerTags.Any())
            {
                db_customer.CustomerTags.Clear();
            }
            else
            {
                var new_tags = new List<CustomerTag>();

                foreach (var tagDto in customer.CustomerTags)
                {
                    var existingTag = await _dbcontext.CustomerTags
                                                    .FirstOrDefaultAsync(t => t.Name == tagDto.Name);

                    if (existingTag != null)
                    {
                        new_tags.Add(existingTag);
                        
                    }
                    else
                    {
                        // Create new tag
                        var newTag = _mapper.Map<CustomerTag>(tagDto);
                        _dbcontext.CustomerTags.Add(newTag);
                        new_tags.Add(newTag);
                    }
                }

                // Update customer tags (clear old ones and add new ones)
                db_customer.CustomerTags.Clear();
                foreach (var tag in new_tags)
                {
                    db_customer.CustomerTags.Add(tag);
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
        public async Task<IActionResult> DeleteCustomer(Guid id)
        {
            var customer = await _dbcontext.Customers.FindAsync(id);

            if (customer == null)
            {
                return NotFound();
            }

            _dbcontext.SoftDelete(customer);
            await _dbcontext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("DeletedCustomers")]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetDeletedCustomers(
            [FromQuery]string? keywords = null,
            [FromQuery]int page = 1,
            [FromQuery]int pageSize = 10
        )
        {
            if (_dbcontext.Customers == null)
            {
                return NotFound();
            }

            var query = _dbcontext.Customers
                                .IgnoreQueryFilters()
                                .Where(u => u.DeletedAt != null)
                                .Include(c => c.CustomerTags)
                                .AsQueryable();

            if (keywords != null){
                
                query = query.Where(c => c.Name.Contains(keywords));

            }

            var pagedCustomers = await Pagination.GetPagedAsync(query , page , pageSize);

            return Ok(new {
                Pagination = pagedCustomers.Pagination,
                Customers = _mapper.Map<List<CustomerDto>>(pagedCustomers.Items),
            });
        }


        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> RestoreCustomer(Guid id)
        {
            var customer = await _dbcontext.Customers.IgnoreQueryFilters().Where(u => u.DeletedAt != null && u.Id == id).FirstOrDefaultAsync();

            if (customer == null){
                return NotFound();
            }

            _dbcontext.Restore(customer);
            await _dbcontext.SaveChangesAsync();

            return Ok();
        }


    }
}