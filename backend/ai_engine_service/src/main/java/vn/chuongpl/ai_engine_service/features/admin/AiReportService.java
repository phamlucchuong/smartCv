package vn.chuongpl.ai_engine_service.features.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.chuongpl.ai_engine_service.features.analysis.AiUsageLog;
import vn.chuongpl.ai_engine_service.features.analysis.AiUsageLogRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AiReportService {

    private final AiUsageLogRepository repository;

    public List<AiUsageReportItem> getUsageReport(String timeframe) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        
        if ("day".equalsIgnoreCase(timeframe)) {
            start = now.minusDays(1);
        } else if ("week".equalsIgnoreCase(timeframe)) {
            start = now.minusWeeks(1);
        } else if ("month".equalsIgnoreCase(timeframe)) {
            start = now.minusMonths(1);
        } else {
            start = now.minusYears(1);
        }

        List<AiUsageLog> logs = repository.findByCreatedAtBetween(start, now);
        
        if ("day".equalsIgnoreCase(timeframe)) {
            return aggregateByHour(logs, start, now);
        } else if ("week".equalsIgnoreCase(timeframe)) {
            return aggregateByDay(logs, start, now);
        } else if ("month".equalsIgnoreCase(timeframe)) {
            return aggregateByWeek(logs, start, now);
        } else {
            return aggregateByMonth(logs, start, now);
        }
    }

    private List<AiUsageReportItem> aggregateByHour(List<AiUsageLog> logs, LocalDateTime start, LocalDateTime end) {
        Map<String, AiUsageReportItem> map = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:00");
        
        for (LocalDateTime time = start; time.isBefore(end); time = time.plusHours(2)) {
            String label = time.format(formatter);
            map.put(label, AiUsageReportItem.builder().date(label).promptTokens(0).completionTokens(0).cost(0.0).build());
        }

        for (AiUsageLog log : logs) {
            String label = log.getCreatedAt().format(formatter);
            String matchedLabel = map.keySet().stream()
                    .filter(k -> Integer.parseInt(k.split(":")[0]) <= log.getCreatedAt().getHour())
                    .reduce((first, second) -> second)
                    .orElse(map.keySet().isEmpty() ? label : map.keySet().iterator().next());
            
            AiUsageReportItem item = map.get(matchedLabel);
            if (item != null) {
                item.setPromptTokens(item.getPromptTokens() + log.getPromptTokens());
                item.setCompletionTokens(item.getCompletionTokens() + log.getCompletionTokens());
                item.setCost(item.getCost() + log.getCost());
            }
        }
        return new ArrayList<>(map.values());
    }

    private List<AiUsageReportItem> aggregateByDay(List<AiUsageLog> logs, LocalDateTime start, LocalDateTime end) {
        Map<String, AiUsageReportItem> map = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        
        for (LocalDateTime time = start; time.isBefore(end.plusDays(1)); time = time.plusDays(1)) {
            String label = time.format(formatter);
            map.put(label, AiUsageReportItem.builder().date(label).promptTokens(0).completionTokens(0).cost(0.0).build());
        }

        for (AiUsageLog log : logs) {
            String label = log.getCreatedAt().format(formatter);
            AiUsageReportItem item = map.get(label);
            if (item != null) {
                item.setPromptTokens(item.getPromptTokens() + log.getPromptTokens());
                item.setCompletionTokens(item.getCompletionTokens() + log.getCompletionTokens());
                item.setCost(item.getCost() + log.getCost());
            }
        }
        return new ArrayList<>(map.values());
    }

    private List<AiUsageReportItem> aggregateByWeek(List<AiUsageLog> logs, LocalDateTime start, LocalDateTime end) {
        Map<String, AiUsageReportItem> map = new LinkedHashMap<>();
        
        map.put("Tuần 1", AiUsageReportItem.builder().date("Tuần 1").promptTokens(0).completionTokens(0).cost(0.0).build());
        map.put("Tuần 2", AiUsageReportItem.builder().date("Tuần 2").promptTokens(0).completionTokens(0).cost(0.0).build());
        map.put("Tuần 3", AiUsageReportItem.builder().date("Tuần 3").promptTokens(0).completionTokens(0).cost(0.0).build());
        map.put("Tuần 4", AiUsageReportItem.builder().date("Tuần 4").promptTokens(0).completionTokens(0).cost(0.0).build());

        for (AiUsageLog log : logs) {
            long daysAgo = java.time.temporal.ChronoUnit.DAYS.between(log.getCreatedAt(), end);
            String label;
            if (daysAgo < 7) {
                label = "Tuần 4";
            } else if (daysAgo < 14) {
                label = "Tuần 3";
            } else if (daysAgo < 21) {
                label = "Tuần 2";
            } else {
                label = "Tuần 1";
            }
            AiUsageReportItem item = map.get(label);
            if (item != null) {
                item.setPromptTokens(item.getPromptTokens() + log.getPromptTokens());
                item.setCompletionTokens(item.getCompletionTokens() + log.getCompletionTokens());
                item.setCost(item.getCost() + log.getCost());
            }
        }
        return new ArrayList<>(map.values());
    }

    private List<AiUsageReportItem> aggregateByMonth(List<AiUsageLog> logs, LocalDateTime start, LocalDateTime end) {
        Map<String, AiUsageReportItem> map = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("'T'M");
        
        for (LocalDateTime time = start; time.isBefore(end.plusMonths(1)); time = time.plusMonths(1)) {
            String label = time.format(formatter);
            map.put(label, AiUsageReportItem.builder().date(label).promptTokens(0).completionTokens(0).cost(0.0).build());
        }

        for (AiUsageLog log : logs) {
            String label = log.getCreatedAt().format(formatter);
            AiUsageReportItem item = map.get(label);
            if (item != null) {
                item.setPromptTokens(item.getPromptTokens() + log.getPromptTokens());
                item.setCompletionTokens(item.getCompletionTokens() + log.getCompletionTokens());
                item.setCost(item.getCost() + log.getCost());
            }
        }
        return new ArrayList<>(map.values());
    }
}
