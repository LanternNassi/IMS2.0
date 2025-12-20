using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.FixedAssetX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FixedAssetsController : ControllerBase
    {
        private readonly DBContext _db;

        public FixedAssetsController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetFixedAssets(
            [FromQuery] AssetType? type,
            [FromQuery] bool? isActive,
            [FromQuery] DateTime? purchasedAfter,
            [FromQuery] DateTime? purchasedBefore,
            [FromQuery] decimal? minValue,
            [FromQuery] decimal? maxValue,
            [FromQuery] string? searchTerm,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.FixedAssets
                .Include(fa => fa.LinkedFinancialAccount)
                .OrderByDescending(fa => fa.PurchaseDate)
                .AsQueryable();

            // Apply filters
            if (type.HasValue)
            {
                query = query.Where(fa => fa.Type == type.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(fa => fa.IsActive == isActive.Value);
            }

            if (purchasedAfter.HasValue)
            {
                query = query.Where(fa => fa.PurchaseDate >= purchasedAfter.Value);
            }

            if (purchasedBefore.HasValue)
            {
                query = query.Where(fa => fa.PurchaseDate <= purchasedBefore.Value);
            }

            if (minValue.HasValue)
            {
                query = query.Where(fa => fa.CurrentValue >= minValue.Value);
            }

            if (maxValue.HasValue)
            {
                query = query.Where(fa => fa.CurrentValue <= maxValue.Value);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(fa => 
                    fa.Name.Contains(searchTerm) || 
                    (fa.SerialNumber != null && fa.SerialNumber.Contains(searchTerm)) ||
                    (fa.Manufacturer != null && fa.Manufacturer.Contains(searchTerm)));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var assets = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var paginationInfo = new
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasPreviousPage = page > 1,
                HasNextPage = page < totalPages
            };

            if (!includeMetadata)
            {
                return Ok(new
                {
                    Pagination = paginationInfo,
                    FixedAssets = assets
                });
            }

            // Calculate metadata (using all filtered data)
            var allAssets = await query.ToListAsync();
            var metadata = new
            {
                TotalPurchaseValue = allAssets.Sum(fa => fa.PurchasePrice),
                TotalCurrentValue = allAssets.Sum(fa => fa.CurrentValue),
                TotalDepreciation = allAssets.Sum(fa => fa.PurchasePrice - fa.CurrentValue),
                TotalAssets = allAssets.Count,
                ActiveAssets = allAssets.Count(fa => fa.IsActive),
                DisposedAssets = allAssets.Count(fa => fa.DisposalDate.HasValue),
                AssetTypeBreakdown = allAssets
                    .GroupBy(fa => fa.Type)
                    .Select(g => new
                    {
                        Type = g.Key.ToString(),
                        Count = g.Count(),
                        TotalPurchaseValue = g.Sum(fa => fa.PurchasePrice),
                        TotalCurrentValue = g.Sum(fa => fa.CurrentValue)
                    })
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                FixedAssets = assets
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFixedAsset(Guid id)
        {
            var asset = await _db.FixedAssets
                .Include(fa => fa.LinkedFinancialAccount)
                .FirstOrDefaultAsync(fa => fa.Id == id);

            if (asset == null) return NotFound();

            // Calculate accumulated depreciation
            var yearsOwned = (DateTime.UtcNow - asset.PurchaseDate).TotalDays / 365.25;
            var accumulatedDepreciation = asset.PurchasePrice - asset.CurrentValue;
            var remainingLife = asset.UsefulLifeYears - yearsOwned;

            return Ok(new
            {
                Asset = asset,
                DepreciationInfo = new
                {
                    AccumulatedDepreciation = Math.Round(accumulatedDepreciation, 2),
                    YearsOwned = Math.Round(yearsOwned, 2),
                    RemainingUsefulLife = Math.Round(remainingLife, 2),
                    DepreciationPerYear = asset.UsefulLifeYears > 0 
                        ? Math.Round(asset.PurchasePrice / asset.UsefulLifeYears, 2) 
                        : 0
                }
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateFixedAsset([FromBody] CreateFixedAssetDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            var asset = new FixedAsset
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                Name = dto.Name,
                Type = dto.Type,
                PurchasePrice = dto.PurchasePrice,
                PurchaseDate = dto.PurchaseDate == default ? DateTime.UtcNow : dto.PurchaseDate,
                CurrentValue = dto.PurchasePrice, // Initially same as purchase price
                DepreciationRate = dto.DepreciationRate,
                UsefulLifeYears = dto.UsefulLifeYears,
                LinkedFinancialAccountId = dto.LinkedFinancialAccountId,
                SerialNumber = dto.SerialNumber,
                Manufacturer = dto.Manufacturer,
                Description = dto.Description,
                IsActive = true
            };

            if (dto.LinkedFinancialAccountId.HasValue)
            {
                var account = await _db.FinancialAccounts.FindAsync(dto.LinkedFinancialAccountId.Value);
                if (account == null)
                {
                    return BadRequest("Linked financial account not found. Provide a valid LinkedFinancialAccountId.");
                }

                asset.LinkedFinancialAccount = account;

                // Update account balance
                account.Balance -= dto.PurchasePrice;
            }

            _db.FixedAssets.Add(asset);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFixedAsset), new { id = asset.Id }, asset);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFixedAsset(Guid id, [FromBody] UpdateFixedAssetDto dto)
        {
            var asset = await _db.FixedAssets.FindAsync(id);

            if (asset == null) return NotFound();

            if (dto.Name != null) asset.Name = dto.Name;
            if (dto.SerialNumber != null) asset.SerialNumber = dto.SerialNumber;
            if (dto.Manufacturer != null) asset.Manufacturer = dto.Manufacturer;
            if (dto.Description != null) asset.Description = dto.Description;
            if (dto.DepreciationRate.HasValue) asset.DepreciationRate = dto.DepreciationRate.Value;
            if (dto.UsefulLifeYears.HasValue) asset.UsefulLifeYears = dto.UsefulLifeYears.Value;
            if (dto.DisposalDate.HasValue) asset.DisposalDate = dto.DisposalDate.Value;
            if (dto.DisposalValue.HasValue) asset.DisposalValue = dto.DisposalValue.Value;
            if (dto.IsActive.HasValue) asset.IsActive = dto.IsActive.Value;

            await _db.SaveChangesAsync();

            return Ok(asset);
        }

        [HttpPut("{id}/CalculateDepreciation")]
        public async Task<IActionResult> CalculateDepreciation(Guid id)
        {
            var asset = await _db.FixedAssets.FindAsync(id);

            if (asset == null) return NotFound();

            // Calculate depreciation using straight-line method
            var yearsOwned = (DateTime.UtcNow - asset.PurchaseDate).TotalDays / 365.25;
            var depreciationPerYear = asset.PurchasePrice / asset.UsefulLifeYears;
            var accumulatedDepreciation = (decimal)yearsOwned * depreciationPerYear;

            // Ensure current value doesn't go below zero
            asset.CurrentValue = Math.Max(0, asset.PurchasePrice - accumulatedDepreciation);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                Asset = asset,
                Calculation = new
                {
                    YearsOwned = Math.Round(yearsOwned, 2),
                    DepreciationPerYear = Math.Round(depreciationPerYear, 2),
                    AccumulatedDepreciation = Math.Round(accumulatedDepreciation, 2),
                    UpdatedCurrentValue = asset.CurrentValue
                }
            });
        }

        [HttpPut("{id}/Dispose")]
        public async Task<IActionResult> DisposeAsset(Guid id, [FromQuery] decimal? disposalValue, [FromQuery] DateTime? disposalDate)
        {
            var asset = await _db.FixedAssets.FindAsync(id);

            if (asset == null) return NotFound();

            asset.DisposalDate = disposalDate ?? DateTime.UtcNow;
            asset.DisposalValue = disposalValue;
            asset.IsActive = false;

            await _db.SaveChangesAsync();

            var gainLoss = (disposalValue ?? 0) - asset.CurrentValue;

            return Ok(new
            {
                Asset = asset,
                DisposalSummary = new
                {
                    CurrentValue = asset.CurrentValue,
                    DisposalValue = disposalValue ?? 0,
                    GainOrLoss = Math.Round(gainLoss, 2),
                    Type = gainLoss >= 0 ? "Gain" : "Loss"
                }
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFixedAsset(Guid id)
        {
            var asset = await _db.FixedAssets.FindAsync(id);

            if (asset == null) return NotFound();

            _db.SoftDelete(asset);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
