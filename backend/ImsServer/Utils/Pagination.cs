using Microsoft.EntityFrameworkCore;


namespace ImsServer.Utils{

    public class Pagination
    {

        public class PaginationData {
            public int TotalCount { get; set; }
            public int PageNumber { get; set; }
            public int PageSize { get; set; }
            public int? Next {get; set;}
            public int? Previous { get; set;}
        }

        public class PagedResult<T>
        {
            public List<T> Items { get; set; } = new();
            public PaginationData Pagination { get; set; }
        }

    

        public static async Task<PagedResult<T>> GetPagedAsync<T>(IQueryable<T> query, int pageNumber, int pageSize)
        {
            int totalCount = await query.CountAsync();
            int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var result = new PagedResult<T>
            {
                Pagination = new PaginationData{
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    Next = pageNumber < totalPages ? pageNumber + 1 : (int?)null,
                    Previous = pageNumber > 1 ? pageNumber - 1 : (int?)null,
                },
                Items = await query.Skip((pageNumber - 1) * pageSize)
                                .Take(pageSize)
                                .ToListAsync()
            };

            return result;
        }



    }

    
}