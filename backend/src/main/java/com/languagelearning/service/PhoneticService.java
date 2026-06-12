package com.languagelearning.service;

import com.languagelearning.dto.phonetic.PhoneticDto;
import com.languagelearning.entity.Phonetic;
import com.languagelearning.entity.Phonetic.PhoneticType;
import com.languagelearning.repository.mysql.PhoneticRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhoneticService {

    private final PhoneticRepository phoneticRepository;

    /**
     * Trả về Map gồm 2 nhóm:
     *   "vowels"     → danh sách nguyên âm (VOWEL)
     *   "consonants" → danh sách phụ âm (CONSONANT)
     * Mỗi nhóm đã sắp xếp theo display_order.
     */
    public Map<String, List<PhoneticDto>> getPhoneticsByGroup() {
        Map<String, List<PhoneticDto>> result = new LinkedHashMap<>();
        result.put("vowels",     toDto(phoneticRepository.findByTypeOrderByDisplayOrderAsc(PhoneticType.VOWEL)));
        result.put("consonants", toDto(phoneticRepository.findByTypeOrderByDisplayOrderAsc(PhoneticType.CONSONANT)));
        return result;
    }

    private List<PhoneticDto> toDto(List<Phonetic> list) {
        return list.stream().map(a -> new PhoneticDto(
                a.getId(),
                a.getSymbol(),
                a.getType().name(),
                a.getExampleWord(),
                a.getAudioUrl(),
                a.getDisplayOrder()
        )).collect(Collectors.toList());
    }
}
