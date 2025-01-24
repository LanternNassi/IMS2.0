using AutoMapper;
using ImsServer.Models.UserX;
using ImsServer.Models.StoreX;
using ImsServer.Models.CategoryX;
using ImsServer.Models.CustomerX;

namespace ImsServer.Models{

    public class MappingProfile : Profile {

        public MappingProfile()
        {
            
            CreateMap<User , UserDto>().ReverseMap();

            CreateMap<Store, StoreDto>().ReverseMap();
            CreateMap<Store , SimpleStoreDto>().ReverseMap();

            CreateMap<Category, CategoryDto>().ReverseMap();
            CreateMap<Category, SimpleCategoryDto>().ReverseMap();

            CreateMap<Customer, SimpleCustomerDto>().ReverseMap();
            CreateMap<Customer, CustomerDto>().ReverseMap();
            CreateMap<SimpleCustomerDto, CustomerDto>().ReverseMap();

            CreateMap<CustomerTag, CustomerTagDto>().ReverseMap();
            CreateMap<CustomerTag, SimpleCustomerTagDto>().ReverseMap();


        }
    }


}

