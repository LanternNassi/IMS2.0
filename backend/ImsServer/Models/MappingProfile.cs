using AutoMapper;
using ImsServer.Models.UserX;
using ImsServer.Models.StoreX;
using ImsServer.Models.CategoryX;
using ImsServer.Models.CustomerX;
using ImsServer.Models.SupplierX;
using ImsServer.Models.ProductX;

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

            CreateMap<Supplier, SimpleSupplierDto>().ReverseMap();
            CreateMap<Supplier, SupplierDto>().ReverseMap();
            CreateMap<SimpleSupplierDto, SupplierDto>().ReverseMap();

            CreateMap<SupplierTag, SupplierTagDto>().ReverseMap();
            CreateMap<SupplierTag, SimpleSupplierTagDto>().ReverseMap();

            CreateMap<Product, SimpleProductDto>().ReverseMap();
            CreateMap<Product, ProductDto>().ReverseMap();

            CreateMap<ProductVariation, SimpleProductVariationDto>().ReverseMap();
            CreateMap<ProductVariation, ProductVariationDto>().ReverseMap();

            CreateMap<ProductGeneric, SimpleProductGenericDto>().ReverseMap();
            CreateMap<ProductGeneric, ProductGenericDto>().ReverseMap();

            CreateMap<ProductStorage, SimpleProductStorageDto>().ReverseMap();
            CreateMap<ProductStorage, ProductStorageDto>().ReverseMap();
            
        }
    }


}

