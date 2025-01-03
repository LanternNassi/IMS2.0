namespace ImsServer.Models.UserX{
    public class User : GeneralFields
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string? Email { get; set; }
        public string? Gender {get; set;}
        public string? Telephone {get; set;}
        public string Role { get; set; }
    }

    public class UserDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string? Email { get; set; }
        public string? Gender {get; set;}       
        public string? Telephone {get; set;}
        public string Role { get; set; }
    }

    public class LoginSchema
    {
        public string Username { get; set; }
        public string password { get; set; }
    }
}