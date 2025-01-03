using AutoMapper;
using ImsServer.Models.UserX;
using ImsServer.Models.StoreX;

namespace ImsServer.Models{

    public class MappingProfile : Profile {

        public MappingProfile() {
            CreateMap<User , UserDto>().ReverseMap();
            CreateMap<Store, StoreDto>().ReverseMap();
        }
    }


}

