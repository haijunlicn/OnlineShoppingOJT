package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.WishlistDTO;
import com.maven.OnlineShoppingSB.dto.WishlistTitleDTO;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import com.maven.OnlineShoppingSB.entity.WishlistEntity;
import com.maven.OnlineShoppingSB.entity.WishlistTitleEntity;
import com.maven.OnlineShoppingSB.repository.ProductRepository;
import com.maven.OnlineShoppingSB.repository.WishlistRepository;
import com.maven.OnlineShoppingSB.repository.WishlistTitleRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    @Autowired
    private WishlistTitleRepository wishlistTitleRepository;

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ModelMapper mapper;

    public WishlistTitleEntity createWishlistTitle(WishlistTitleDTO dto) {
        WishlistTitleEntity title = new WishlistTitleEntity();
        title.setUserId(dto.getUserId());
        title.setTitle(dto.getTitle());
        title.setCreatedDate(LocalDateTime.now());
        title.setUpdatedDate(LocalDateTime.now());
        return wishlistTitleRepository.save(title);
    }

    public void addToWishlist(WishlistDTO dto) {
        WishlistTitleEntity title = wishlistTitleRepository.findById(dto.getWishlistTitleId())
                .orElseThrow(() -> new RuntimeException("Wishlist title not found"));

        ProductEntity product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        WishlistEntity wish = new WishlistEntity();
        wish.setWishlistTitle(title);
        wish.setProduct(product);
        wish.setCreatedDate(LocalDateTime.now());

        wishlistRepository.save(wish);
    }

//    public List<WishlistTitleEntity> getTitlesByUser(Long userId) {
//        return wishlistTitleRepository.findByUserId(userId);
//    }

    public List<WishlistTitleDTO> getTitlesByUser(Long userId) {
        List<WishlistTitleEntity> entities = wishlistTitleRepository.findByUserId(userId);
        return entities.stream()
                .map(this::convertToDto)
                .toList();
    }


    private WishlistTitleDTO convertToDto(WishlistTitleEntity entity) {
        WishlistTitleDTO dto = mapper.map(entity, WishlistTitleDTO.class);

        // Manually map nested wishes if needed
        if (entity.getWishes() != null) {
            List<WishlistDTO> wishDtos = entity.getWishes().stream()
                    .map(wish -> {
                        WishlistDTO wishDto = new WishlistDTO();
                        wishDto.setWishlistTitleId(wish.getWishlistTitle().getId());
                        wishDto.setProductId(wish.getProduct().getId());
                        wishDto.setProductName(wish.getProduct().getName());
                        return wishDto;
                    })
                    .toList();
            dto.setWishes(wishDtos);
        }
        return dto;
    }


    public List<WishlistEntity> getWishesByTitle(Long titleId) {
        return wishlistRepository.findByWishlistTitleId(titleId);
    }

    public List<Long> getWishedProductIdsByUser(Long userId) {
        return wishlistRepository.findByWishlistTitleUserId(userId)
                .stream()
                .map(wish -> wish.getProduct().getId())
                .distinct()
                .toList();
    }
    public void removeByUserIdAndProductId(Long userId, Long productId) {
        List<WishlistEntity> wishList = wishlistRepository.findByWishlistTitleUserId(userId);

        for (WishlistEntity wish : wishList) {
            if (wish.getProduct().getId().equals(productId)) {
                wishlistRepository.delete(wish);

            }
        }
    }
    public List<WishlistDTO> getProductsByWishlistTitle(Long titleId) {
        List<WishlistEntity> wishlistEntities = wishlistRepository.findByWishlistTitleId(titleId);

        return wishlistEntities.stream().map(entity -> {
            WishlistDTO dto = new WishlistDTO();
            dto.setWishlistTitleId(entity.getWishlistTitle().getId());
            dto.setProductId(entity.getProduct().getId());

            // Set productName from the product entity
            if (entity.getProduct() != null) {
                dto.setProductName(entity.getProduct().getName());
            } else {
                dto.setProductName(null);
            }

            return dto;
        }).collect(Collectors.toList());
    }

    public void removeFromSpecificTitle(Long userId, Long titleId, Long productId) {
        List<WishlistEntity> wishlistItems = wishlistRepository.findByWishlistTitleUserIdAndWishlistTitleId(userId, titleId);

        for (WishlistEntity wish : wishlistItems) {
            if (wish.getProduct().getId().equals(productId)) {
                wishlistRepository.delete(wish);
                break; // ✅ Remove only one item in the specific title
            }
        }
    }
    public void deleteWishlistTitle(Long titleId) {
        wishlistTitleRepository.deleteById(titleId);
    }

}
