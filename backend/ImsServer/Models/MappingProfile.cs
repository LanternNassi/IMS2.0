using AutoMapper;
using ImsServer.Models.UserX;
using ImsServer.Models.StoreX;
using ImsServer.Models.CategoryX;

namespace ImsServer.Models{

    public class MappingProfile : Profile {

        public MappingProfile()
        {
            
            CreateMap<User , UserDto>().ReverseMap();

            CreateMap<Store, StoreDto>().ReverseMap();
            CreateMap<Store , SimpleStoreDto>().ReverseMap();

            CreateMap<Category, CategoryDto>().ReverseMap();
            CreateMap<Category, SimpleCategoryDto>().ReverseMap();


        }
    }


}

