package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.learn_progress.*;
import com.languagelearning.entity.*;
import com.languagelearning.repository.mysql.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearnProgressService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final SkillTreeRepository skillTreeRepository;
    private final SkillNodeRepository skillNodeRepository;
    private final UserSkillTreeProgressRepository userSkillTreeProgressRepository;
    private final UserNodeProgressRepository userNodeProgressRepository;
    private final LevelRepository levelRepository;

    /**
     * Danh sách tóm tắt tiến trình học của tất cả user (có phân trang).
     */
    @Transactional(readOnly = true)
    public Page<UserLearnSummaryDto> getSummaryList(int page, int size, String search) {
        List<User> allUsers = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        // Lọc theo search (email hoặc tên)
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            allUsers = allUsers.stream()
                    .filter(u -> u.getEmail().toLowerCase().contains(q) ||
                            userProfileRepository.findByUserId(u.getId())
                                    .map(p -> p.getFullName() != null && p.getFullName().toLowerCase().contains(q))
                                    .orElse(false))
                    .collect(Collectors.toList());
        }

        int total = allUsers.size();
        int from = page * size;
        int to = Math.min(from + size, total);
        List<User> pageUsers = from >= total ? List.of() : allUsers.subList(from, to);

        List<UserLearnSummaryDto> dtos = pageUsers.stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, PageRequest.of(page, size), total);
    }

    /**
     * Chi tiết tiến trình học của một user (tất cả tree + node).
     */
    @Transactional(readOnly = true)
    public UserLearnProgressDto getDetail(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(userId);

        Integer levelId = profileOpt.map(UserProfile::getCurrentLevel).orElse(null);
        String levelName = null;
        if (levelId != null) {
            levelName = levelRepository.findById(levelId)
                    .map(Level::getLevelName).orElse(null);
        }

        List<TreeProgressDto> treeDtos = new ArrayList<>();
        int completedTrees = 0, totalTrees = 0, completedNodes = 0, totalNodes = 0;
        String currentProgressLabel = null;

        if (levelId != null) {
            // Lấy tất cả trees của level (chưa sort)
            List<SkillTree> allTrees = skillTreeRepository.findByLevel_IdOrderByOrderIndex(levelId);
            totalTrees = allTrees.size();

            Map<Integer, UserSkillTreeProgress> treeProgressMap =
                    userSkillTreeProgressRepository.findByUser(user).stream()
                            .filter(p -> p.getSkillTree() != null)
                            .collect(Collectors.toMap(
                                    p -> p.getSkillTree().getId(),
                                    p -> p,
                                    (a, b) -> a));

            // Sort theo lộ trình gốc của user:
            // - Trees đã interact: dùng initialOrderIndex (order_index lúc user bắt đầu học tree đó)
            //   Fallback về treeId nếu initialOrderIndex null (bản ghi cũ trước khi có cột này)
            // - Trees chưa học (locked/không có progress): dùng order_index hiện tại
            List<SkillTree> trees = allTrees.stream()
                    .sorted((a, b) -> {
                        UserSkillTreeProgress pa = treeProgressMap.get(a.getId());
                        UserSkillTreeProgress pb = treeProgressMap.get(b.getId());
                        boolean aInteracted = pa != null && pa.getStatus() != UserSkillTreeProgress.ProgressStatus.locked;
                        boolean bInteracted = pb != null && pb.getStatus() != UserSkillTreeProgress.ProgressStatus.locked;
                        if (aInteracted && bInteracted) {
                            int oa = pa.getInitialOrderIndex() != null ? pa.getInitialOrderIndex() : a.getId();
                            int ob = pb.getInitialOrderIndex() != null ? pb.getInitialOrderIndex() : b.getId();
                            return Integer.compare(oa, ob);
                        }
                        if (aInteracted) return -1;
                        if (bInteracted) return 1;
                        return Integer.compare(a.getOrderIndex(), b.getOrderIndex());
                    })
                    .collect(Collectors.toList());

            Map<Integer, Double> treeAccuracyMap = treeProgressMap.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> e.getValue().getAccuracy() != null ? e.getValue().getAccuracy() : 0.0));

            Map<Integer, UserNodeProgress> nodeProgressMap =
                    userNodeProgressRepository.findByUser(user).stream()
                            .filter(p -> p.getNode() != null)
                            .collect(Collectors.toMap(
                                    p -> p.getNode().getId(),
                                    p -> p,
                                    (a, b) -> a));

            int activeTreeIdx = -1;

            for (int ti = 0; ti < trees.size(); ti++) {
                SkillTree tree = trees.get(ti);
                UserSkillTreeProgress tp = treeProgressMap.get(tree.getId());
                UserSkillTreeProgress.ProgressStatus treeStatus =
                        tp != null ? tp.getStatus() : UserSkillTreeProgress.ProgressStatus.locked;

                if (treeStatus == UserSkillTreeProgress.ProgressStatus.done) completedTrees++;
                if (treeStatus == UserSkillTreeProgress.ProgressStatus.in_progress && activeTreeIdx == -1)
                    activeTreeIdx = ti;
                if (treeStatus != UserSkillTreeProgress.ProgressStatus.done && activeTreeIdx == -1)
                    activeTreeIdx = ti;

                List<SkillNode> nodes = skillNodeRepository.findBySkillTree_IdOrderByOrderIndex(tree.getId());
                totalNodes += nodes.size();

                List<NodeProgressDto> nodeDtos = new ArrayList<>();
                for (SkillNode node : nodes) {
                    UserNodeProgress np = nodeProgressMap.get(node.getId());
                    String nodeStatus = np != null ? np.getStatus().name() : "not_started";
                    if (np != null && np.getStatus() == UserNodeProgress.NodeProgressStatus.completed)
                        completedNodes++;

                    nodeDtos.add(NodeProgressDto.builder()
                            .nodeId(node.getId())
                            .title(node.getTitle())
                            .nodeType(node.getNodeType() != null ? node.getNodeType().name() : null)
                            .orderIndex(node.getOrderIndex())
                            .status(nodeStatus)
                            .earnedXp(np != null ? np.getEarnedXp() : 0)
                            .maxXp(np != null ? np.getMaxXp() : 0)
                            .attemptCount(np != null ? np.getAttemptCount() : 0)
                            .build());
                }

                treeDtos.add(TreeProgressDto.builder()
                        .treeId(tree.getId())
                        .orderIndex(tree.getOrderIndex())
                        .status(treeStatus.name())
                        .accuracy(treeAccuracyMap.getOrDefault(tree.getId(), 0.0))
                        .nodes(nodeDtos)
                        .build());
            }

            // Tính currentProgressLabel
            if (activeTreeIdx >= 0) {
                SkillTree activeTree = trees.get(activeTreeIdx);
                List<SkillNode> nodes = skillNodeRepository.findBySkillTree_IdOrderByOrderIndex(activeTree.getId());
                int activeNodeIdx = 1;
                for (int ni = 0; ni < nodes.size(); ni++) {
                    UserNodeProgress np = nodeProgressMap.get(nodes.get(ni).getId());
                    if (np != null && np.getStatus() == UserNodeProgress.NodeProgressStatus.completed) {
                        activeNodeIdx = ni + 2;
                    } else {
                        activeNodeIdx = ni + 1;
                        break;
                    }
                }
                activeNodeIdx = Math.min(activeNodeIdx, nodes.size());
                currentProgressLabel = "Tree " + (activeTreeIdx + 1) + " - Node " + activeNodeIdx + "/" + nodes.size();
            }
        }

        return UserLearnProgressDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(profileOpt.map(UserProfile::getFullName).orElse(null))
                .avatarUrl(profileOpt.map(UserProfile::getAvatarUrl).orElse(null))
                .currentLevelId(levelId)
                .currentLevelName(levelName)
                .completedTrees(completedTrees)
                .totalTrees(totalTrees)
                .completedNodes(completedNodes)
                .totalNodes(totalNodes)
                .currentProgressLabel(currentProgressLabel)
                .trees(treeDtos)
                .build();
    }

    private UserLearnSummaryDto toSummary(User user) {
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(user.getId());
        Integer levelId = profileOpt.map(UserProfile::getCurrentLevel).orElse(null);
        String levelName = null;
        int completedTrees = 0, totalTrees = 0;
        String label = null;

        if (levelId != null) {
            levelName = levelRepository.findById(levelId).map(Level::getLevelName).orElse(null);
            List<SkillTree> allTrees = skillTreeRepository.findByLevel_IdOrderByOrderIndex(levelId);
            totalTrees = allTrees.size();

            Map<Integer, UserSkillTreeProgress> treeProgressMap =
                    userSkillTreeProgressRepository.findByUser(user).stream()
                            .filter(p -> p.getSkillTree() != null)
                            .collect(Collectors.toMap(
                                    p -> p.getSkillTree().getId(),
                                    p -> p,
                                    (a, b) -> a));

            // Sort theo lộ trình gốc của user:
            // - Trees đã interact: dùng initialOrderIndex (order_index lúc user bắt đầu học tree đó)
            //   Fallback về treeId nếu initialOrderIndex null (bản ghi cũ trước khi có cột này)
            // - Trees chưa học (locked/không có progress): dùng order_index hiện tại
            List<SkillTree> trees = allTrees.stream()
                    .sorted((a, b) -> {
                        UserSkillTreeProgress pa = treeProgressMap.get(a.getId());
                        UserSkillTreeProgress pb = treeProgressMap.get(b.getId());
                        boolean aInteracted = pa != null && pa.getStatus() != UserSkillTreeProgress.ProgressStatus.locked;
                        boolean bInteracted = pb != null && pb.getStatus() != UserSkillTreeProgress.ProgressStatus.locked;
                        if (aInteracted && bInteracted) {
                            int oa = pa.getInitialOrderIndex() != null ? pa.getInitialOrderIndex() : a.getId();
                            int ob = pb.getInitialOrderIndex() != null ? pb.getInitialOrderIndex() : b.getId();
                            return Integer.compare(oa, ob);
                        }
                        if (aInteracted) return -1;
                        if (bInteracted) return 1;
                        return Integer.compare(a.getOrderIndex(), b.getOrderIndex());
                    })
                    .collect(Collectors.toList());

            Map<Integer, UserNodeProgress> nodeProgressMap =
                    userNodeProgressRepository.findByUser(user).stream()
                            .filter(p -> p.getNode() != null)
                            .collect(Collectors.toMap(
                                    p -> p.getNode().getId(),
                                    p -> p,
                                    (a, b) -> a));

            int activeTreeIdx = -1;
            for (int ti = 0; ti < trees.size(); ti++) {
                UserSkillTreeProgress tp = treeProgressMap.get(trees.get(ti).getId());
                UserSkillTreeProgress.ProgressStatus s =
                        tp != null ? tp.getStatus() : UserSkillTreeProgress.ProgressStatus.locked;
                if (s == UserSkillTreeProgress.ProgressStatus.done) completedTrees++;
                if (s == UserSkillTreeProgress.ProgressStatus.in_progress && activeTreeIdx == -1) activeTreeIdx = ti;
                if (s != UserSkillTreeProgress.ProgressStatus.done && activeTreeIdx == -1) activeTreeIdx = ti;
            }

            if (activeTreeIdx >= 0) {
                List<SkillNode> nodes = skillNodeRepository
                        .findBySkillTree_IdOrderByOrderIndex(trees.get(activeTreeIdx).getId());
                int activeNodeIdx = 1;
                for (int ni = 0; ni < nodes.size(); ni++) {
                    UserNodeProgress np = nodeProgressMap.get(nodes.get(ni).getId());
                    if (np != null && np.getStatus() == UserNodeProgress.NodeProgressStatus.completed) {
                        activeNodeIdx = ni + 2;
                    } else {
                        activeNodeIdx = ni + 1;
                        break;
                    }
                }
                activeNodeIdx = Math.min(activeNodeIdx, nodes.size());
                label = "Tree " + (activeTreeIdx + 1) + " - Node " + activeNodeIdx + "/" + nodes.size();
            }
        }

        return UserLearnSummaryDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(profileOpt.map(UserProfile::getFullName).orElse(null))
                .avatarUrl(profileOpt.map(UserProfile::getAvatarUrl).orElse(null))
                .currentLevelId(levelId)
                .currentLevelName(levelName)
                .completedTrees(completedTrees)
                .totalTrees(totalTrees)
                .currentProgressLabel(label)
                .build();
    }
}
