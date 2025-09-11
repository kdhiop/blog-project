package com.example.blog.config;

import com.example.blog.model.Post;
import com.example.blog.model.User;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Configuration
@Profile("!test")
public class DataInitializer {
    
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    @Transactional
    CommandLineRunner initDatabase(UserRepository userRepository, 
                                 PostRepository postRepository,
                                 PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() > 0) {
                logger.info("데이터가 이미 존재합니다. 초기화를 건너뜁니다.");
                return;
            }

            try {
                User testUser = new User();
                testUser.setUsername("testuser");
                testUser.setPassword(passwordEncoder.encode("password123"));
                testUser = userRepository.save(testUser);

                User adminUser = new User();
                adminUser.setUsername("admin");
                adminUser.setPassword(passwordEncoder.encode("admin123"));
                adminUser = userRepository.save(adminUser);

                Post samplePost1 = new Post();
                samplePost1.setTitle("블로그에 오신 것을 환영합니다!");
                samplePost1.setContent("이것은 첫 번째 샘플 게시글입니다. 이 블로그에서는 자유롭게 글을 작성하고 다른 사용자들과 댓글로 소통할 수 있습니다.\n\n주요 기능:\n- 게시글 작성 및 편집\n- 댓글 시스템\n- 사용자 인증\n- 반응형 디자인");
                samplePost1.setAuthor(adminUser);
                postRepository.save(samplePost1);

                Post samplePost2 = new Post();
                samplePost2.setTitle("블로그 사용법 안내");
                samplePost2.setContent("새 글 작성하기 버튼을 클릭하여 글을 작성할 수 있습니다. 댓글 기능을 통해 다른 사용자들과 소통해보세요!\n\n사용 방법:\n1. 회원가입 또는 로그인\n2. '글쓰기' 버튼 클릭\n3. 제목과 내용 작성\n4. '발행하기' 버튼으로 게시");
                samplePost2.setAuthor(adminUser);
                postRepository.save(samplePost2);

                Post userPost = new Post();
                userPost.setTitle("첫 번째 사용자 게시글");
                userPost.setContent("안녕하세요! testuser입니다. 이 블로그에서 다양한 이야기를 나누고 싶습니다.");
                userPost.setAuthor(testUser);
                postRepository.save(userPost);

                logger.info("초기 데이터 생성 완료: 사용자 2명, 게시글 3개");
                logger.info("테스트 계정 1 - username: testuser, password: password123");
                logger.info("테스트 계정 2 - username: admin, password: admin123");
            } catch (Exception e) {
                logger.error("초기 데이터 생성 중 오류 발생", e);
            }
        };
    }
}