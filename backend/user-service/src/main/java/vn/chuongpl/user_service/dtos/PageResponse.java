package vn.chuongpl.user_service.dtos;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse<T> {
    List<T> items;
    long total;
    int page;
    int pageSize;
    int totalPages;

    public static <T> PageResponse<T> from(Page<T> page) {
        PageResponse<T> res = new PageResponse<>();
        res.items = page.getContent();
        res.page = page.getNumber();
        res.pageSize = page.getSize();
        res.total = page.getTotalElements();
        res.totalPages = page.getTotalPages();
        return res;
    }
}
