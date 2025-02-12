using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models.CustomerX;
using ImsServer.Models;

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
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers([FromQuery]string? keywords = null)
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

            return Ok(_mapper.Map<List<CustomerDto>>(await query.ToListAsync()));
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






    }
}