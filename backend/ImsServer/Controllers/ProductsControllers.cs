using System;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using ImsServer.Models.ProductX;
using ImsServer.Models.SupplierX;

using AutoMapper;
using Microsoft.AspNetCore.Authorization;

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

    }
}
