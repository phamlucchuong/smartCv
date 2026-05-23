package vn.chuongpl.ai_engine_service.integration.cv;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.chuongpl.ai_engine_service.enums.ErrorCode;
import vn.chuongpl.ai_engine_service.exception.AppException;

import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class CvTextExtractor {

    private final RestTemplate restTemplate = new RestTemplate();

    public String resolveCvText(String cvText, String cvUrl) {
        if (cvText != null && !cvText.isBlank()) {
            return cvText.trim();
        }
        if (cvUrl == null || cvUrl.isBlank()) {
            throw new AppException(ErrorCode.CV_TEXT_REQUIRED);
        }

        try {
            byte[] fileBytes = restTemplate.getForObject(cvUrl, byte[].class);
            if (fileBytes == null || fileBytes.length == 0) {
                throw new AppException(ErrorCode.CV_TEXT_REQUIRED);
            }

            if (looksLikePdf(fileBytes)) {
                try (PDDocument document = Loader.loadPDF(fileBytes)) {
                    return new PDFTextStripper().getText(document).trim();
                }
            }
            return new String(fileBytes, StandardCharsets.UTF_8).trim();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to extract CV text: {}", e.getMessage());
            throw new AppException(ErrorCode.AI_PROCESSING_FAILED);
        }
    }

    private boolean looksLikePdf(byte[] bytes) {
        return bytes.length >= 4 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }
}
